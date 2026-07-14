from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401
from app.api import canvas, export, papers, projects, relations
from app.core.config import settings
from app.core.database import Base, engine, ensure_database_schema, ensure_workspace
from app.core.errors import register_exception_handlers


def create_app() -> FastAPI:
    ensure_workspace()
    Base.metadata.create_all(bind=engine)
    ensure_database_schema()

    app = FastAPI(title="Local Research Graph")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)

    app.include_router(projects.router, prefix="/api")
    app.include_router(papers.router, prefix="/api")
    app.include_router(canvas.router, prefix="/api")
    app.include_router(relations.router, prefix="/api")
    app.include_router(export.router, prefix="/api")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
