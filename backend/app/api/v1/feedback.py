"""App-level feedback (rating + free text)."""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_optional_user
from app.core.database import get_db
from app.models.app_feedback import AppFeedback

logger = logging.getLogger(__name__)

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
