from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.paper import PaperCreate, PaperUpdate
from app.services.paper_service import create_paper, delete_paper, read_paper, update_paper

router = APIRouter(tags=["papers"])


@router.post("/projects/{project_id}/papers")
def create_project_paper(project_id: str, payload: PaperCreate, db: Session = Depends(get_db)):
    return {"data": create_paper(db, project_id, payload)}


@router.get("/papers/{paper_id}")
def get_paper_detail(paper_id: str, db: Session = Depends(get_db)):
    return {"data": read_paper(db, paper_id)}


@router.put("/papers/{paper_id}")
def update_paper_detail(paper_id: str, payload: PaperUpdate, db: Session = Depends(get_db)):
    return {"data": update_paper(db, paper_id, payload)}


@router.delete("/papers/{paper_id}", status_code=204)
def delete_paper_detail(paper_id: str, db: Session = Depends(get_db)) -> Response:
    delete_paper(db, paper_id)
    return Response(status_code=204)

