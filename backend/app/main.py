import logging
import os
import sys
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.api.v1 import (
    auth,
    charts,
    chat,
    chat_resume,
    chat_stream,
    document,
    feedback,
    files,
    history,
    mcp_tools,
    vote,
)
from app.api.v1 import (
    models as models_router,
)
from app.config import settings
from app.core.cache_headers import CachePreventionMiddleware
from app.core.csrf import CSRFMiddleware
from app.core.rate_limit import RateLimitMiddleware
from app.core.redis import close_redis_client
from app.utils.error_id import USER_MESSAGE_GENERIC, new_error_id

# Resolve log level from config (DEBUG, INFO, WARNING, ERROR)
_log_level_name = (settings.LOG_LEVEL or "INFO").strip().upper()
_log_level = getattr(logging, _log_level_name, logging.INFO)

# Root logger: stdout only (Azure / platform logs stay here, not in LOG_FILE)
_log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
logging.basicConfig(
    level=_log_level,
    format=_log_format,
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True,  # Override any existing configuration
)
root_logger = logging.getLogger()
root_logger.setLevel(_log_level)

# LOG_FILE: attach file handler only to the "app" logger so only application
# logs are written to the file. Azure platform logs, uvicorn.access, and other
# third-party loggers are not sent to LOG_FILE (they still go to stdout).
if settings.LOG_FILE and settings.LOG_FILE.strip():
    _log_path = settings.LOG_FILE.strip()
    _log_dir = os.path.dirname(_log_path)
    if _log_dir:
        os.makedirs(_log_dir, exist_ok=True)
    _file_handler = RotatingFileHandler(
        _log_path,
        maxBytes=settings.LOG_MAX_BYTES,
        backupCount=settings.LOG_BACKUP_COUNT,
        encoding="utf-8",
    )
    _file_handler.setFormatter(logging.Formatter(_log_format))
    _app_logger = logging.getLogger("app")
    _app_logger.setLevel(_log_level)
    _app_logger.addHandler(_file_handler)

# Configure SQLAlchemy logging BEFORE database imports
# Set to WARNING to suppress INFO level SQL query logs
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.dialects").setLevel(logging.WARNING)

# Ensure uvicorn loggers use the configured level
logging.getLogger("uvicorn").setLevel(_log_level)
logging.getLogger("uvicorn.access").setLevel(_log_level)

# Test logging
logger = logging.getLogger(__name__)
logger.info("=== FastAPI app starting, logging configured ===")
if settings.LOG_FILE and settings.LOG_FILE.strip():
    logger.info("Logs are also being written to: %s", settings.LOG_FILE.strip())


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("=== FastAPI app startup ===")
    yield
    # Shutdown
    logger.info("=== FastAPI app shutdown ===")
    await close_redis_client()


app = FastAPI(
    title="AI Chatbot API",
    version="1.0.0",
    description="FastAPI backend for AI Chatbot application",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


async def exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Log errors with a unique ID and return a safe response; never expose internals."""
    if isinstance(exc, HTTPException):
        if exc.status_code >= 500:
            error_id = new_error_id()
            logger.error("Error [%s]: %s", error_id, exc, exc_info=True)
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": USER_MESSAGE_GENERIC, "errorId": error_id},
            )
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    error_id = new_error_id()
    logger.error("Error [%s]: %s", error_id, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": USER_MESSAGE_GENERIC, "errorId": error_id},
    )


app.add_exception_handler(Exception, exception_handler)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global API rate limit (max requests per client per window; 429 when exceeded)
if settings.RATE_LIMIT_ENABLED:
    app.add_middleware(RateLimitMiddleware)

# CSRF: validate Origin/Referer for state-changing requests (POST/PUT/PATCH/DELETE)
app.add_middleware(CSRFMiddleware)

# Cache prevention: no-store for all responses to avoid form/sensitive data caching
app.add_middleware(CachePreventionMiddleware)


@app.middleware("http")
async def session_version_header(request: Request, call_next):
    """Add X-Session-Version to /api/auth/me responses so MSAL clients can force logout on deploy."""
    response = await call_next(request)
    if request.url.path == "/api/auth/me":
        version = getattr(settings, "SESSION_VERSION", "1")
        response.headers["X-Session-Version"] = version
    return response


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(chat_stream.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(chat_resume.router, prefix="/api/chat", tags=["chat"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(vote.router, prefix="/api/vote", tags=["vote"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(document.router, prefix="/api/document", tags=["document"])
app.include_router(charts.router, prefix="/api/v1/charts", tags=["charts"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(mcp_tools.router, prefix="/api/v1/mcp", tags=["mcp"])
app.include_router(models_router.router, prefix="/api/models", tags=["models"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/")
async def root():
    return {"message": "AI Chatbot API", "docs": "/docs", "health": "/health"}


@app.get("/test-log")
async def test_log():
    """Test endpoint to verify logging works."""
    logger.info("=== TEST LOG ENDPOINT CALLED ===")
    logger.warning("This is a WARNING log")
    logger.error("This is an ERROR log")
    return {
        "status": "ok",
        "message": "Check terminal and log file for logs",
        "log_file": settings.LOG_FILE or None,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
