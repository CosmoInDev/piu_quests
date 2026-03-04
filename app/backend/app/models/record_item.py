from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RecordItem(Base):
    __tablename__ = "record_items"
    __table_args__ = (UniqueConstraint("record_id", "chart_id", name="uq_record_item"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    record_id: Mapped[int] = mapped_column(ForeignKey("records.id"), nullable=False)
    chart_id: Mapped[int] = mapped_column(ForeignKey("charts.id"), nullable=False)
    song_name: Mapped[str] = mapped_column(String(255), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    record: Mapped["Record"] = relationship("Record", back_populates="items")
    photo: Mapped["Photo | None"] = relationship(
        "Photo", back_populates="record_item", uselist=False, cascade="all, delete-orphan"
    )
