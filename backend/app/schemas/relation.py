from datetime import datetime

from pydantic import BaseModel, Field


class RelationLabelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    emoji: str = Field(default="🔗", max_length=16)
    color: str = "#b8653f"
    line_style: str = "solid"
    sort_order: int = 0


class RelationLabelUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    emoji: str = Field(default="🔗", max_length=16)
    color: str = "#b8653f"
    line_style: str = "solid"
    sort_order: int = 0


class RelationLabelOut(BaseModel):
    id: str
    project_id: str
    name: str
    emoji: str
    color: str
    line_style: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RelationOut(BaseModel):
    id: str
    project_id: str
    source_paper_id: str
    target_paper_id: str
    label_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IncomingRelationGroupIn(BaseModel):
    label_id: str
    source_paper_ids: list[str] = Field(default_factory=list)


class IncomingRelationsUpdate(BaseModel):
    groups: list[IncomingRelationGroupIn] = Field(default_factory=list)


class IncomingRelationGroupOut(BaseModel):
    label_id: str
    source_paper_ids: list[str]


class IncomingRelationsOut(BaseModel):
    target_paper_id: str
    groups: list[IncomingRelationGroupOut]
