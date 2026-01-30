"""
Utilities for Alembic migrations.

Use grant_table_to_app_user() in any migration that creates a new table
so the application DB user (POSTGRES_USER) has SELECT/INSERT/UPDATE/DELETE.
"""

import os

from alembic.operations import Operations


def grant_table_to_app_user(op: Operations, table_name: str) -> None:
    """
    Grant SELECT, INSERT, UPDATE, DELETE on the given table to the app user.

    Call this in the same migration that creates the table, right after
    op.create_table(...). Uses POSTGRES_USER from the environment (default: postgres).
    """
    app_user = os.environ.get("POSTGRES_USER", "postgres")
    op.execute(f'GRANT SELECT, INSERT, UPDATE, DELETE ON "{table_name}" TO "{app_user}"')


def revoke_table_from_app_user(op: Operations, table_name: str) -> None:
    """
    Revoke table privileges from the app user (for downgrade).
    """
    app_user = os.environ.get("POSTGRES_USER", "postgres")
    op.execute(f'REVOKE SELECT, INSERT, UPDATE, DELETE ON "{table_name}" FROM "{app_user}"')
