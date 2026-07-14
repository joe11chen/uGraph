from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PositionIn(BaseModel):
    x: float = 0
    y: float = 0


class PaperCreate(BaseModel):
    title: str = Field(min_length=1)
    metadata: dict[str, Any] = Field(default_factory=dict)
    position: PositionIn | None = None


class PaperUpdate(BaseModel):
    title: str = Field(min_length=1)
    metadata: dict[str, Any] = Field(default_factory=dict)
    markdown_content: str = ""
    version: int


class PaperSummaryOut(BaseModel):
    id: str
    title: str
    metadata: dict[str, Any]


class PaperOut(BaseModel):
    id: str
    project_id: str
    title: str
    metadata: dict[str, Any]
    markdown_content: str
    version: int
    created_at: datetime
    updated_at: datetime

