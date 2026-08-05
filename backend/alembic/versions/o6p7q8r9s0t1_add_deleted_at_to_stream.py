"""add_deleted_at_to_stream

Revision ID: o6p7q8r9s0t1
Revises: n5o6p7q8r9s0
Create Date: 2026-08-05 14:45:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "o6p7q8r9s0t1"  # pragma: allowlist secret
down_revision: Union[str, None] = "n5o6p7q8r9s0"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "Stream",
        sa.Column("deletedAt", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("Stream", "deletedAt")
