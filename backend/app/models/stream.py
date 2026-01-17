import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey

from app.core.database import Base
from app.core.db.types import UUID


class Stream(Base):
    __tablename__ = "Stream"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    chatId = Column(UUID(), ForeignKey("Chat.id"), nullable=False)  # noqa: N815
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)  # noqa: N815
