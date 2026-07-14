from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.projects import get_default_project
from app.schemas.project import ProjectOut
from app.services.canvas_service import get_project_graph

router = APIRouter(tags=["projects"])


@router.get("/projects/default")
def read_default_project(db: Session = Depends(get_db)) -> dict[str, ProjectOut]:
    project = get_default_project(db)
    return {"data": ProjectOut.model_validate(project)}


@router.get("/projects/{project_id}/graph")
def read_project_graph(project_id: str, db: Session = Depends(get_db)):
    return {"data": get_project_graph(db, project_id)}

