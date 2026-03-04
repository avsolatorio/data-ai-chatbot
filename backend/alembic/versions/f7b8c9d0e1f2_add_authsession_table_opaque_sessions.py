"""Add AuthSession table for opaque session cookies

Revision ID: f7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-03-03

Opaque session IDs only in cookies; user_id stored server-side only.
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "f7b8c9d0e1f2"  # pragma: allowlist secret
down_revision: Union[str, None] = "f6a7b8c9d0e1"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "AuthSession",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["User.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_AuthSession_user_id"), "AuthSession", ["user_id"], unique=False)
    op.create_index(op.f("ix_AuthSession_expires_at"), "AuthSession", ["expires_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_AuthSession_expires_at"), table_name="AuthSession")
    op.drop_index(op.f("ix_AuthSession_user_id"), table_name="AuthSession")
    op.drop_table("AuthSession")
