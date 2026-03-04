from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.chart import Chart
from app.models.quest import Quest
from app.models.user import User
from app.schemas.record import PhotoAnalysisResult
from app.services.storage import upload_photo_bytes
from app.services.vision import analyze_game_photo

router = APIRouter(prefix="/photos", tags=["photos"])

MAX_FILE_SIZE = 30 * 1024 * 1024  # 30MB


@router.post("/analyze", response_model=PhotoAnalysisResult)
async def analyze_photo(
    quest_id: int,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PhotoAnalysisResult:
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 파일만 업로드할 수 있습니다.",
        )

    # Read file and check size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="파일 크기가 30MB를 초과합니다.",
        )

    # Upload to storage
    file_url = await upload_photo_bytes(
        file_bytes, file.content_type, file.filename or "photo.jpg",
        current_user.id, quest_id,
    )

    # Analyze with Gemini Vision
    extracted = await analyze_game_photo(file_bytes, file.content_type)

    # Try to match song_name + difficulty against quest charts
    matched_chart_id = None
    if extracted.get("song_name"):
        result = await session.execute(
            select(Quest).options(selectinload(Quest.charts)).where(Quest.id == quest_id)
        )
        quest = result.scalar_one_or_none()
        if quest:
            extracted_name = extracted["song_name"].lower().replace(" ", "")
            extracted_diff = (extracted.get("difficulty") or "").upper()
            for chart in quest.charts:
                chart_name = chart.song_name.lower().replace(" ", "")
                if chart_name == extracted_name and chart.difficulty.upper() == extracted_diff:
                    matched_chart_id = chart.id
                    break
            # Fallback: match by song_name only if difficulty didn't match
            if matched_chart_id is None:
                for chart in quest.charts:
                    chart_name = chart.song_name.lower().replace(" ", "")
                    if chart_name == extracted_name:
                        matched_chart_id = chart.id
                        break

    return PhotoAnalysisResult(
        file_url=file_url,
        extracted_song_name=extracted.get("song_name"),
        extracted_difficulty=extracted.get("difficulty"),
        extracted_score=extracted.get("score"),
        matched_chart_id=matched_chart_id,
    )
