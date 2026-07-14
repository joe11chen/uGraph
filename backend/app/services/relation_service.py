from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.paper import Paper
from app.models.relation import Relation, RelationLabel
from app.repositories.papers import get_paper
from app.repositories.projects import get_project
from app.schemas.relation import (
    IncomingRelationGroupOut,
    IncomingRelationsOut,
    IncomingRelationsUpdate,
    RelationLabelCreate,
    RelationLabelOut,
    RelationLabelUpdate,
    RelationOut,
)


DEFAULT_LABELS = [
    {"name": "Cites", "emoji": "📎", "color": "#8b5e3c", "line_style": "solid", "sort_order": 10},
    {"name": "Builds on", "emoji": "🧱", "color": "#b8653f", "line_style": "solid", "sort_order": 20},
    {"name": "Uses method", "emoji": "🛠️", "color": "#66763f", "line_style": "dashed", "sort_order": 30},
    {"name": "Compares with", "emoji": "⚖️", "color": "#3f3a33", "line_style": "dotted", "sort_order": 40},
]

ALLOWED_LINE_STYLES = {"solid", "dashed", "dotted"}


def normalize_line_style(value: str) -> str:
    return value if value in ALLOWED_LINE_STYLES else "solid"


def normalize_emoji(value: str) -> str:
    return value.strip()[:16] or "🔗"


def ensure_default_relation_labels(db: Session, project_id: str) -> None:
    existing = db.scalars(select(RelationLabel.id).where(RelationLabel.project_id == project_id)).first()
    if existing:
        return
    for item in DEFAULT_LABELS:
        db.add(RelationLabel(project_id=project_id, **item))
    db.commit()


def list_relation_labels(db: Session, project_id: str) -> list[RelationLabelOut]:
    if not get_project(db, project_id):
        raise AppError("PROJECT_NOT_FOUND", "Project not found", 404)
    ensure_default_relation_labels(db, project_id)
    labels = db.scalars(
        select(RelationLabel).where(RelationLabel.project_id == project_id).order_by(RelationLabel.sort_order, RelationLabel.created_at)
    ).all()
    return [RelationLabelOut.model_validate(label) for label in labels]


def list_project_relations(db: Session, project_id: str) -> list[RelationOut]:
    relations = db.scalars(select(Relation).where(Relation.project_id == project_id).order_by(Relation.created_at)).all()
    return [RelationOut.model_validate(relation) for relation in relations]


def create_relation_label(db: Session, project_id: str, payload: RelationLabelCreate) -> RelationLabelOut:
    if not get_project(db, project_id):
        raise AppError("PROJECT_NOT_FOUND", "Project not found", 404)
    name = payload.name.strip()
    if not name:
        raise AppError("RELATION_LABEL_NAME_REQUIRED", "Relation label name is required", 422)
    duplicate = db.scalars(select(RelationLabel).where(RelationLabel.project_id == project_id, RelationLabel.name == name)).first()
    if duplicate:
        raise AppError("RELATION_LABEL_EXISTS", "Relation label already exists", 409)
    label = RelationLabel(
        project_id=project_id,
        name=name,
        emoji=normalize_emoji(payload.emoji),
        color=payload.color,
        line_style=normalize_line_style(payload.line_style),
        sort_order=payload.sort_order,
    )
    db.add(label)
    db.commit()
    db.refresh(label)
    return RelationLabelOut.model_validate(label)


def update_relation_label(db: Session, label_id: str, payload: RelationLabelUpdate) -> RelationLabelOut:
    label = db.get(RelationLabel, label_id)
    if not label:
        raise AppError("RELATION_LABEL_NOT_FOUND", "Relation label not found", 404)
    name = payload.name.strip()
    if not name:
        raise AppError("RELATION_LABEL_NAME_REQUIRED", "Relation label name is required", 422)
    duplicate = db.scalars(
        select(RelationLabel).where(
            RelationLabel.project_id == label.project_id,
            RelationLabel.name == name,
            RelationLabel.id != label.id,
        )
    ).first()
    if duplicate:
        raise AppError("RELATION_LABEL_EXISTS", "Relation label already exists", 409)
    label.name = name
    label.emoji = normalize_emoji(payload.emoji)
    label.color = payload.color
    label.line_style = normalize_line_style(payload.line_style)
    label.sort_order = payload.sort_order
    db.commit()
    db.refresh(label)
    return RelationLabelOut.model_validate(label)


def delete_relation_label(db: Session, label_id: str) -> None:
    label = db.get(RelationLabel, label_id)
    if not label:
        raise AppError("RELATION_LABEL_NOT_FOUND", "Relation label not found", 404)
    db.delete(label)
    db.commit()


def read_incoming_relations(db: Session, paper_id: str) -> IncomingRelationsOut:
    paper = get_paper(db, paper_id)
    if not paper:
        raise AppError("PAPER_NOT_FOUND", "Paper not found", 404)
    relations = db.scalars(select(Relation).where(Relation.target_paper_id == paper_id)).all()
    grouped: dict[str, list[str]] = {}
    for relation in relations:
        grouped.setdefault(relation.label_id, []).append(relation.source_paper_id)
    return IncomingRelationsOut(
        target_paper_id=paper_id,
        groups=[IncomingRelationGroupOut(label_id=label_id, source_paper_ids=source_ids) for label_id, source_ids in grouped.items()],
    )


def replace_incoming_relations(db: Session, paper_id: str, payload: IncomingRelationsUpdate) -> IncomingRelationsOut:
    target = get_paper(db, paper_id)
    if not target:
        raise AppError("PAPER_NOT_FOUND", "Paper not found", 404)
    ensure_default_relation_labels(db, target.project_id)

    labels = {
        label.id: label
        for label in db.scalars(select(RelationLabel).where(RelationLabel.project_id == target.project_id)).all()
    }
    requested_source_ids = {source_id for group in payload.groups for source_id in group.source_paper_ids}
    if paper_id in requested_source_ids:
        raise AppError("RELATION_SELF_LOOP", "A paper cannot point to itself", 422)
    sources = {
        paper.id: paper
        for paper in db.scalars(select(Paper).where(Paper.project_id == target.project_id, Paper.id.in_(requested_source_ids))).all()
    } if requested_source_ids else {}

    for group in payload.groups:
        if group.label_id not in labels:
            raise AppError("RELATION_LABEL_NOT_FOUND", "Relation label not found", 404)
        missing = [source_id for source_id in group.source_paper_ids if source_id not in sources]
        if missing:
            raise AppError("RELATION_SOURCE_NOT_FOUND", "Relation source paper not found", 404, {"paper_ids": missing})

    db.execute(delete(Relation).where(Relation.target_paper_id == paper_id))
    seen: set[tuple[str, str]] = set()
    for group in payload.groups:
        for source_id in group.source_paper_ids:
            key = (group.label_id, source_id)
            if key in seen:
                continue
            seen.add(key)
            db.add(
                Relation(
                    project_id=target.project_id,
                    source_paper_id=source_id,
                    target_paper_id=paper_id,
                    label_id=group.label_id,
                )
            )
    db.commit()
    return read_incoming_relations(db, paper_id)
