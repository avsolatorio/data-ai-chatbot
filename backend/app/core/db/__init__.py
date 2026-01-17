"""
Database abstraction layer.

This module provides database-agnostic connection handling and type definitions.
"""

from app.core.db.mssql_engine import create_mssql_engine
from app.core.db.postgresql_engine import create_postgresql_engine
from app.core.db.types import GUID, JSONB, UUID, JSONType

__all__ = [
    "create_mssql_engine",
    "create_postgresql_engine",
    "GUID",
    "JSONB",
    "JSONType",
    "UUID",
]
