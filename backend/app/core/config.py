from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    workspace_path: Path = Path("./workspace")
    database_url: str = "sqlite:///./workspace/database/research_graph.db"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

