"""Pydantic models for chat streaming API."""

from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel

from app.config import ModelType


class MessagePart(BaseModel):
    """A part of a chat message (text or file)."""

    type: str  # "text" or "file"
    text: Optional[str] = None
    mediaType: Optional[str] = None
    name: Optional[str] = None
    url: Optional[str] = None


class ChatMessage(BaseModel):
    """A chat message with parts."""

    id: UUID
    role: str  # "user" or "assistant"
    parts: List[MessagePart]


# ruff: noqa: N815
class StreamRequest(BaseModel):
    """Request model for chat streaming endpoint."""

    id: UUID
    message: ChatMessage
    selectedChatModel: ModelType  # ModelType enum: CHAT_MODEL or CHAT_MODEL_REASONING
    selectedVisibilityType: str  # "public" or "private"
    existingMessages: List[Dict[str, Any]] = []
    streamId: Optional[UUID] = None  # Optional stream ID for resumable streams


# --- Request models for new endpoints ---


class DeleteTrailingMessagesRequest(BaseModel):
    """Request model for deleting trailing messages (edit/resend)."""

    id: str


class UpdateChatVisibilityRequest(BaseModel):
    """Request model for updating chat visibility."""

    chatId: str
    visibility: str


# --- Response models for new endpoints ---


class DeleteTrailingMessagesResponse(BaseModel):
    """Response model for delete trailing messages endpoint."""

    deletedCount: int


class UpdateChatVisibilityResponse(BaseModel):
    """Response model for update chat visibility endpoint."""

    id: str
    visibility: str


class SuggestionResponse(BaseModel):
    """Response model for a single suggestion."""

    id: str
    documentId: str
    originalText: str
    suggestedText: str
    description: Optional[str] = None
    isResolved: bool
    userId: str
    createdAt: Optional[str] = None
