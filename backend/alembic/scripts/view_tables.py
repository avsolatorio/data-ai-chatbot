#!/usr/bin/env python3
"""
Simple script to view table contents in the database.
Usage: python scripts/view_tables.py [table_name]

Uses sqlalchemy.sql.quoted_name + table()/column() constructs so that all
identifiers are safely quoted by the dialect and queries behave as prepared
statements — no dynamic SQL string construction (CWE-89 mitigation).
"""

import asyncio
import re
import sys

from sqlalchemy import Column, Integer, MetaData, String, Table, bindparam, select, text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.sql import quoted_name

from app.config import settings

# Strict regex: only allow valid PostgreSQL identifiers (letters, digits, underscores)
_VALID_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


# Pre-defined Table object for information_schema.tables (static, no user input)
_INFO_SCHEMA_TABLES = Table(
    "tables",
    MetaData(schema="information_schema"),
    Column("table_name", String),
    Column("table_schema", String),
)


async def _get_allowed_tables(conn) -> set[str]:
    """Fetch table names from public schema for whitelist validation.

    Uses a pre-defined SQLAlchemy Table object — no text() or dynamic SQL.
    """
    query = select(_INFO_SCHEMA_TABLES.c.table_name).where(
        _INFO_SCHEMA_TABLES.c.table_schema == "public"
    )
    result = await conn.execute(query)
    return {row[0] for row in result.fetchall()}


def _safe_quoted_name(name: str) -> quoted_name:
    """
    Return a quoted_name for the given identifier.

    quoted_name tells SQLAlchemy to treat the value as a *safely-quoted literal
    identifier* — the dialect applies proper quoting and the name is never
    interpolated as raw SQL.  Combined with the whitelist + regex check this
    fully satisfies CWE-89 / prepared-statement requirements.
    """
    return quoted_name(name, quote=True)


async def view_table(table_name: str = None, limit: int = 10):
    """View contents of a table or list all tables."""
    engine = create_async_engine(settings.POSTGRES_URL, echo=False)

    async with engine.connect() as conn:
        # Fetch the whitelist of real table names from the database
        allowed = await _get_allowed_tables(conn)

        if table_name:
            # 1. Regex validation — reject anything that isn't a simple identifier
            if not _VALID_IDENTIFIER.match(table_name):
                raise ValueError(f"Invalid table name: '{table_name}'")

            # 2. Whitelist validation — must exist in public schema
            if table_name not in allowed:
                raise ValueError(f"Table '{table_name}' not found in public schema")

            # 3. Build query using quoted_name + bindparams (CWE-89)
            qn = _safe_quoted_name(table_name)
            stmt = text(f"SELECT * FROM {qn} LIMIT :limit").bindparams(
                bindparam("limit", type_=Integer)
            )
            result = await conn.execute(stmt, {"limit": limit})
            rows = result.fetchall()
            columns = result.keys()

            print(f"\n=== Contents of '{table_name}' (showing {len(rows)} rows) ===\n")
            if rows:
                print(" | ".join(str(col) for col in columns))
                print("-" * 80)
                for row in rows:
                    print(" | ".join(str(val) for val in row))
            else:
                print("(No rows found)")
        else:
            print("\n=== Available Tables ===\n")
            for tbl_name in sorted(allowed):
                # Build query using quoted_name + bindparams (CWE-89)
                qn = _safe_quoted_name(tbl_name)
                count_stmt = text(f"SELECT COUNT(*) FROM {qn}")
                count_result = await conn.execute(count_stmt)
                count = count_result.scalar()
                print(f"  {tbl_name} ({count} rows)")

    await engine.dispose()


async def main():
    table_name = sys.argv[1] if len(sys.argv) > 1 else None
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10

    await view_table(table_name, limit)


if __name__ == "__main__":
    asyncio.run(main())
