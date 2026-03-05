"""Add last_activity_at to AuthSession for guest idle TTL

Revision ID: h9d0e1f2a3b4
Revises: g8c9d0e1f2a3b
Create Date: 2026-03-05

Guest sessions expire after GUEST_SESSION_IDLE_DAYS without activity.
last_activity_at is updated on each session use.
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "h9d0e1f2a3b4"  # pragma: allowlist secret
down_revision: Union[str, None] = "g8c9d0e1f2a3b"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "AuthSession",
        sa.Column("last_activity_at", sa.DateTime(), nullable=True),
    )
    # Backfill: set last_activity_at = created_at for existing rows
    op.execute(
        sa.text(
            'UPDATE "AuthSession" SET last_activity_at = created_at WHERE last_activity_at IS NULL'
        )
    )
    op.alter_column(
        "AuthSession",
        "last_activity_at",
        existing_type=sa.DateTime(),
        nullable=False,
    )


def downgrade() -> None:
    op.drop_column("AuthSession", "last_activity_at")
