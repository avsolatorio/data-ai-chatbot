"""App-level feedback (rating + free text) and response-level votes/feedback review."""

import logging
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import nulls_last

from app.api.deps import get_optional_user, require_feedback_reviewer
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import get_chat_by_id, get_messages_by_chat_id
from app.models.app_feedback import AppFeedback
from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User
from app.models.vote import Vote

logger = logging.getLogger(__name__)

MESSAGE_PREVIEW_MAX_LEN = 280


def _user_display_name(name: Optional[str], email: Optional[str]) -> Optional[str]:
    """Display label for review UI: name, else email, else None (anonymous)."""
    if name and name.strip():
        return name.strip()
    if email and email.strip():
        return email.strip()
    return None


def _message_preview_from_parts(parts: Any) -> str:
    """Extract first text content from message parts (JSON list of {type, text?}) and truncate."""
    if not parts or not isinstance(parts, list):
        return ""
    text_parts = []
    for p in parts:
        if isinstance(p, dict) and p.get("type") == "text":
            t = p.get("text")
            if isinstance(t, str) and t.strip():
                text_parts.append(t.strip())
    combined = " ".join(text_parts)
    if len(combined) <= MESSAGE_PREVIEW_MAX_LEN:
        return combined
    return combined[: MESSAGE_PREVIEW_MAX_LEN - 3].rstrip() + "..."


router = APIRouter()


class AppFeedbackRequest(BaseModel):
    """Rating (1-5 stars) and optional feedback text."""

    rating: int = Field(..., ge=1, le=5, description="1-5 star rating")
    feedback: Optional[str] = Field(None, max_length=5000)


