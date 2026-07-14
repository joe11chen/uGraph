import uuid

from sqlalchemy import Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Canvas(TimestampMixin, Base):
    __tablename__ = "canvases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    viewport_x: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    viewport_y: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    zoom: Mapped[float] = mapped_column(Float, nullable=False, default=1)

    project = relationship("Project", back_populates="canvases")
    nodes = relationship("CanvasNode", back_populates="canvas", cascade="all, delete-orphan")


class CanvasNode(TimestampMixin, Base):
    __tablename__ = "canvas_nodes"
    __table_args__ = (UniqueConstraint("canvas_id", "paper_id", name="uq_canvas_paper"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    canvas_id: Mapped[str] = mapped_column(String(36), ForeignKey("canvases.id", ondelete="CASCADE"), nullable=False)
    paper_id: Mapped[str] = mapped_column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    x: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    y: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    width: Mapped[float | None] = mapped_column(Float, nullable=True)
    height: Mapped[float | None] = mapped_column(Float, nullable=True)

    canvas = relationship("Canvas", back_populates="nodes")
    paper = relationship("Paper", back_populates="canvas_nodes")

