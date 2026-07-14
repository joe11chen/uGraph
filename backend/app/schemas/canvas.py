from typing import Any

from pydantic import BaseModel

from app.schemas.project import ProjectOut
from app.schemas.relation import RelationLabelOut, RelationOut


class CanvasOut(BaseModel):
    id: str
    project_id: str
    name: str
    viewport_x: float
    viewport_y: float
    zoom: float

    model_config = {"from_attributes": True}


class CanvasNodePosition(BaseModel):
    x: float
    y: float


class CanvasNodeUpdate(BaseModel):
    x: float
    y: float


class CanvasNodeLayoutItem(BaseModel):
    canvas_node_id: str
    x: float
    y: float


class CanvasNodeLayoutUpdate(BaseModel):
    nodes: list[CanvasNodeLayoutItem]


class CanvasViewportUpdate(BaseModel):
    viewport_x: float
    viewport_y: float
    zoom: float


class GraphPaperOut(BaseModel):
    id: str
    title: str
    metadata: dict[str, Any]


class GraphNodeOut(BaseModel):
    id: str
    paper_id: str
    position: CanvasNodePosition
    paper: GraphPaperOut


class GraphOut(BaseModel):
    project: ProjectOut
    canvas: CanvasOut
    nodes: list[GraphNodeOut]
    edges: list[RelationOut]
    relation_labels: list[RelationLabelOut]
