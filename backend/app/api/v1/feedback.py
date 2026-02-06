"""App-level feedback (rating + free text)."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps import get_optional_user

logger = logging.getLogger(__name__)

router = APIRouter()


class AppFeedbackRequest(BaseModel):
    """Rating (1-5 stars) and optional feedback text."""

    rating: Optional[int] = Field(None, ge=1, le=5, description="1-5 star rating")
    feedback: Optional[str] = Field(None, max_length=5000)


@router.post("")
async def submit_app_feedback(
    body: AppFeedbackRequest,
    current_user: Optional[dict] = Depends(get_optional_user),
) -> dict:
    """
    Submit app feedback: optional 1-5 star rating and optional text.
    Does not require authentication.
    """
    user_id = current_user.get("id") if current_user else None
    logger.info(
        "App feedback: rating=%s, feedback_len=%s, user_id=%s",
        body.rating,
        len(body.feedback or ""),
        user_id,
    )
    if body.feedback and body.feedback.strip():
        logger.info("App feedback text (first 200 chars): %s", (body.feedback or "")[:200])
    return {"ok": True}
