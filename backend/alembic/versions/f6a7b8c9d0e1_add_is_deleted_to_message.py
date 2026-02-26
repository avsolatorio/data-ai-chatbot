"""add_deleted_at_to_message

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-02-26 09:57:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f6a7b8c9d0e1"  # pragma: allowlist secret
down_revision: Union[str, None] = "e5f6a7b8c9d0"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add deletedAt column - null means active, timestamp means soft-deleted
    op.add_column(
        "Message_v2",
        sa.Column("deletedAt", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("Message_v2", "deletedAt")
