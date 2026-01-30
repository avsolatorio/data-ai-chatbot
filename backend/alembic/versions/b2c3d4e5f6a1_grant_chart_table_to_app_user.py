"""grant_chart_table_to_app_user

Revision ID: b2c3d4e5f6a1
Revises: a1b2c3d4e5f6
Create Date: 2026-01-30

Grants SELECT, INSERT, UPDATE, DELETE on Chart to the application DB user
(POSTGRES_USER). Needed when the Chart table was created before the
grant_table_to_app_user convention was added.
"""

from typing import Sequence, Union

from alembic import op
from app.db.migration_utils import grant_table_to_app_user

revision: str = "b2c3d4e5f6a1"  # pragma: allowlist secret
down_revision: Union[str, None] = "a1b2c3d4e5f6"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    grant_table_to_app_user(op, "Chart")


def downgrade() -> None:
    from app.db.migration_utils import revoke_table_from_app_user

    revoke_table_from_app_user(op, "Chart")
