from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.canvas import Canvas
from app.models.project import Project


DEFAULT_PROJECT_NAME = "Default Project"
DEFAULT_CANVAS_NAME = "Main"


def get_default_project(db: Session) -> Project:
    project = db.scalars(select(Project).order_by(Project.created_at.asc())).first()
    if project:
        return project

    project = Project(name=DEFAULT_PROJECT_NAME, description="")
    db.add(project)
    db.flush()
    db.add(Canvas(project_id=project.id, name=DEFAULT_CANVAS_NAME))
    db.commit()
    db.refresh(project)
    return project


def get_project(db: Session, project_id: str) -> Project | None:
    return db.get(Project, project_id)


def get_default_canvas(db: Session, project_id: str) -> Canvas:
    canvas = db.scalars(select(Canvas).where(Canvas.project_id == project_id).order_by(Canvas.created_at.asc())).first()
    if canvas:
        return canvas

    canvas = Canvas(project_id=project_id, name=DEFAULT_CANVAS_NAME)
    db.add(canvas)
    db.commit()
    db.refresh(canvas)
    return canvas

