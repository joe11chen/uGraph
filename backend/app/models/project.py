import uuid

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Project(TimestampMixin, Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    papers = relationship("Paper", back_populates="project", cascade="all, delete-orphan")
    canvases = relationship("Canvas", back_populates="project", cascade="all, delete-orphan")
    relation_labels = relationship("RelationLabel", back_populates="project", cascade="all, delete-orphan")
    relations = relationship("Relation", back_populates="project", cascade="all, delete-orphan")
