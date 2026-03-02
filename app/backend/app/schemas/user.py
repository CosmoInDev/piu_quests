from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class UserOut(BaseModel):
    id: int
    google_id: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


def _validate_name(v: str) -> str:
    stripped = v.strip()
    if not stripped:
        raise ValueError("name must not be empty or whitespace only")
    return stripped


class UserRegisterIn(BaseModel):
    name: str = Field(..., max_length=256)

    @field_validator("name", mode="before")
    @classmethod
    def clean_name(cls, v: str) -> str:
        return _validate_name(v)


class UserUpdateIn(BaseModel):
    name: str = Field(..., max_length=256)

    @field_validator("name", mode="before")
    @classmethod
    def clean_name(cls, v: str) -> str:
        return _validate_name(v)


class NameCheckOut(BaseModel):
    available: bool
