"""Add name and azure_oid to User for MSAL

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a1b2c3
Create Date: 2026-02-17

Stores display name and Azure AD object id (oid) for users signing in via MSAL.
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "e5f6a7b8c9d0"  # pragma: allowlist secret
down_revision: Union[str, None] = "d4e5f6a1b2c3"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("User", sa.Column("name", sa.String(length=255), nullable=True))
    op.add_column("User", sa.Column("azure_oid", sa.String(length=64), nullable=True))
    op.create_unique_constraint("uq_User_azure_oid", "User", ["azure_oid"])


def downgrade() -> None:
    op.drop_constraint("uq_User_azure_oid", "User", type_="unique")
    op.drop_column("User", "azure_oid")
    op.drop_column("User", "name")
