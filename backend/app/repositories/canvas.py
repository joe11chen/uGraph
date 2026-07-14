from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.canvas import CanvasNode


def get_canvas_node(db: Session, canvas_node_id: str) -> CanvasNode | None:
    return db.get(CanvasNode, canvas_node_id)


def list_canvas_nodes(db: Session, canvas_id: str) -> list[CanvasNode]:
    stmt = (
        select(CanvasNode)
        .where(CanvasNode.canvas_id == canvas_id)
        .options(selectinload(CanvasNode.paper))
        .order_by(CanvasNode.created_at.asc())
    )
    return list(db.scalars(stmt))

