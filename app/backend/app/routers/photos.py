from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.photo import Photo
from app.models.record import Record
from app.models.user import User
from app.schemas.record import PhotoOut
from app.services.storage import upload_photo

router = APIRouter(prefix="/photos", tags=["photos"])


@router.post("", response_model=PhotoOut, status_code=status.HTTP_201_CREATED)
async def upload_chart_photo(
    quest_id: int,
    chart_id: int,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Photo:
    result = await session.execute(
        select(Record).where(Record.user_id == current_user.id, Record.quest_id == quest_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        record = Record(user_id=current_user.id, quest_id=quest_id)
        session.add(record)
        await session.flush()

    file_url = await upload_photo(file, current_user.id, quest_id, chart_id)

    photo = Photo(record_id=record.id, chart_id=chart_id, file_url=file_url)
    session.add(photo)
    await session.commit()
    await session.refresh(photo)
    return photo


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await session.execute(
        select(Photo)
        .join(Record, Photo.record_id == Record.id)
        .where(Photo.id == photo_id, Record.user_id == current_user.id)
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    await session.delete(photo)
    await session.commit()
