from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.quest import Quest
from app.models.user import User
from app.schemas.quest import QuestCreate, QuestOut

router = APIRouter(prefix="/quests", tags=["quests"])


@router.get("", response_model=list[QuestOut])
async def list_quests(session: AsyncSession = Depends(get_session)) -> list[Quest]:
    result = await session.execute(
        select(Quest).options(selectinload(Quest.charts)).order_by(Quest.start_date.desc())
    )
    return result.scalars().all()


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
    quest = Quest(**body.model_dump())
    session.add(quest)
    await session.commit()
    await session.refresh(quest)
    return quest
