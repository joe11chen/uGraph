from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    workspace_path: Path = Path("./workspace")
    database_url: str = "sqlite:///./workspace/database/research_graph.db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

