"""Add session_version to AuthSession for deploy-time logout

Revision ID: g8c9d0e1f2a3b
Revises: f7b8c9d0e1f2
Create Date: 2026-03-03

Bump SESSION_VERSION on deploy to invalidate all opaque sessions (force re-login).
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "g8c9d0e1f2a3b"  # pragma: allowlist secret
down_revision: Union[str, None] = "f7b8c9d0e1f2"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "AuthSession",
        sa.Column("session_version", sa.String(64), nullable=False, server_default=sa.text("'1'")),
    )


def downgrade() -> None:
    op.drop_column("AuthSession", "session_version")
