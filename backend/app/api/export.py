from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.export_service import export_paper_markdown, export_project_markdown

router = APIRouter(tags=["export"])


@router.get("/papers/{paper_id}/export/markdown")
def download_paper_markdown(paper_id: str, db: Session = Depends(get_db)):
    return export_paper_markdown(db, paper_id)


@router.post("/projects/{project_id}/export/markdown")
def export_project(project_id: str, db: Session = Depends(get_db)):
    return {"data": {"export_path": export_project_markdown(db, project_id)}}

