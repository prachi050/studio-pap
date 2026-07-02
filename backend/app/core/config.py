"""Application configuration."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Runtime settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Ghost Designer"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = Field(default=False, alias="DEBUG")
    api_prefix: str = Field(default="", alias="API_PREFIX")

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
        ],
        alias="CORS_ORIGINS",
    )

    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_file: Path = Field(default=BASE_DIR / "logs" / "app.log", alias="LOG_FILE")
    uploads_dir: Path = Field(default=BASE_DIR / "uploads", alias="UPLOADS_DIR")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_base_url: str = Field(default="https://api.openai.com/v1", alias="OPENAI_BASE_URL")
    ai_vision_model: str = Field(default="gpt-5.5", alias="AI_VISION_MODEL")

    @field_validator("log_file", "uploads_dir", mode="after")
    @classmethod
    def resolve_backend_path(cls, value: Path) -> Path:
        """Resolve relative paths from the backend directory."""
        if value.is_absolute():
            return value
        return BASE_DIR / value


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
