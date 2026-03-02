from datetime import datetime
from pydantic import BaseModel


class PhotoOut(BaseModel):
    id: int
    record_id: int
    chart_id: int
    file_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RecordOut(BaseModel):
    id: int
    user_id: int
    quest_id: int
    created_at: datetime
    updated_at: datetime
    photos: list[PhotoOut] = []

    model_config = {"from_attributes": True}