@router.post("")
async def submit_app_feedback(
    body: AppFeedbackRequest,
    current_user: Optional[dict] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Submit app feedback: required 1-5 star rating and optional text.
    Does not require authentication. Persisted to App_feedback table.
    """
    user_id: Optional[UUID] = None
    if current_user and current_user.get("id"):
        user_id = (
            current_user["id"]
            if isinstance(current_user["id"], UUID)
            else UUID(str(current_user["id"]))
        )

    record = AppFeedback(
        rating=body.rating,
        feedback=(body.feedback.strip() or None) if body.feedback else None,
        user_id=user_id,
    )
    db.add(record)
    await db.commit()

    logger.info(
        "App feedback: id=%s, rating=%s, feedback_len=%s, user_id=%s",
        record.id,
        body.rating,
        len(body.feedback or ""),
        user_id,
    )
    return {"ok": True}


class FeedbackReviewItem(BaseModel):
    """Single feedback row for review list."""

    id: UUID
    rating: int
    feedback: Optional[str]
    user_id: Optional[UUID]
    user_name: Optional[str] = None
    created_at: str  # ISO format


class FeedbackReviewResponse(BaseModel):
    """Paginated list of feedback for reviewers."""

    items: list[FeedbackReviewItem]
    total: int
    limit: int
    offset: int


@router.get("/review", response_model=FeedbackReviewResponse)
async def list_feedback_for_review(
    _reviewer: dict = Depends(require_feedback_reviewer),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    rating_min: Optional[int] = Query(None, ge=1, le=5),
    rating_max: Optional[int] = Query(None, ge=1, le=5),
):
    """
    List app feedback (paginated). Only allowed for users in FEEDBACK_REVIEWER_EMAILS.
    """
    # Count total
    count_q = select(func.count()).select_from(AppFeedback)
    if rating_min is not None:
        count_q = count_q.where(AppFeedback.rating >= rating_min)
    if rating_max is not None:
        count_q = count_q.where(AppFeedback.rating <= rating_max)
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # Fetch page (left join User for display name on review UI)
    q = (
        select(AppFeedback, User.name, User.email)
        .outerjoin(User, AppFeedback.user_id == User.id)
        .order_by(desc(AppFeedback.created_at))
        .limit(limit)
        .offset(offset)
    )
    if rating_min is not None:
        q = q.where(AppFeedback.rating >= rating_min)
    if rating_max is not None:
        q = q.where(AppFeedback.rating <= rating_max)
    result = await db.execute(q)
    rows = result.all()

    items = [
        FeedbackReviewItem(
            id=feedback.id,
            rating=feedback.rating,
            feedback=feedback.feedback,
            user_id=feedback.user_id,
            user_name=_user_display_name(user_name, user_email),
            created_at=feedback.created_at.isoformat() if feedback.created_at else "",
        )
        for feedback, user_name, user_email in rows
    ]
    return FeedbackReviewResponse(items=items, total=total, limit=limit, offset=offset)


# --- Response-level (vote/comment) review ---


class VoteReviewItem(BaseModel):
    """Single response vote/feedback row for reviewers."""

    chat_id: UUID
    message_id: UUID
    chat_title: str
    message_preview: str
    user_name: Optional[str] = None
    is_upvoted: Optional[bool]
    feedback: Optional[str]
    updated_at: str
    feedback_updated_at: Optional[str]


class VoteReviewResponse(BaseModel):
    """Paginated list of response votes/feedback for reviewers."""

    items: list[VoteReviewItem]
    total: int
    limit: int
    offset: int


@router.get("/review/votes", response_model=VoteReviewResponse)
async def list_votes_for_review(
    _reviewer: dict = Depends(require_feedback_reviewer),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    has_feedback: Optional[bool] = Query(None, description="Only entries with comment text"),
):
    """
    List response-level votes and comments (paginated). Only for users in FEEDBACK_REVIEWER_EMAILS.
    Includes chat title and message preview for context.
    """
    # Votes that have either a vote (up/down) or feedback text
    base_filter = or_(Vote.feedback.isnot(None), Vote.isUpvoted.isnot(None))
    if has_feedback is True:
        base_filter = Vote.feedback.isnot(None)
    elif has_feedback is False:
        base_filter = Vote.feedback.is_(None) & Vote.isUpvoted.isnot(None)

    count_q = select(func.count()).select_from(Vote).where(base_filter)
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # Join Vote -> Message, Vote -> Chat; order by most recent (feedbackUpdatedAt or updatedAt)
    q = (
        select(Vote, Chat.title, Message.parts, User.name, User.email)
        .join(Chat, Vote.chatId == Chat.id)
        .join(User, Chat.userId == User.id)
        .join(Message, (Vote.messageId == Message.id) & (Vote.chatId == Message.chatId))
        .where(base_filter)
        .order_by(
            nulls_last(desc(Vote.feedbackUpdatedAt)),
            desc(Vote.updatedAt),
        )
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(q)
    rows = result.all()

    items = []
    for vote, chat_title, parts, user_name, user_email in rows:
        updated_at = vote.feedbackUpdatedAt or vote.updatedAt or vote.createdAt
        items.append(
            VoteReviewItem(
                chat_id=vote.chatId,
                message_id=vote.messageId,
                chat_title=chat_title or "",
                message_preview=_message_preview_from_parts(parts),
                user_name=_user_display_name(user_name, user_email),
                is_upvoted=vote.isUpvoted,
                feedback=vote.feedback,
                updated_at=updated_at.isoformat() if updated_at else "",
                feedback_updated_at=(
                    vote.feedbackUpdatedAt.isoformat() if vote.feedbackUpdatedAt else None
                ),
            )
        )
    return VoteReviewResponse(items=items, total=total, limit=limit, offset=offset)


# --- Chat preview for reviewers (side panel) ---

# ruff: noqa: N815


class ChatPreviewMessage(BaseModel):
    """Message in chat preview (same shape as frontend expects)."""

    id: str
    chatId: str
    role: str
    parts: list[Any]
    attachments: list[Any]
    createdAt: str


class ChatPreviewResponse(BaseModel):
    """Chat title and messages for the review side panel."""

    title: str
    messages: list[ChatPreviewMessage]


@router.get("/review/preview", response_model=ChatPreviewResponse)
async def get_chat_preview_for_review(
    chat_id: UUID = Query(..., description="Chat to preview"),
    _reviewer: dict = Depends(require_feedback_reviewer),
    db: AsyncSession = Depends(get_db),
):
    """
    Get chat title and all messages for a chat. For reviewers only.
    Used by the feedback review page to show the conversation in a side panel.
    """
    chat = await get_chat_by_id(db, chat_id)
    if not chat:
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)
    messages = await get_messages_by_chat_id(db, chat_id)
    return ChatPreviewResponse(
        title=chat.title or "Untitled chat",
        messages=[
            ChatPreviewMessage(
                id=str(m.id),
                chatId=str(m.chatId),
                role=m.role,
                parts=m.parts or [],
                attachments=m.attachments or [],
                createdAt=m.createdAt.isoformat() if m.createdAt else "",
            )
            for m in messages
        ],
    )
