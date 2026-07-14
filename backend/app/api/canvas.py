from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.canvas import CanvasNodeLayoutUpdate, CanvasNodeUpdate, CanvasViewportUpdate
from app.services.canvas_service import update_canvas_layout, update_canvas_node, update_canvas_viewport

router = APIRouter(tags=["canvas"])


@router.patch("/canvas-nodes/{canvas_node_id}", status_code=204)
def patch_canvas_node(canvas_node_id: str, payload: CanvasNodeUpdate, db: Session = Depends(get_db)) -> Response:
    update_canvas_node(db, canvas_node_id, payload)
    return Response(status_code=204)


@router.patch("/canvases/{canvas_id}/nodes/layout", status_code=204)
def patch_canvas_layout(canvas_id: str, payload: CanvasNodeLayoutUpdate, db: Session = Depends(get_db)) -> Response:
    update_canvas_layout(db, canvas_id, payload)
    return Response(status_code=204)


@router.patch("/canvases/{canvas_id}/viewport", status_code=204)
def patch_canvas_viewport(canvas_id: str, payload: CanvasViewportUpdate, db: Session = Depends(get_db)) -> Response:
    update_canvas_viewport(db, canvas_id, payload)
    return Response(status_code=204)

