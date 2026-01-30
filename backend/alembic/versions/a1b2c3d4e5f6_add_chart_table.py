"""add_chart_table

Revision ID: a1b2c3d4e5f6
Revises: 8e1b2e947055
Create Date: 2026-01-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op
from app.db.migration_utils import grant_table_to_app_user

revision: str = "a1b2c3d4e5f6"  # pragma: allowlist secret
down_revision: Union[str, None] = "8e1b2e947055"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "Chart",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("createdAt", sa.DateTime(), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("spec", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("userId", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["userId"],
            ["User.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    grant_table_to_app_user(op, "Chart")


def downgrade() -> None:
    op.drop_table("Chart")
