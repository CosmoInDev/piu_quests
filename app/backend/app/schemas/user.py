from datetime import datetime
from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    google_id: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
