"""add_app_feedback_table

Revision ID: d4e5f6a1b2c3
Revises: b2c3d4e5f6a1
Create Date: 2026-02-06

App-level feedback: 1-5 star rating and optional text. Optional user (anonymous allowed).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op
from app.db.migration_utils import grant_table_to_app_user

revision: str = "d4e5f6a1b2c3"  # pragma: allowlist secret
down_revision: Union[str, None] = "b2c3d4e5f6a1"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "App_feedback",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("userId", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("createdAt", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["userId"],
            ["User.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    grant_table_to_app_user(op, "App_feedback")


def downgrade() -> None:
    op.drop_table("App_feedback")
