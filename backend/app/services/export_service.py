from datetime import datetime

from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.exporters.markdown_exporter import paper_markdown, slugify, write_text
from app.repositories.papers import get_paper, list_project_papers
from app.repositories.projects import get_project
from app.services.serialization import load_metadata


def export_paper_markdown(db: Session, paper_id: str) -> Response:
    paper = get_paper(db, paper_id)
    if not paper:
        raise AppError("PAPER_NOT_FOUND", "Paper not found", 404)
    content = paper_markdown(paper.id, paper.title, load_metadata(paper.metadata_json), paper.markdown_content)
    filename = f"{slugify(paper.title)}.md"
    return Response(
        content=content,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def export_project_markdown(db: Session, project_id: str) -> str:
    project = get_project(db, project_id)
    if not project:
        raise AppError("PROJECT_NOT_FOUND", "Project not found", 404)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    export_dir = settings.workspace_path / "exports" / f"{slugify(project.name)}-{timestamp}"
    papers_dir = export_dir / "papers"
    papers = list_project_papers(db, project_id)

    graph_lines = ["# Research Graph", "", "## Papers", ""]
    for paper in papers:
        filename = f"{paper.id}-{slugify(paper.title)}.md"
        graph_lines.append(f"- [{paper.title}](papers/{filename})")
        write_text(
            papers_dir / filename,
            paper_markdown(paper.id, paper.title, load_metadata(paper.metadata_json), paper.markdown_content),
        )

    write_text(export_dir / "graph.md", "\n".join(graph_lines) + "\n")
    return str(export_dir.relative_to(settings.workspace_path))

