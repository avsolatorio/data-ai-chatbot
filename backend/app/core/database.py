"""
Database connection and session management.

This module provides database-agnostic connection handling, automatically
selecting the appropriate engine based on the configured DATABASE_TYPE.
"""

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.config import DatabaseType, settings
from app.core.db.mssql_engine import create_mssql_engine
from app.core.db.postgresql_engine import create_postgresql_engine


def get_engine() -> AsyncEngine:
    """
    Get the appropriate database engine based on configuration.

    Returns:
        AsyncEngine: Configured async engine for the selected database type

    Raises:
        ValueError: If DATABASE_TYPE is not supported or required settings are missing
    """
    if settings.DATABASE_TYPE == DatabaseType.POSTGRESQL:
        return create_postgresql_engine()
    if settings.DATABASE_TYPE == DatabaseType.MSSQL:
        return create_mssql_engine()
    raise ValueError(
        f"Unsupported DATABASE_TYPE: {settings.DATABASE_TYPE}. "
        f"Supported types: {[db_type.value for db_type in DatabaseType]}"
    )


# Create engine based on configuration
engine = get_engine()

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    """
    Dependency function for FastAPI to get database session.

    Yields:
        AsyncSession: Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
