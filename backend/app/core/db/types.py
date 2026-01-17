"""
Database-agnostic type definitions for SQLAlchemy models.

This module provides type definitions that work across different database backends
(PostgreSQL, MSSQL, etc.) by automatically selecting the appropriate SQLAlchemy type
based on the configured database type.
"""

import uuid
from typing import Any

from sqlalchemy import TypeDecorator
from sqlalchemy.dialects import mssql, postgresql
from sqlalchemy.types import CHAR, JSON, TypeEngine


class GUID(TypeDecorator):
    """
    Platform-independent GUID/UUID type.

    Uses PostgreSQL's UUID type when using PostgreSQL, and MSSQL's UNIQUEIDENTIFIER
    when using MSSQL. Falls back to CHAR(36) for other databases.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect: Any) -> TypeEngine:
        if dialect.name == "postgresql":
            # Use as_uuid=True to match the original behavior and ensure UUID objects are returned
            return dialect.type_descriptor(postgresql.UUID(as_uuid=True))
        if dialect.name == "mssql":
            return dialect.type_descriptor(mssql.UNIQUEIDENTIFIER())
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value: Any, dialect: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return str(value)
        if isinstance(value, str):
            return value
        raise ValueError(f"Invalid UUID value: {value}")

    def process_result_value(self, value: Any, dialect: Any) -> uuid.UUID | None:
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        if isinstance(value, str):
            return uuid.UUID(value)
        return uuid.UUID(str(value))


# Alias for backward compatibility and clarity
UUID = GUID


class JSONType(TypeDecorator):
    """
    Platform-independent JSON type.

    Uses PostgreSQL's JSONB when using PostgreSQL, and SQLAlchemy's JSON type
    (which maps to NVARCHAR(MAX) with JSON support in MSSQL) when using MSSQL.
    """

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect: Any) -> TypeEngine:
        if dialect.name == "postgresql":
            return dialect.type_descriptor(postgresql.JSONB())
        # For MSSQL and other databases, use standard JSON type
        return dialect.type_descriptor(JSON())


# Alias for backward compatibility
JSONB = JSONType
