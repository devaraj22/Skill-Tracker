"""Application settings, loaded from environment variables or backend/.env."""
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    app_env: str = "development"  # development | production | test
    database_url: str = "postgresql+psycopg://skilltrack:change-me@localhost:5432/skilltrack"
    secret_key: str = ""
    access_token_minutes: int = 60
    cors_origins: str = "http://localhost:5173"
    upload_dir: Path = BACKEND_DIR / "private_uploads"
    max_upload_bytes: int = 5 * 1024 * 1024
    cookie_samesite: str = "lax"  # lax | strict | none (none requires HTTPS)

    @field_validator("database_url")
    @classmethod
    def _resolve_sqlite_path(cls, v: str) -> str:
        if v.startswith("sqlite:///") and not v.startswith("sqlite:///:memory:"):
            path_part = v[len("sqlite:///"):]
            path_obj = Path(path_part)
            if not path_obj.is_absolute():
                abs_path = (BACKEND_DIR / path_obj).resolve()
                return f"sqlite:///{abs_path.as_posix()}"
        return v

    @field_validator("secret_key")
    @classmethod
    def _secret_long_enough(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be set to at least 32 characters. Generate one with: "
                "python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )
        return v

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        if "*" in origins:
            raise ValueError("CORS_ORIGINS must list explicit origins, not *")
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
