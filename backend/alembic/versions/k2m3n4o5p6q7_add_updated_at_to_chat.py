"""Add updatedAt to Chat for last-activity ordering

Revision ID: k2m3n4o5p6q7
Revises: j1f2a3b4c5d6
Create Date: 2026-04-18

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "k2m3n4o5p6q7"  # pragma: allowlist secret
down_revision: Union[str, None] = "j1f2a3b4c5d6"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("Chat", sa.Column("updatedAt", sa.DateTime(), nullable=True))
    op.execute(
        """
        UPDATE "Chat" AS c
        SET "updatedAt" = GREATEST(
            c."createdAt",
            COALESCE(
                (
                    SELECT MAX(m."createdAt")
                    FROM "Message_v2" m
                    WHERE m."chatId" = c.id AND m."deletedAt" IS NULL
                ),
                c."createdAt"
            )
        )
        """
    )
    op.alter_column("Chat", "updatedAt", nullable=False)


def downgrade() -> None:
    op.drop_column("Chat", "updatedAt")
