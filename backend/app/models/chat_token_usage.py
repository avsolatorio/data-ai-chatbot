"""Token usage record per message for admin metrics aggregation."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


# ruff: noqa: N815
class ChatTokenUsage(Base):
    """Per-message token usage record with cost estimation."""

    __tablename__ = "ChatTokenUsage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), nullable=False, name="chatId")
    message_id = Column(UUID(as_uuid=True), nullable=False, name="messageId")
    total_tokens = Column(Integer, nullable=False, default=0, name="totalTokens")
    cost_usd = Column(Float, nullable=False, default=0.0, name="costUSD")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, name="createdAt")
