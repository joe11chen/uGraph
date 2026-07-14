from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.canvas import CanvasNode
from app.models.paper import Paper
from app.repositories.papers import get_paper
from app.repositories.projects import get_default_canvas, get_project
from app.schemas.paper import PaperCreate, PaperOut, PaperUpdate
from app.services.serialization import dump_metadata, load_metadata


def paper_to_out(paper: Paper) -> PaperOut:
    return PaperOut(
        id=paper.id,
        project_id=paper.project_id,
        title=paper.title,
        metadata=load_metadata(paper.metadata_json),
        markdown_content=paper.markdown_content,
        version=paper.version,
        created_at=paper.created_at,
        updated_at=paper.updated_at,
    )


def create_paper(db: Session, project_id: str, payload: PaperCreate) -> PaperOut:
    project = get_project(db, project_id)
    if not project:
        raise AppError("PROJECT_NOT_FOUND", "Project not found", 404)
    title = payload.title.strip()
    if not title:
        raise AppError("TITLE_REQUIRED", "Title is required", 422)

    canvas = get_default_canvas(db, project_id)
    position = payload.position
    paper = Paper(
        project_id=project_id,
        title=title,
        metadata_json=dump_metadata(payload.metadata),
        markdown_content="",
    )
    db.add(paper)
    db.flush()
    db.add(
        CanvasNode(
            canvas_id=canvas.id,
            paper_id=paper.id,
            x=position.x if position else 0,
            y=position.y if position else 0,
        )
    )
    db.commit()
    db.refresh(paper)
    return paper_to_out(paper)


def read_paper(db: Session, paper_id: str) -> PaperOut:
    paper = get_paper(db, paper_id)
    if not paper:
        raise AppError("PAPER_NOT_FOUND", "Paper not found", 404)
    return paper_to_out(paper)


def update_paper(db: Session, paper_id: str, payload: PaperUpdate) -> PaperOut:
    paper = get_paper(db, paper_id)
    if not paper:
        raise AppError("PAPER_NOT_FOUND", "Paper not found", 404)
    title = payload.title.strip()
    if not title:
        raise AppError("TITLE_REQUIRED", "Title is required", 422)
    if paper.version != payload.version:
        raise AppError(
            "VERSION_CONFLICT",
            "Paper has been updated elsewhere",
            409,
            {"current_version": paper.version},
        )

    paper.title = title
    paper.metadata_json = dump_metadata(payload.metadata)
    paper.markdown_content = payload.markdown_content
    paper.version += 1
    db.commit()
    db.refresh(paper)
    return paper_to_out(paper)


def delete_paper(db: Session, paper_id: str) -> None:
    paper = get_paper(db, paper_id)
    if not paper:
        raise AppError("PAPER_NOT_FOUND", "Paper not found", 404)
    db.delete(paper)
    db.commit()
