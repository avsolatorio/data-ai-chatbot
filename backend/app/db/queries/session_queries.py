"""
Database queries for opaque auth sessions.
Cookie stores only session id; user_id is resolved server-side.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

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
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


async def get_user_id_by_session(
    session: AsyncSession,
    session_id: str,
    current_version: str | None = None,
) -> UUID | None:
    """Return user_id if session exists, is not expired, and version matches; else None."""
    now = datetime.utcnow()
    conditions = [
        AuthSession.id == session_id,
        AuthSession.expires_at > now,
    ]
    if current_version is not None:
        conditions.append(AuthSession.session_version == current_version)
    result = await session.execute(select(AuthSession.user_id).where(*conditions))
    return result.scalar_one_or_none()


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
