"""
Session token: opaque cookie values with server-side lookup.
No user id or PII is stored in the cookie.

- New flow: cookie = opaque id; user_id stored in AuthSession table.
- Legacy: cookie = user_id:hmac (backward compat); validated in-process.
"""

import hashlib
import hmac
import secrets
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.queries.session_queries import create_session, get_user_id_by_session

# Default max age for session cookie (400 days, browser-friendly)
DEFAULT_SESSION_MAX_AGE_SECONDS = 400 * 24 * 60 * 60


def _validate_legacy_hmac_token(token: str) -> Optional[str]:
    """
    Validate legacy HMAC-signed token (format: user_id:signature).
    Used for backward compatibility only. No PII in new cookies.
    """
    try:
        if ":" not in token:
            return None

        user_id, provided_signature = token.split(":", 1)
        user_id_bytes = user_id.encode("utf-8")

        if settings.SESSION_SECRET_KEY:
            secret = settings.SESSION_SECRET_KEY.encode("utf-8")
            expected = hmac.new(secret, user_id_bytes, hashlib.sha256).hexdigest()
            if hmac.compare_digest(provided_signature, expected):
                return user_id

        secret = settings.JWT_SECRET_KEY.encode("utf-8")
        expected = hmac.new(secret, user_id_bytes, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(provided_signature, expected):
            return None
        return user_id
    except (ValueError, AttributeError):
        return None


def validate_session_token(token: str) -> Optional[str]:
    """
    Synchronous validation for legacy tokens only (user_id:hmac).
    For opaque tokens, returns None (no DB in sync context).
    Use validate_session_token_async when DB is available.
    """
    if not token or ":" not in token:
        return None
    return _validate_legacy_hmac_token(token)


async def validate_session_token_async(db: AsyncSession, token: str) -> Optional[str]:
    """
    Resolve session cookie to user_id. Supports:
    - Opaque token: lookup in AuthSession (no PII in cookie).
    - Legacy token (user_id:hmac): validate in-process for backward compat.
    """
    if not token:
        return None
    if ":" in token:
        user_id = _validate_legacy_hmac_token(token)
        return user_id
    user_id = await get_user_id_by_session(db, token)
    return str(user_id) if user_id else None


async def generate_session_token(
    db: AsyncSession,
    user_id: str,
    kind: str,
    max_age_seconds: int = DEFAULT_SESSION_MAX_AGE_SECONDS,
) -> str:
    """
    Create an opaque session id and store it in AuthSession.
    Cookie value = returned id only; no user_id in cookie.
    """
    session_id = secrets.token_urlsafe(43)
    uid = UUID(user_id)
    await create_session(db, session_id, uid, kind, max_age_seconds)
    return session_id


def is_opaque_token(token: str) -> bool:
    """True if token is opaque (no colon); False if legacy user_id:hmac."""
    return bool(token and ":" not in token)
