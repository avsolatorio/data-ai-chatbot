"""Grant AuthSession table to app user

Revision ID: i0e1f2a3b4c5
Revises: h9d0e1f2a3b4
Create Date: 2026-03-05

Grants SELECT, INSERT, UPDATE, DELETE on AuthSession to the application DB user
(POSTGRES_USER). The AuthSession table was created in f7b8c9d0e1f2 without
this grant, so the app user had no permission to use it.
"""

from typing import Sequence, Union

from alembic import op
from app.db.migration_utils import grant_table_to_app_user, revoke_table_from_app_user

revision: str = "i0e1f2a3b4c5"  # pragma: allowlist secret
down_revision: Union[str, None] = "h9d0e1f2a3b4"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    grant_table_to_app_user(op, "AuthSession")


def downgrade() -> None:
    revoke_table_from_app_user(op, "AuthSession")
