from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.relation import IncomingRelationsUpdate, RelationLabelCreate, RelationLabelUpdate
from app.services.relation_service import (
    create_relation_label,
    delete_relation_label,
    list_relation_labels,
    read_incoming_relations,
    replace_incoming_relations,
    update_relation_label,
)

router = APIRouter(tags=["relations"])


@router.get("/projects/{project_id}/relation-labels")
def get_project_relation_labels(project_id: str, db: Session = Depends(get_db)):
    return {"data": list_relation_labels(db, project_id)}


@router.post("/projects/{project_id}/relation-labels")
def post_project_relation_label(project_id: str, payload: RelationLabelCreate, db: Session = Depends(get_db)):
    return {"data": create_relation_label(db, project_id, payload)}


@router.put("/relation-labels/{label_id}")
def put_relation_label(label_id: str, payload: RelationLabelUpdate, db: Session = Depends(get_db)):
    return {"data": update_relation_label(db, label_id, payload)}


@router.delete("/relation-labels/{label_id}", status_code=204)
def delete_project_relation_label(label_id: str, db: Session = Depends(get_db)) -> Response:
    delete_relation_label(db, label_id)
    return Response(status_code=204)


@router.get("/papers/{paper_id}/incoming-relations")
def get_paper_incoming_relations(paper_id: str, db: Session = Depends(get_db)):
    return {"data": read_incoming_relations(db, paper_id)}


@router.put("/papers/{paper_id}/incoming-relations")
def put_paper_incoming_relations(paper_id: str, payload: IncomingRelationsUpdate, db: Session = Depends(get_db)):
    return {"data": replace_incoming_relations(db, paper_id, payload)}
