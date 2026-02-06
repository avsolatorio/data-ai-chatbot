"""
SQLAlchemy model for app-level feedback (rating + free text).
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.core.database import Base


class AppFeedback(Base):
    """App feedback: 1-5 star rating and optional text. User optional (anonymous allowed)."""

    __tablename__ = "App_feedback"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    rating = Column(Integer, nullable=False)  # 1-5
    feedback = Column(Text, nullable=True)
    user_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("User.id"),
        name="userId",
        nullable=True,
    )
    created_at = Column(DateTime, name="createdAt", nullable=False, default=datetime.utcnow)
