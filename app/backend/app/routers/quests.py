from datetime import date

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.chart import Chart
from app.models.quest import Quest
from app.models.user import User
from app.schemas.quest import PickRequest, PickResponse, QuestCreate, QuestOut

router = APIRouter(prefix="/quests", tags=["quests"])

PIURISE_SONG_SELECT_URL = "https://piurise.com/api/arcade/song-select"


@router.get("", response_model=list[QuestOut])
async def list_quests(session: AsyncSession = Depends(get_session)) -> list[Quest]:
    result = await session.execute(
        select(Quest).options(selectinload(Quest.charts)).order_by(Quest.start_date.desc())
    )
    return result.scalars().all()


@router.get("/ongoing", response_model=QuestOut | None)
async def get_ongoing_quest(session: AsyncSession = Depends(get_session)) -> Quest | None:
    today = date.today()
    result = await session.execute(
        select(Quest)
        .options(selectinload(Quest.charts))
        .where(and_(Quest.start_date <= today, Quest.end_date >= today))
    )
    return result.scalar_one_or_none()


@router.get("/{quest_id}", response_model=QuestOut)
async def get_quest(quest_id: int, session: AsyncSession = Depends(get_session)) -> Quest:
    result = await session.execute(
        select(Quest).options(selectinload(Quest.charts)).where(Quest.id == quest_id)
    )
    quest = result.scalar_one_or_none()
    if not quest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quest not found")
    return quest


@router.post("", response_model=QuestOut, status_code=status.HTTP_201_CREATED)
async def create_quest(
    body: QuestCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Quest:
    # Validate date range includes today
    today = date.today()
    if body.start_date > today or body.end_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="시작일과 종료일은 오늘 날짜를 포함해야 합니다.",
        )

    # Check for overlapping quest
    overlap_result = await session.execute(
        select(Quest).where(
            and_(Quest.start_date <= body.end_date, Quest.end_date >= body.start_date)
        )
    )
    if overlap_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="해당 기간에 이미 숙제가 존재합니다.",
        )

    # Auto-generate title from dates
    title = f"{body.start_date.month}/{body.start_date.day} ~ {body.end_date.month}/{body.end_date.day} 숙제"

    quest = Quest(title=title, start_date=body.start_date, end_date=body.end_date)
    session.add(quest)
    await session.flush()

    for chart_data in body.charts:
        chart = Chart(
            quest_id=quest.id,
            song_name=chart_data.song_name,
            difficulty=chart_data.difficulty,
            order=chart_data.order,
        )
        session.add(chart)

    await session.commit()
    await session.refresh(quest)

    # Eagerly load charts for response
    result = await session.execute(
        select(Quest).options(selectinload(Quest.charts)).where(Quest.id == quest.id)
    )
    return result.scalar_one()


@router.post("/pick", response_model=PickResponse)
async def pick_chart(body: PickRequest) -> PickResponse:
    request_body: dict = {
        "minLevel": body.level,
        "maxLevel": body.level,
        "pickCount": 1,
        "excludeSongIds": [],
    }
    if body.mode is not None:
        request_body["mode"] = body.mode

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            PIURISE_SONG_SELECT_URL,
            json=request_body,
            headers={"Content-Type": "application/json"},
            timeout=10.0,
        )
        resp.raise_for_status()

    data = resp.json()
    songs = data.get("songs", [])
    if not songs:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="piurise.com returned no songs",
        )

    song = songs[0]
    song_name = song["songTitle"]

    # Determine S or D from difficultyBgUrl
    bg_url = song.get("difficultyBgUrl", "")
    if bg_url.endswith("d_bg.png"):
        mode_letter = "D"
    else:
        mode_letter = "S"

    difficulty = f"{mode_letter}{song['stepLevel']}"

    return PickResponse(song_name=song_name, difficulty=difficulty)
