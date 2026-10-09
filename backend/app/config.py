from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        # backend/.env also holds seed-only keys (ADMIN_EMAIL, ...) that Settings does not declare.
        extra="ignore",
        # Keep DATABASE_URL and SECRET_KEY out of validation error text.
        hide_input_in_errors=True,
    )

    database_url: str
    secret_key: str
    access_token_minutes: Annotated[int, Field(ge=1, le=1440)] = 60
    cors_origins: Annotated[list[str], NoDecode] = []
    upload_dir: Path = Path("uploads")
    max_upload_bytes: int = 2_000_000

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("cors_origins")
    @classmethod
    def check_cors_origins(cls, value: list[str]) -> list[str]:
        if "*" in value:
            raise ValueError("CORS_ORIGINS must list the real frontend origins, not *")
        return value

    @field_validator("secret_key")
    @classmethod
    def check_secret_key(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("SECRET_KEY must have at least 32 characters")
        if value.startswith("change-me") or len(set(value)) < 10:
            raise ValueError("SECRET_KEY must be replaced with a generated value")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
