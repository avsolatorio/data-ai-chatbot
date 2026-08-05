import uuid

from sqlalchemy import Boolean, Column, DateTime, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "User"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(64), nullable=False, unique=True)
    password = Column(String(64), nullable=True)
    type = Column(String(10), nullable=False, default="regular")  # "guest" or "regular"
    name = Column(String(255), nullable=True)  # Display name (e.g. from MSAL/Azure AD)
    azure_oid = Column(
        String(64), nullable=True, unique=True
    )  # Azure AD object id (oid claim) for MSAL users
    password_changed_at = Column(
        DateTime, nullable=True
    )  # Timestamp when password was last changed (for session invalidation)
    disabled = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )  # Admin moderation: disables login for abusive users

    # Relationships
    chats = relationship("Chat", back_populates="user")
    charts = relationship("Chart", back_populates="user")
    documents = relationship("Document", back_populates="user")
    suggestions = relationship("Suggestion", back_populates="user")
    files = relationship("File", back_populates="user")
