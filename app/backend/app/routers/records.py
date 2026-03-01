from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.record import Record
from app.models.user import User
from app.schemas.record import RecordOut

router = APIRouter(prefix="/records", tags=["records"])


@router.get("/quests/{quest_id}", response_model=list[RecordOut])
async def list_quest_records(
    quest_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[Record]:
    result = await session.execute(
        select(Record)
        .options(selectinload(Record.photos))
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
        .options(selectinload(Record.photos))
        .where(Record.user_id == current_user.id, Record.quest_id == quest_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record
