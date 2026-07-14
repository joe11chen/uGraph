import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Paper(TimestampMixin, Base):
    __tablename__ = "papers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    metadata_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    markdown_content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    project = relationship("Project", back_populates="papers")
    canvas_nodes = relationship("CanvasNode", back_populates="paper", cascade="all, delete-orphan")
    outgoing_relations = relationship(
        "Relation",
        foreign_keys="Relation.source_paper_id",
        back_populates="source_paper",
        cascade="all, delete-orphan",
    )
    incoming_relations = relationship(
        "Relation",
        foreign_keys="Relation.target_paper_id",
        back_populates="target_paper",
        cascade="all, delete-orphan",
    )
