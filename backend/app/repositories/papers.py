from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.paper import Paper


def get_paper(db: Session, paper_id: str) -> Paper | None:
    return db.get(Paper, paper_id)


def list_project_papers(db: Session, project_id: str) -> list[Paper]:
    return list(db.scalars(select(Paper).where(Paper.project_id == project_id).order_by(Paper.updated_at.desc())))

