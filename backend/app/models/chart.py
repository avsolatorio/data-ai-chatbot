import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


# ruff: noqa: N815
class Chart(Base):
    """Stores Vega-Lite chart specifications (config, data, mark, encoding, etc.)."""

    __tablename__ = "Chart"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, name="createdAt")
    title = Column(String(512), nullable=False)
    spec = Column(JSONB, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("User.id"), nullable=True, name="userId")

    user = relationship("User", back_populates="charts")
