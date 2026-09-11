import os
from functools import lru_cache
from typing import Literal
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    # Database
    database_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5433/paragon",
        validation_alias="DATABASE_URL",
        description="PostgreSQL connection URI",
    )

    @field_validator("database_url", mode="after")
    @classmethod
    def format_postgres_driver(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

    # LLM Settings
    llm_provider: Literal["gemini", "ollama"] = Field(
        default="ollama",
        validation_alias="LLM_PROVIDER",
        description="Active LLM provider ('gemini' or 'ollama')",
    )
    google_api_key: str | None = Field(
        default=None,
        validation_alias="GOOGLE_API_KEY",
        description="Google Gemini API key",
    )
    gemini_model: str = Field(
        default="gemini-3.5-flash-lite",
        validation_alias="GEMINI_MODEL",
        description="Gemini model identifier",
    )
    ollama_base_url: str = Field(
        default="http://localhost:11434",
        validation_alias="OLLAMA_BASE_URL",
        description="Ollama base URL endpoint",
    )
    ollama_model: str = Field(
        default="qwen3.5:9b",
        validation_alias="OLLAMA_MODEL",
        description="Ollama model name",
    )

    # Application & Security
    environment: str = Field(
        default="development",
        validation_alias="ENVIRONMENT",
        description="App environment (development, test, production)",
    )
    allowed_origins: list[str] = Field(
        default=["*"],
        validation_alias="ALLOWED_ORIGINS",
        description="Allowed CORS origins",
    )
    log_level: str = Field(
        default="INFO",
        validation_alias="LOG_LEVEL",
        description="Logging level",
    )
    agent_max_tokens: int = Field(
        default=80000,
        validation_alias="AGENT_MAX_TOKENS",
        description="Maximum tokens for conversation trimming middleware",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
