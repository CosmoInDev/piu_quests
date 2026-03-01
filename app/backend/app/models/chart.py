from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Chart(Base):
    __tablename__ = "charts"

    id: Mapped[int] = mapped_column(primary_key=True)
    quest_id: Mapped[int] = mapped_column(ForeignKey("quests.id"), nullable=False)
    song_name: Mapped[str] = mapped_column(String(256), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(64), nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False)

    quest: Mapped["Quest"] = relationship("Quest", back_populates="charts")
