"""add_deleted_at_to_vote_v2

Revision ID: n5o6p7q8r9s0
Revises: m4n5o6p7q8r9
Create Date: 2026-08-04 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "n5o6p7q8r9s0"  # pragma: allowlist secret
down_revision: Union[str, None] = "m4n5o6p7q8r9"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "Vote_v2",
        sa.Column("deletedAt", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("Vote_v2", "deletedAt")
