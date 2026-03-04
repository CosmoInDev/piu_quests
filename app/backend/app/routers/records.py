from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.chart import Chart
from app.models.photo import Photo
from app.models.record import Record
from app.models.record_item import RecordItem
from app.models.user import User
from app.schemas.record import RecordOut, SubmissionRequest

router = APIRouter(prefix="/records", tags=["records"])


@router.get("/quests/{quest_id}", response_model=list[RecordOut])
async def list_quest_records(
    quest_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[Record]:
    result = await session.execute(
        select(Record)
        .options(selectinload(Record.items).selectinload(RecordItem.photo))
        .where(Record.quest_id == quest_id)
    )
    return result.scalars().all()


@router.get("/me/quests/{quest_id}", response_model=RecordOut)
async def get_my_record(
    quest_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Record:
    result = await session.execute(
        select(Record)
        .options(selectinload(Record.items).selectinload(RecordItem.photo))
        .where(Record.user_id == current_user.id, Record.quest_id == quest_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record


@router.post("/me/quests/{quest_id}/submit", response_model=RecordOut)
async def submit_record(
    quest_id: int,
    body: SubmissionRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Record:
    """Full-sync submit: the request represents the complete desired state.

    Items not in the request are deleted. Items in the request are created or
    kept as-is if unchanged (matched by chart_id + file_url).
    """
    # Check for duplicate chart_ids in submission
    chart_ids = [item.chart_id for item in body.items]
    if len(chart_ids) != len(set(chart_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="중복된 채보가 있습니다.",
        )

    # Validate all chart_ids belong to the quest
    if chart_ids:
        chart_result = await session.execute(
            select(Chart.id).where(Chart.quest_id == quest_id)
        )
        valid_chart_ids = set(chart_result.scalars().all())
        for cid in chart_ids:
            if cid not in valid_chart_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"채보 ID {cid}는 이 숙제에 포함되지 않습니다.",
                )

    # Get or create record
    result = await session.execute(
        select(Record)
        .where(Record.user_id == current_user.id, Record.quest_id == quest_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        record = Record(user_id=current_user.id, quest_id=quest_id)
        session.add(record)
        await session.flush()

    # Load all existing items
    existing_result = await session.execute(
        select(RecordItem)
        .where(RecordItem.record_id == record.id)
    )
    existing_items = list(existing_result.scalars().all())

    # Build lookup of desired state: (chart_id) -> submission data
    desired = {item.chart_id: item for item in body.items}

    # Build lookup of existing: chart_id -> RecordItem
    existing_by_chart: dict[int, RecordItem] = {}
    for item in existing_items:
        existing_by_chart[item.chart_id] = item

    # Delete items not in the request
    for chart_id, existing_item in existing_by_chart.items():
        if chart_id not in desired:
            await session.delete(existing_item)

    # Create or update items
    for item_data in body.items:
        existing_item = existing_by_chart.get(item_data.chart_id)

        if existing_item:
            # Update in place
            existing_item.song_name = item_data.song_name
            existing_item.difficulty = item_data.difficulty
            existing_item.score = item_data.score
            # Update photo URL if changed — load photo explicitly
            photo_result = await session.execute(
                select(Photo).where(Photo.record_item_id == existing_item.id)
            )
            photo = photo_result.scalar_one_or_none()
            if photo:
                photo.file_url = item_data.file_url
            else:
                session.add(Photo(record_item_id=existing_item.id, file_url=item_data.file_url))
        else:
            # Create new
            new_item = RecordItem(
                record_id=record.id,
                chart_id=item_data.chart_id,
                song_name=item_data.song_name,
                difficulty=item_data.difficulty,
                score=item_data.score,
            )
            session.add(new_item)
            await session.flush()
            session.add(Photo(record_item_id=new_item.id, file_url=item_data.file_url))

    await session.commit()

    # Reload with eager loading
    result = await session.execute(
        select(Record)
        .options(selectinload(Record.items).selectinload(RecordItem.photo))
        .where(Record.id == record.id)
    )
    return result.scalar_one()
