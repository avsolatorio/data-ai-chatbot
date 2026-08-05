"""add_chattokenusage_table

Revision ID: m4n5o6p7q8r9
Revises: l3m4n5o6p7q8
Create Date: 2026-08-02 14:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op
from app.db.migration_utils import grant_table_to_app_user

revision: str = "m4n5o6p7q8r9"  # pragma: allowlist secret
down_revision: Union[str, None] = "l3m4n5o6p7q8"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ChatTokenUsage",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("chatId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("messageId", sa.String(length=64), nullable=False),
        sa.Column("totalTokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("costUSD", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("createdAt", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_chattokenusage_createdat", "ChatTokenUsage", ["createdAt"])
    grant_table_to_app_user(op, "ChatTokenUsage")


def downgrade() -> None:
    op.drop_table("ChatTokenUsage")
