"""
Server-side session store for opaque session cookies.
Cookie value is session id only; no user id or PII is stored in the cookie.
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class AuthSession(Base):
    """
    Opaque session record: id is the cookie value (unguessable token);
    user_id is stored only server-side. No PII in cookie.
    """

    __tablename__ = "AuthSession"

    id = Column(String(64), primary_key=True)  # Opaque token (e.g. secrets.token_urlsafe(43))
    user_id = Column(UUID(as_uuid=True), ForeignKey("User.id"), nullable=False, index=True)
    kind = Column(String(16), nullable=False)  # "guest" or "regular"
    session_version = Column(
        String(64), nullable=False, default="1"
    )  # Bump on deploy to force logout
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    # For guest sessions: idle TTL is enforced by checking last_activity_at in get_user_id_by_session.
    last_activity_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", backref="auth_sessions")
