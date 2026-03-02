from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = (UniqueConstraint("user_id", "quest_id", name="uq_participant"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    quest_id: Mapped[int] = mapped_column(ForeignKey("quests.id"), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User")
    quest: Mapped["Quest"] = relationship("Quest", back_populates="participants")
