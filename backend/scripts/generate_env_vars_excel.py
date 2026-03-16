#!/usr/bin/env python3
"""
Generate an Excel file documenting all backend environment variables.
Run from backend/: uv run --with openpyxl scripts/generate_env_vars_excel.py
"""

from pathlib import Path

# Environment variables extracted from config.py, .env.example, and codebase
ENV_VARS = [
    # Database - REQUIRED
    {
        "variable": "POSTGRES_HOST",
        "required": "Yes",
        "default": "localhost",
        "description": "PostgreSQL server hostname",
        "category": "Database",
        "notes": "Must be set in .env for production",
    },
    {
        "variable": "POSTGRES_PORT",
        "required": "Yes",
        "default": "5432",
        "description": "PostgreSQL server port",
        "category": "Database",
        "notes": "",
    },
    {
        "variable": "POSTGRES_USER",
        "required": "Yes",
        "default": "postgres",
        "description": "PostgreSQL username for application",
        "category": "Database",
        "notes": "",
    },
    {
        "variable": "POSTGRES_PASSWORD",
        "required": "Yes",
        "default": "postgres",
        "description": "PostgreSQL password for application",
        "category": "Database",
        "notes": "Keep secret; use strong password in production",
    },
    {
        "variable": "POSTGRES_DB",
        "required": "Yes",
        "default": "chatbot_db",
        "description": "PostgreSQL database name",
        "category": "Database",
        "notes": "",
    },
    {
        "variable": "POSTGRES_ALEMBIC_USER",
        "required": "Yes",
        "default": "postgres",
        "description": "PostgreSQL username for migrations",
        "category": "Database",
        "notes": "May differ from POSTGRES_USER",
    },
    {
        "variable": "POSTGRES_ALEMBIC_PASSWORD",
        "required": "Yes",
        "default": "postgres",
        "description": "PostgreSQL password for migrations",
        "category": "Database",
        "notes": "",
    },
    {
        "variable": "POSTGRES_URL_SYNC",
        "required": "No",
        "default": "(empty)",
        "description": "Explicit sync URL for Alembic",
        "category": "Database",
        "notes": "Optional; if not set, derived from async URL",
    },
    # AI/LLM - Required for chat (used by LiteLLM)
    {
        "variable": "AZURE_API_KEY",
        "required": "Yes*",
        "default": "(none)",
        "description": "Azure OpenAI API key",
        "category": "AI/LLM",
        "notes": "Required when using Azure OpenAI; read by LiteLLM",
    },
    {
        "variable": "AZURE_API_BASE",
        "required": "Yes*",
        "default": "(none)",
        "description": "Azure OpenAI API base URL",
        "category": "AI/LLM",
        "notes": "e.g. https://your-resource.openai.azure.com",
    },
    {
        "variable": "AZURE_API_VERSION",
        "required": "No",
        "default": "2024-02-15-preview",
        "description": "Azure OpenAI API version",
        "category": "AI/LLM",
        "notes": "",
    },
    # AI/LLM - Client credentials (alternative to AZURE_API_KEY)
    {
        "variable": "AZURE_CLIENT_ID",
        "required": "Yes*",
        "default": "(empty)",
        "description": "App registration client ID for Azure OpenAI/APIM",
        "category": "AI/LLM",
        "notes": "Required with AZURE_CLIENT_SECRET when using client credentials flow",
    },
    {
        "variable": "AZURE_CLIENT_SECRET",
        "required": "Yes*",
        "default": "(empty)",
        "description": "Client secret for service-to-service auth",
        "category": "AI/LLM",
        "notes": "Required with AZURE_CLIENT_ID when using client credentials flow",
    },
    {
        "variable": "AZURE_TENANT_ID",
        "required": "Yes*",
        "default": "(empty)",
        "description": "Azure AD tenant ID",
        "category": "AI/LLM",
        "notes": "Required with client credentials; used by LiteLLM/Azure Identity",
    },
    {
        "variable": "AZURE_SCOPE",
        "required": "Yes*",
        "default": "(empty)",
        "description": "OAuth scope for the API",
        "category": "AI/LLM",
        "notes": "e.g. api://your-api-app-id/.default",
    },
    # AI Model Configuration
    {
        "variable": "MODEL_PROVIDER",
        "required": "No",
        "default": "azure/",
        "description": "AI model provider prefix",
        "category": "AI/LLM",
        "notes": "",
    },
    {
        "variable": "CHAT_MODEL",
        "required": "No",
        "default": "gpt-5.1",
        "description": "Primary chat model name",
        "category": "AI/LLM",
        "notes": "",
    },
    {
        "variable": "CHAT_MODEL_REASONING",
        "required": "No",
        "default": "o1-mini",
        "description": "Reasoning model for complex tasks",
        "category": "AI/LLM",
        "notes": "",
    },
    {
        "variable": "TITLE_MODEL",
        "required": "No",
        "default": "gpt-4o-mini",
        "description": "Model for chat title generation",
        "category": "AI/LLM",
        "notes": "",
    },
    {
        "variable": "ARTIFACT_MODEL",
        "required": "No",
        "default": "gpt-4o-mini",
        "description": "Model for artifact generation",
        "category": "AI/LLM",
        "notes": "",
    },
    {
        "variable": "ROUTING_MODEL",
        "required": "No",
        "default": "gpt-4o-mini",
        "description": "Model for intent routing",
        "category": "AI/LLM",
        "notes": "",
    },
    # Authentication
    {
        "variable": "JWT_SECRET_KEY",
        "required": "Yes*",
        "default": "dev-secret-key-change-in-production",
        "description": "Secret key for JWT signing",
        "category": "Authentication",
        "notes": "Use openssl rand -hex 32 in production",
    },
    {
        "variable": "JWT_SECRET_KEY_OLD",
        "required": "No",
        "default": "(empty)",
        "description": "Old JWT secret for key rotation",
        "category": "Authentication",
        "notes": "Optional; for validating old tokens during rotation",
    },
    {
        "variable": "JWT_ALGORITHM",
        "required": "No",
        "default": "HS256",
        "description": "JWT signing algorithm",
        "category": "Authentication",
        "notes": "",
    },
    {
        "variable": "JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
        "required": "No",
        "default": "30",
        "description": "JWT token expiry in minutes",
        "category": "Authentication",
        "notes": "",
    },
    {
        "variable": "SESSION_SECRET_KEY",
        "required": "No",
        "default": "(empty)",
        "description": "Session token secret (separate from JWT)",
        "category": "Authentication",
        "notes": "Falls back to JWT_SECRET_KEY if not set",
    },
    {
        "variable": "SESSION_VERSION",
        "required": "No",
        "default": "1",
        "description": "Session version for deploy-time invalidation",
        "category": "Authentication",
        "notes": "Bump to invalidate all sessions",
    },
    # Azure AD (optional, for MSAL auth)
    {
        "variable": "AUTH_PROVIDER",
        "required": "No",
        "default": "guest",
        "description": "Auth mode: guest | user | msal",
        "category": "Authentication",
        "notes": "",
    },
    {
        "variable": "MSAL_AUTH_COOKIE_NAME",
        "required": "No",
        "default": "UIT",
        "description": "Cookie name for Azure AD token",
        "category": "Authentication",
        "notes": "Must match frontend",
    },
    {
        "variable": "AZURE_AD_TENANT_ID",
        "required": "No*",
        "default": "(empty)",
        "description": "Azure AD tenant ID",
        "category": "Authentication",
        "notes": "Required for MSAL; use 'common' for multi-tenant",
    },
    {
        "variable": "AZURE_AD_CLIENT_ID",
        "required": "No*",
        "default": "(empty)",
        "description": "Azure AD app client ID",
        "category": "Authentication",
        "notes": "Required for MSAL; for audience validation",
    },
    {
        "variable": "AZURE_AD_VALID_AUDIENCES",
        "required": "No",
        "default": "(empty)",
        "description": "Comma-separated valid token audiences",
        "category": "Authentication",
        "notes": "Use when token aud differs from AZURE_AD_CLIENT_ID",
    },
    {
        "variable": "AZURE_AD_SKIP_SIGNATURE_VERIFY",
        "required": "No",
        "default": "False",
        "description": "Skip Azure token signature verification",
        "category": "Authentication",
        "notes": "Dev only; must be false in production",
    },
    # Application
    {
        "variable": "ENVIRONMENT",
        "required": "No",
        "default": "development",
        "description": "Environment name",
        "category": "Application",
        "notes": "development | staging | production",
    },
    {
        "variable": "CORS_ORIGINS",
        "required": "No",
        "default": "http://localhost:3001",
        "description": "Comma-separated allowed CORS origins",
        "category": "Application",
        "notes": "Cannot use '*' with credentials",
    },
    {
        "variable": "CSRF_REQUIRE_ORIGIN_ALWAYS",
        "required": "No",
        "default": "False",
        "description": "Require Origin/Referer for state-changing requests",
        "category": "Application",
        "notes": "Set true in production for security",
    },
    {
        "variable": "NEXTJS_URL",
        "required": "No",
        "default": "http://localhost:3001",
        "description": "Next.js server URL for proxy requests",
        "category": "Application",
        "notes": "",
    },
    {
        "variable": "COOKIE_DOMAIN",
        "required": "No",
        "default": "(empty)",
        "description": "Cookie domain for subdomain sharing",
        "category": "Application",
        "notes": "e.g. .yourdomain.com",
    },
    # Logging
    {
        "variable": "LOG_FILE",
        "required": "No",
        "default": "(empty)",
        "description": "Path to application log file",
        "category": "Logging",
        "notes": "",
    },
    {
        "variable": "LOG_LEVEL",
        "required": "No",
        "default": "INFO",
        "description": "Log level: DEBUG, INFO, WARNING, ERROR",
        "category": "Logging",
        "notes": "",
    },
    {
        "variable": "LOG_MAX_BYTES",
        "required": "No",
        "default": "10485760",
        "description": "Max bytes per log file (10 MB)",
        "category": "Logging",
        "notes": "",
    },
    {
        "variable": "LOG_BACKUP_COUNT",
        "required": "No",
        "default": "5",
        "description": "Number of rotated backup files",
        "category": "Logging",
        "notes": "",
    },
    # File upload
    {
        "variable": "MAX_UPLOAD_FILE_SIZE_BYTES",
        "required": "No",
        "default": "5242880",
        "description": "Max upload size in bytes (5 MB)",
        "category": "File Upload",
        "notes": "",
    },
    {
        "variable": "ALLOWED_UPLOAD_IMAGE_TYPES",
        "required": "No",
        "default": "image/jpeg,image/png",
        "description": "Comma-separated allowed MIME types",
        "category": "File Upload",
        "notes": "",
    },
    # Session / Cache
    {
        "variable": "USER_CACHE_TTL_SECONDS",
        "required": "No",
        "default": "120",
        "description": "User cache TTL in seconds",
        "category": "Application",
        "notes": "",
    },
    {
        "variable": "GUEST_SESSION_MAX_AGE_DAYS",
        "required": "No",
        "default": "90",
        "description": "Guest session absolute TTL in days",
        "category": "Application",
        "notes": "",
    },
    {
        "variable": "GUEST_SESSION_IDLE_DAYS",
        "required": "No",
        "default": "30",
        "description": "Guest session idle timeout in days",
        "category": "Application",
        "notes": "",
    },
    # Redis
    {
        "variable": "REDIS_URL",
        "required": "No",
        "default": "(empty)",
        "description": "Redis URL for resumable streams",
        "category": "Redis",
        "notes": "Optional; e.g. redis://localhost:6379",
    },
    # Rate limiting
    {
        "variable": "RATE_LIMIT_ENABLED",
        "required": "No",
        "default": "True",
        "description": "Enable global API rate limiting",
        "category": "Rate Limiting",
        "notes": "",
    },
    {
        "variable": "RATE_LIMIT_REQUESTS",
        "required": "No",
        "default": "50",
        "description": "Max requests per window",
        "category": "Rate Limiting",
        "notes": "",
    },
    {
        "variable": "RATE_LIMIT_WINDOW_SECONDS",
        "required": "No",
        "default": "60",
        "description": "Rate limit window in seconds",
        "category": "Rate Limiting",
        "notes": "",
    },
    # Security
    {
        "variable": "ENABLE_HIBP_CHECK",
        "required": "No",
        "default": "False",
        "description": "Enable Have I Been Pwned password check",
        "category": "Security",
        "notes": "",
    },
    # Feedback
    {
        "variable": "FEEDBACK_REVIEWER_EMAILS",
        "required": "No",
        "default": "(empty)",
        "description": "Comma-separated emails allowed to list feedback",
        "category": "Feedback",
        "notes": "Empty = no one can access",
    },
    # MCP (Model Context Protocol)
    {
        "variable": "MCP_SERVER_URL",
        "required": "No",
        "default": "https://ai4data-ai4data-mcp.hf.space/gradio_api/mcp/sse",
        "description": "MCP server URL",
        "category": "MCP",
        "notes": "env_prefix MCP_",
    },
    {
        "variable": "MCP_SSL_VERIFY",
        "required": "No",
        "default": "True",
        "description": "Verify SSL for MCP connections",
        "category": "MCP",
        "notes": "",
    },
    {
        "variable": "MCP_TIMEOUT",
        "required": "No",
        "default": "30.0",
        "description": "MCP HTTP timeout in seconds",
        "category": "MCP",
        "notes": "",
    },
    {
        "variable": "MCP_LOAD_TIMEOUT",
        "required": "No",
        "default": "15.0",
        "description": "Max seconds to wait when loading MCP tools",
        "category": "MCP",
        "notes": "",
    },
    {
        "variable": "MCP_TOOLS_CACHE_TTL_SECONDS",
        "required": "No",
        "default": "300.0",
        "description": "MCP tool list cache TTL in seconds",
        "category": "MCP",
        "notes": "0 = no cache",
    },
    # LiteLLM (optional)
    {
        "variable": "LITELLM_LOG",
        "required": "No",
        "default": "(none)",
        "description": "LiteLLM log level (e.g. DEBUG)",
        "category": "AI/LLM",
        "notes": "Controls LiteLLM verbosity",
    },
]


def main() -> None:
    try:
        import openpyxl
        from openpyxl.styles import Font
        from openpyxl.utils import get_column_letter
    except ImportError:
        print(
            "Installing openpyxl... run: uv run --with openpyxl scripts/generate_env_vars_excel.py"
        )
        raise SystemExit(1) from None

    backend_dir = Path(__file__).resolve().parent.parent
    out_path = backend_dir / "backend_env_variables.xlsx"

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Environment Variables"

    headers = ["Variable", "Required", "Default", "Description", "Category", "Notes"]
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = Font(bold=True)

    for row_idx, env in enumerate(ENV_VARS, start=2):
        ws.cell(row=row_idx, column=1, value=env["variable"])
        ws.cell(row=row_idx, column=2, value=env["required"])
        ws.cell(row=row_idx, column=3, value=env["default"])
        ws.cell(row=row_idx, column=4, value=env["description"])
        ws.cell(row=row_idx, column=5, value=env["category"])
        ws.cell(row=row_idx, column=6, value=env["notes"])

    for col in range(1, len(headers) + 1):
        ws.column_dimensions[get_column_letter(col)].width = 28

    wb.save(out_path)
    print(f"Generated: {out_path}")


if __name__ == "__main__":
    main()
