import uuid

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class RelationLabel(TimestampMixin, Base):
    __tablename__ = "relation_labels"
    __table_args__ = (UniqueConstraint("project_id", "name", name="uq_relation_label_project_name"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    emoji: Mapped[str] = mapped_column(String(16), nullable=False, default="🔗")
    color: Mapped[str] = mapped_column(String(32), nullable=False, default="#b8653f")
    line_style: Mapped[str] = mapped_column(String(16), nullable=False, default="solid")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    project = relationship("Project", back_populates="relation_labels")
    relations = relationship("Relation", back_populates="label", cascade="all, delete-orphan")


class Relation(TimestampMixin, Base):
    __tablename__ = "relations"
    __table_args__ = (UniqueConstraint("source_paper_id", "target_paper_id", "label_id", name="uq_relation_triplet"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    source_paper_id: Mapped[str] = mapped_column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    target_paper_id: Mapped[str] = mapped_column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    label_id: Mapped[str] = mapped_column(String(36), ForeignKey("relation_labels.id", ondelete="CASCADE"), nullable=False)

    project = relationship("Project", back_populates="relations")
    label = relationship("RelationLabel", back_populates="relations")
    source_paper = relationship("Paper", foreign_keys=[source_paper_id], back_populates="outgoing_relations")
    target_paper = relationship("Paper", foreign_keys=[target_paper_id], back_populates="incoming_relations")
