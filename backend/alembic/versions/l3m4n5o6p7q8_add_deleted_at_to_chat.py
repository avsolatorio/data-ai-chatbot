"""add_deleted_at_to_chat

Revision ID: l3m4n5o6p7q8
Revises: 9bab245e8167
Create Date: 2026-08-02 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "l3m4n5o6p7q8"  # pragma: allowlist secret
down_revision: Union[str, None] = "9bab245e8167"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "Chat",
        sa.Column("deletedAt", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("Chat", "deletedAt")
