"""
PostgreSQL engine factory.

Creates SQLAlchemy async engine for PostgreSQL using asyncpg driver.
"""

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.config import settings


def create_postgresql_engine() -> AsyncEngine:
    """
    Create an async PostgreSQL engine.

    Returns:
        AsyncEngine: Configured async engine for PostgreSQL

    Raises:
        ValueError: If POSTGRES_URL is not configured
    """
    if not settings.POSTGRES_URL:
        raise ValueError(
            "POSTGRES_URL is required when DATABASE_TYPE=postgresql. "
            "Please set POSTGRES_URL in your environment variables."
        )

    return create_async_engine(
        settings.POSTGRES_URL,
        echo=settings.ENVIRONMENT == "development",
        future=True,
        pool_pre_ping=True,
    )
