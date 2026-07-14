from collections.abc import Generator

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


def ensure_workspace() -> None:
    settings.workspace_path.mkdir(parents=True, exist_ok=True)
    (settings.workspace_path / "database").mkdir(parents=True, exist_ok=True)
    (settings.workspace_path / "exports").mkdir(parents=True, exist_ok=True)


connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, _connection_record) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_database_schema() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "relation_labels" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("relation_labels")}
    if "emoji" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE relation_labels ADD COLUMN emoji VARCHAR(16) NOT NULL DEFAULT '🔗'")
            )
