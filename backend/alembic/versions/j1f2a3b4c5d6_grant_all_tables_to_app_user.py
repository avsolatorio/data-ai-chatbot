"""Grant all application tables to app user

Revision ID: j1f2a3b4c5d6
Revises: i0e1f2a3b4c5
Create Date: 2026-03-15

Grants SELECT, INSERT, UPDATE, DELETE on all application tables to the
application DB user (POSTGRES_USER). This ensures the app user can read and
write when migrations are run by a different user (POSTGRES_ALEMBIC_USER).

Tables created before the grant_table_to_app_user convention (Chart, App_feedback,
AuthSession) already have grants. This migration adds grants for the remaining
tables: User, Chat, Document, Message_v2, Stream, Suggestion, Vote_v2, File,
PasswordResetToken, LoginAttempt, RevokedToken, PasswordResetAttempt.
Granting on already-granted tables is idempotent.
"""

from typing import Sequence, Union

from alembic import op
from app.db.migration_utils import grant_table_to_app_user, revoke_table_from_app_user

revision: str = "j1f2a3b4c5d6"  # pragma: allowlist secret
down_revision: Union[str, None] = "i0e1f2a3b4c5"  # pragma: allowlist secret
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# All application tables. Granting on already-granted tables is idempotent.
TABLES = [
    "User",
    "Chat",
    "Document",
    "Message_v2",
    "Stream",
    "Suggestion",
    "Vote_v2",
    "File",
    "PasswordResetToken",
    "LoginAttempt",
    "RevokedToken",
    "PasswordResetAttempt",
    "Chart",
    "App_feedback",
    "AuthSession",
]


def upgrade() -> None:
    for table in TABLES:
        grant_table_to_app_user(op, table)


def downgrade() -> None:
    for table in reversed(TABLES):
        revoke_table_from_app_user(op, table)
