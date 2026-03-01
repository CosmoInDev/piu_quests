from datetime import date, datetime
from pydantic import BaseModel
from typing import Literal


class ChartOut(BaseModel):
    id: int
    quest_id: int
    song_name: str
    difficulty: str
    order: int

    model_config = {"from_attributes": True}


class QuestOut(BaseModel):
    id: int
    title: str
    start_date: date
    end_date: date
    created_at: datetime
    charts: list[ChartOut] = []

    model_config = {"from_attributes": True}


class QuestCreate(BaseModel):
    title: str
    start_date: date
    end_date: date


ParticipantStatus = Literal["FINISHED", "SUBMITTING", "UNSUBMITTED"]


class ParticipantOut(BaseModel):
    id: int
    user_id: int
    quest_id: int
    joined_at: datetime
    status: ParticipantStatus

    model_config = {"from_attributes": True}
