"""
Database queries for opaque auth sessions.
Cookie stores only session id; user_id is resolved server-side.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.auth_session import AuthSession


async def create_session(
    session: AsyncSession,
    session_id: str,
    user_id: UUID,
    kind: str,
    max_age_seconds: int,
    session_version: str = "1",
) -> AuthSession:
    """Create a session row. Caller must generate session_id (opaque token)."""
    now = datetime.utcnow()
    expires_at = datetime.fromtimestamp(now.timestamp() + max_age_seconds)
    row = AuthSession(
        id=session_id,
        user_id=user_id,
        kind=kind,
        session_version=session_version,
        created_at=now,
        expires_at=expires_at,
        last_activity_at=now,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


def _guest_idle_seconds() -> int | None:
    """Return guest idle TTL in seconds, or None to disable idle check."""
    days = getattr(settings, "GUEST_SESSION_IDLE_DAYS", None)
    if days is None or days <= 0:
        return None
    return days * 24 * 60 * 60


async def get_user_id_by_session(
    session: AsyncSession,
    session_id: str,
    current_version: str | None = None,
) -> UUID | None:
    """
    Return user_id if session exists, is not expired, and version matches.
    For guest sessions, also enforces idle TTL (GUEST_SESSION_IDLE_DAYS).
    Updates last_activity_at on successful use.
    """
    now = datetime.utcnow()
    conditions = [
        AuthSession.id == session_id,
        AuthSession.expires_at > now,
    ]
    if current_version is not None:
        conditions.append(AuthSession.session_version == current_version)
    # Select user_id, kind, last_activity_at for idle check and update
    result = await session.execute(
        select(AuthSession.user_id, AuthSession.kind, AuthSession.last_activity_at).where(
            *conditions
        )
    )
    row = result.one_or_none()
    if row is None:
        return None
    user_id, kind, last_activity_at = row
    # Guest idle TTL: if session is guest and last_activity is too old, treat as expired
    if kind == "guest":
        idle_seconds = _guest_idle_seconds()
        if idle_seconds is not None and last_activity_at is not None:
            idle_cutoff = datetime.fromtimestamp(now.timestamp() - idle_seconds)
            if last_activity_at < idle_cutoff:
                return None
    # Refresh last_activity_at on use
    await session.execute(
        update(AuthSession).where(AuthSession.id == session_id).values(last_activity_at=now)
    )
    await session.commit()
    return user_id


async def delete_session_by_id(session: AsyncSession, session_id: str) -> bool:
    """Delete one session by id. Returns True if a row was deleted."""
    result = await session.execute(delete(AuthSession).where(AuthSession.id == session_id))
    await session.commit()
    return result.rowcount > 0


async def delete_sessions_for_user(
    session: AsyncSession, user_id: UUID, kind: str | None = None
) -> int:
    """Delete all sessions for a user, optionally filtered by kind. Returns count deleted."""
    q = delete(AuthSession).where(AuthSession.user_id == user_id)
    if kind is not None:
        q = q.where(AuthSession.kind == kind)
    result = await session.execute(q)
    await session.commit()
    return result.rowcount
