from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.canvas import Canvas
from app.repositories.canvas import get_canvas_node, list_canvas_nodes
from app.repositories.projects import get_default_canvas, get_project
from app.schemas.canvas import (
    CanvasNodeLayoutUpdate,
    CanvasNodePosition,
    CanvasNodeUpdate,
    CanvasOut,
    CanvasViewportUpdate,
    GraphNodeOut,
    GraphOut,
    GraphPaperOut,
)
from app.schemas.project import ProjectOut
from app.services.relation_service import list_project_relations, list_relation_labels
from app.services.serialization import load_metadata


def get_project_graph(db: Session, project_id: str) -> GraphOut:
    project = get_project(db, project_id)
    if not project:
        raise AppError("PROJECT_NOT_FOUND", "Project not found", 404)
    canvas = get_default_canvas(db, project_id)
    nodes = [
        GraphNodeOut(
            id=node.id,
            paper_id=node.paper_id,
            position=CanvasNodePosition(x=node.x, y=node.y),
            paper=GraphPaperOut(
                id=node.paper.id,
                title=node.paper.title,
                metadata=load_metadata(node.paper.metadata_json),
            ),
        )
        for node in list_canvas_nodes(db, canvas.id)
    ]
    return GraphOut(
        project=ProjectOut.model_validate(project),
        canvas=CanvasOut.model_validate(canvas),
        nodes=nodes,
        edges=list_project_relations(db, project_id),
        relation_labels=list_relation_labels(db, project_id),
    )


def update_canvas_node(db: Session, canvas_node_id: str, payload: CanvasNodeUpdate) -> None:
    node = get_canvas_node(db, canvas_node_id)
    if not node:
        raise AppError("CANVAS_NODE_NOT_FOUND", "Canvas node not found", 404)
    node.x = payload.x
    node.y = payload.y
    db.commit()


def update_canvas_layout(db: Session, canvas_id: str, payload: CanvasNodeLayoutUpdate) -> None:
    known_nodes = {node.id: node for node in list_canvas_nodes(db, canvas_id)}
    for item in payload.nodes:
        node = known_nodes.get(item.canvas_node_id)
        if node:
            node.x = item.x
            node.y = item.y
    db.commit()


def update_canvas_viewport(db: Session, canvas_id: str, payload: CanvasViewportUpdate) -> None:
    canvas = db.get(Canvas, canvas_id)
    if not canvas:
        raise AppError("CANVAS_NOT_FOUND", "Canvas not found", 404)
    canvas.viewport_x = payload.viewport_x
    canvas.viewport_y = payload.viewport_y
    canvas.zoom = payload.zoom
    db.commit()
