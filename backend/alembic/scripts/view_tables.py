#!/usr/bin/env python3
"""
Simple script to view table contents in the database.
Usage: python scripts/view_tables.py [table_name]
"""

import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings


async def _get_allowed_tables(conn) -> set[str]:
    """Fetch table names from public schema for whitelist validation (SQL injection prevention)."""
    result = await conn.execute(
        text("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
        """)
    )
    return {row[0] for row in result.fetchall()}


async def view_table(table_name: str = None, limit: int = 10):
    """View contents of a table or list all tables."""
    engine = create_async_engine(settings.POSTGRES_URL, echo=False)

    async with engine.connect() as conn:
        if table_name:
            # Whitelist validation: only allow table names from information_schema
            allowed = await _get_allowed_tables(conn)
            if table_name not in allowed:
                raise ValueError(f"Table '{table_name}' not found in public schema")

            # View specific table (table_name is now validated against whitelist)
            query = text(f"SELECT * FROM {chr(34)}{table_name}{chr(34)} LIMIT :limit")
            result = await conn.execute(query, {"limit": limit})
            rows = result.fetchall()
            columns = result.keys()

            print(f"\n=== Contents of '{table_name}' (showing {len(rows)} rows) ===\n")
            if rows:
                # Print column headers
                print(" | ".join(str(col) for col in columns))
                print("-" * 80)
                # Print rows
                for row in rows:
                    print(" | ".join(str(val) for val in row))
            else:
                print("(No rows found)")
        else:
            # List all tables
            result = await conn.execute(
                text("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    ORDER BY table_name;
                """)
            )
            tables = result.fetchall()

            print("\n=== Available Tables ===\n")
            for (table,) in tables:
                # Get row count
                # Use identifier() method for safe table name handling to prevent SQL injection
                count_query = text(f"SELECT COUNT(*) FROM {chr(34)}{table}{chr(34)}")
                count_result = await conn.execute(count_query)
                count = count_result.scalar()
                print(f"  {table} ({count} rows)")

    await engine.dispose()


async def main():
    table_name = sys.argv[1] if len(sys.argv) > 1 else None
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10

    await view_table(table_name, limit)


if __name__ == "__main__":
    asyncio.run(main())
