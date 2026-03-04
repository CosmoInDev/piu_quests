from datetime import date, datetime
from pydantic import BaseModel
from typing import Literal


class ChartCreate(BaseModel):
    song_name: str
    difficulty: str
    order: int


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
    start_date: date
    end_date: date
    charts: list[ChartCreate]


class PickRequest(BaseModel):
    level: int
    mode: Literal["single", "double"] | None = None


class PickResponse(BaseModel):
    song_name: str
    difficulty: str


class ChartSubmission(BaseModel):
    user_id: int
    user_name: str
    score: int | None  # None = 미제출


class ChartOverview(BaseModel):
    chart_id: int
    song_name: str
    difficulty: str
    order: int
    submissions: list[ChartSubmission]


class UserSummary(BaseModel):
    user_id: int
    user_name: str
    submitted: int
    total: int


class QuestOverview(BaseModel):
    quest: QuestOut
    chart_overviews: list[ChartOverview]
    user_summaries: list[UserSummary]


ParticipantStatus = Literal["FINISHED", "SUBMITTING", "UNSUBMITTED"]


class ParticipantOut(BaseModel):
    id: int
    user_id: int
    quest_id: int
    joined_at: datetime
    status: ParticipantStatus

    model_config = {"from_attributes": True}
