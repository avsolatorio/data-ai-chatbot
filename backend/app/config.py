from enum import Enum
from typing import List, Union

import dotenv
from pydantic import ConfigDict, Field, field_validator, model_validator
from pydantic_settings import BaseSettings


class ModelType(str, Enum):
    """Enum for AI model types used in the application."""

    CHAT_MODEL = "chat-model"
    CHAT_MODEL_REASONING = "chat-model-reasoning"
    TITLE_MODEL = "title-model"
    ARTIFACT_MODEL = "artifact-model"


class IntentType(str, Enum):
    """Enum for chat intent types."""

    RESEARCH = "RESEARCH"
    DIRECT = "DIRECT"


class ModelSettings(BaseSettings):
    MODEL_PROVIDER: str = "azure/"
    CHAT_MODEL: str = "gpt-5.1"
    CHAT_MODEL_REASONING: str = "o1-mini"
    TITLE_MODEL: str = "gpt-4o-mini"
    ARTIFACT_MODEL: str = "gpt-4o-mini"

    model_config = ConfigDict(
        extra="allow",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


class Settings(BaseSettings):
    # Database - REQUIRED: Must be set in .env file
    # Format: postgresql+asyncpg://user:password@host:port/database  # pragma: allowlist secret
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "chatbot_db"
    POSTGRES_ALEMBIC_USER: str = "postgres"
    POSTGRES_ALEMBIC_PASSWORD: str = "postgres"

    # Optional: Explicit sync URL for Alembic (if different from async URL)
    # If not set, ALEMBIC_POSTGRES_URL will be converted from async to sync format
    POSTGRES_URL_SYNC: str = ""

    # Computed fields - cannot be set in .env, always derived from above
    # Using Field(exclude=True) prevents these from being read from environment variables
    POSTGRES_URL: str = Field(default="", exclude=True)
    ALEMBIC_POSTGRES_URL: str = Field(default="", exclude=True)

    @model_validator(mode="after")
    def compute_postgres_urls(self) -> "Settings":
        """Compute POSTGRES_URL and ALEMBIC_POSTGRES_URL from component fields."""
        # URL-encode password in case it contains special characters
        from urllib.parse import quote_plus

        encoded_password = quote_plus(self.POSTGRES_PASSWORD)
        encoded_alembic_password = quote_plus(self.POSTGRES_ALEMBIC_PASSWORD)

        self.POSTGRES_URL = (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{encoded_password}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        self.ALEMBIC_POSTGRES_URL = (
            f"postgresql+asyncpg://{self.POSTGRES_ALEMBIC_USER}:{encoded_alembic_password}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        return self

    # JWT - Optional: Only needed when using FastAPI auth endpoints
    # For development/testing, you can use any random string
    # For production, use: openssl rand -hex 32
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    # Optional: Old JWT secret key for key rotation (allows validating old tokens during rotation)
    JWT_SECRET_KEY_OLD: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Session Token Secret - Separate from JWT for better security isolation
    # If not set, falls back to JWT_SECRET_KEY for backward compatibility
    # For production, use: openssl rand -hex 32
    SESSION_SECRET_KEY: str = ""

    # AI Model Configuration - can be overridden via environment variables
    models: ModelSettings = ModelSettings()

    # Routing Configuration
    ROUTING_MODEL: str = "gpt-4o-mini"
    ROUTING_HISTORY_LIMIT: int = 3

    # App
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3001"

    # Logging - optional file logging
    # If set, only application logs (logger names under "app.*") are written to this file.
    # Platform/third-party logs (e.g. Azure, uvicorn.access) go to stdout only, so LOG_FILE
    # stays clean when deployed to Azure App Service or similar.
    LOG_FILE: str = ""
    LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR
    LOG_MAX_BYTES: int = 10 * 1024 * 1024  # 10 MB per file
    LOG_BACKUP_COUNT: int = 5  # Number of rotated backup files to keep
    NEXTJS_URL: str = "http://localhost:3001"  # Next.js server URL for proxy requests
    # Cookie Domain - Optional: Set explicit domain for cookies (e.g., ".example.com" for subdomain sharing)
    # If not set, cookies will use the default domain (current domain only)
    # For production with subdomains, set to ".yourdomain.com" to share cookies across subdomains
    COOKIE_DOMAIN: str = ""

    # Authentication
    # Note: Authentication is always enabled. Guest users provide anonymous access.

    # MSAL / Azure AD (optional). When AUTH_PROVIDER=msal, backend accepts Azure AD tokens.
    AUTH_PROVIDER: str = "guest"  # "guest" | "msal"
    MSAL_AUTH_COOKIE_NAME: str = "UIT"  # Cookie name for Azure AD token (must match frontend)
    AZURE_AD_TENANT_ID: str = (
        ""  # Tenant ID (or "common" for multi-tenant). Required for MSAL to validate tokens.
    )
    AZURE_AD_CLIENT_ID: str = ""  # App client ID for audience (aud) validation (SPA or API)
    # Comma-separated list of valid audiences. Use when token aud differs from AZURE_AD_CLIENT_ID
    # (e.g. user-impersonation token has aud = API app ID). Example: "api-guid-1,spa-guid-2"
    AZURE_AD_VALID_AUDIENCES: str = ""
    # Only for dev / when v1 token signature verification fails. Validates iss, aud, exp only.
    AZURE_AD_SKIP_SIGNATURE_VERIFY: bool = False

    # Redis - Optional: Only needed for resumable streams
    REDIS_URL: str = ""

    # Password Security
    ENABLE_HIBP_CHECK: bool = False  # Enable Have I Been Pwned password checking

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            # Split comma-separated string and strip whitespace
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = ConfigDict(
        extra="allow",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


class MCPSettings(BaseSettings):
    """Settings for MCP (Model Context Protocol) server connections."""

    server_url: str = "https://ai4data-ai4data-mcp.hf.space/gradio_api/mcp/sse"
    # server_url: str = "http://host.docker.internal:8022/mcp"
    ssl_verify: bool = True  # Set to False for dev environments with proxy/self-signed certs
    timeout: float = 30.0  # HTTP timeout in seconds for individual MCP requests
    load_timeout: float = 15.0  # Max seconds to wait when loading MCP tools at chat start; avoids hanging if server unreachable

    model_config = ConfigDict(
        extra="forbid",
        env_prefix="MCP_",
        case_sensitive=False,
    )


def get_settings() -> Settings:
    """Load environment variables and return Settings instance."""
    dotenv.load_dotenv()
    return Settings()


def get_mcp_settings() -> MCPSettings:
    """Load environment variables and return MCPSettings instance."""
    dotenv.load_dotenv()
    return MCPSettings()


# Initialize settings after loading dotenv
dotenv.load_dotenv()
settings = Settings()


# ENV PATH="/root/.local/bin:$PATH"
# # Suppress hardlink warning in Docker (cache and target are on different filesystems)
# ENV UV_LINK_MODE=copy
