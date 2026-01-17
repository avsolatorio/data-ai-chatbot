import base64
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, LargeBinary, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.db.types import UUID


class File(Base):
    __tablename__ = "File"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False, name="contentType")
    data = Column(
        LargeBinary, nullable=False
    )  # Binary file data (works for both PostgreSQL and MSSQL)
    size = Column(Integer, nullable=False)  # File size in bytes
    user_id = Column(UUID(), ForeignKey("User.id"), nullable=True, name="userId")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, name="createdAt")

    # Relationships
    user = relationship("User", back_populates="files")

    def to_base64_data_url(self) -> str:
        """
        Convert file data to base64-encoded data URL.
        Returns: data:{content_type};base64,{base64_string}
        """
        file_data_bytes = bytes(self.data)
        base64_string = base64.b64encode(file_data_bytes).decode("utf-8")
        return f"data:{self.content_type};base64,{base64_string}"
