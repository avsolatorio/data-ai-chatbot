"""message_id_to_uuid

Revision ID: p7q8r9s0t1u2
Revises: o6p7q8r9s0t1
Create Date: 2026-08-05 15:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "p7q8r9s0t1u2"  # pragma: allowlist secret
down_revision: Union[str, None] = "o6p7q8r9s0t1"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "ChatTokenUsage",
        "messageId",
        existing_type=sa.String(length=64),
        type_=postgresql.UUID(as_uuid=True),
        postgresql_using='"messageId"::uuid',
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "ChatTokenUsage",
        "messageId",
        existing_type=postgresql.UUID(as_uuid=True),
        type_=sa.String(length=64),
        existing_nullable=False,
    )
