from datetime import datetime
from pydantic import BaseModel


class PhotoOut(BaseModel):
    id: int
    record_item_id: int
    file_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RecordItemOut(BaseModel):
    id: int
    record_id: int
    chart_id: int
    song_name: str
    difficulty: str
    score: int
    created_at: datetime
    photo: PhotoOut | None = None

    model_config = {"from_attributes": True}


class RecordOut(BaseModel):
    id: int
    user_id: int
    quest_id: int
    created_at: datetime
    updated_at: datetime
    items: list[RecordItemOut] = []

    model_config = {"from_attributes": True}


class PhotoAnalysisResult(BaseModel):
    file_url: str
    extracted_song_name: str | None = None
    extracted_difficulty: str | None = None
    extracted_score: int | None = None
    matched_chart_id: int | None = None


class RecordItemSubmission(BaseModel):
    chart_id: int
    song_name: str
    difficulty: str
    score: int
    file_url: str


class SubmissionRequest(BaseModel):
    items: list[RecordItemSubmission]
