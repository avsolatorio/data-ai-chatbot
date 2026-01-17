from enum import Enum
from typing import List, Union

import dotenv
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings


class ModelType(str, Enum):
    """Enum for AI model types used in the application."""

    CHAT_MODEL = "chat-model"
    CHAT_MODEL_REASONING = "chat-model-reasoning"
    TITLE_MODEL = "title-model"
    ARTIFACT_MODEL = "artifact-model"


class DatabaseType(str, Enum):
    """Enum for supported database types."""

    POSTGRESQL = "postgresql"
    MSSQL = "mssql"


class ModelSettings(BaseSettings):
    MODEL_PROVIDER: str = "azure/"
    CHAT_MODEL: str = "gpt-4o-mini"
    CHAT_MODEL_REASONING: str = "o1-mini"
    TITLE_MODEL: str = "gpt-4o-mini"
    ARTIFACT_MODEL: str = "gpt-4o-mini"


class AzureSQLSettings(BaseSettings):
    SERVER: str | None = None
    DATABASE: str | None = None
    USERNAME: str | None = None
    PASSWORD: str | None = None
    PORT: int = 1433  # Default MSSQL port
    USE_ENTRA_ID: bool = False  # Use Entra ID (Azure AD) authentication (default: false)
    ODBC_DRIVER: str = "ODBC Driver 18 for SQL Server"  # Default ODBC driver


class Settings(BaseSettings):
    # Database Configuration
    DATABASE_TYPE: DatabaseType = DatabaseType.POSTGRESQL  # "postgresql" or "mssql"

    # PostgreSQL - Required when DATABASE_TYPE=postgresql
    # Format: postgresql+asyncpg://user:password@host:port/database  # pragma: allowlist secret
    POSTGRES_URL: str = ""  # pragma: allowlist secret
    POSTGRES_URL_SYNC: str = ""

    # Azure SQL (MSSQL) - Required when DATABASE_TYPE=mssql
    AZURE_SQL: AzureSQLSettings = AzureSQLSettings()

    @model_validator(mode="after")
    def validate_database_config(self) -> "Settings":
        """Validate database configuration based on DATABASE_TYPE."""
        if self.DATABASE_TYPE == DatabaseType.POSTGRESQL and not self.POSTGRES_URL:
            raise ValueError(
                "POSTGRES_URL is required when DATABASE_TYPE=postgresql. "
                "Please set POSTGRES_URL in your environment variables."
            )
        if self.DATABASE_TYPE == DatabaseType.MSSQL:
            azure_sql = self.AZURE_SQL
            if not azure_sql.SERVER or not azure_sql.DATABASE:
                raise ValueError(
                    "AZURE_SQL_SERVER and AZURE_SQL_DATABASE are required when DATABASE_TYPE=mssql. "
                    "Please set these in your environment variables."
                )
            if not azure_sql.USE_ENTRA_ID and (not azure_sql.USERNAME or not azure_sql.PASSWORD):
                raise ValueError(
                    "AZURE_SQL_USERNAME and AZURE_SQL_PASSWORD are required when "
                    "DATABASE_TYPE=mssql and AZURE_SQL_USE_ENTRA_ID=false. "
                    "Please set these in your environment variables."
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

    # AI
    OPENAI_API_KEY: str = ""  # OpenAI API key for aisuite
    XAI_API_KEY: str = ""  # Deprecated: kept for backward compatibility
    AI_GATEWAY_URL: str = ""  # Deprecated: using aisuite instead
    MODEL_PREFIX: str = "azure/"

    # AI Model Configuration - can be overridden via environment variables
    models: ModelSettings = ModelSettings()

    # App
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3001"
    NEXTJS_URL: str = "http://localhost:3001"  # Next.js server URL for proxy requests
    INTERNAL_API_SECRET: str = (
        "dev-internal-secret-change-in-production"  # Secret for FastAPI → Next.js internal requests
    )
    # Cookie Domain - Optional: Set explicit domain for cookies (e.g., ".example.com" for subdomain sharing)
    # If not set, cookies will use the default domain (current domain only)
    # For production with subdomains, set to ".yourdomain.com" to share cookies across subdomains
    COOKIE_DOMAIN: str = ""

    # Authentication
    # Note: Authentication is always enabled. Guest users provide anonymous access.

    # Blob
    BLOB_READ_WRITE_TOKEN: str = ""

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

    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = "utf-8"
        extra = "ignore"


class MCPSettings(BaseSettings):
    """Settings for MCP (Model Context Protocol) server connections."""

    server_url: str = "https://ai4data-ai4data-mcp.hf.space/gradio_api/mcp/sse"
    # server_url: str = "http://host.docker.internal:8022/mcp"
    ssl_verify: bool = True  # Set to False for dev environments with proxy/self-signed certs
    timeout: float = 30.0  # HTTP timeout in seconds

    class Config:
        env_prefix = "MCP_"
        case_sensitive = False
        extra = "ignore"


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
