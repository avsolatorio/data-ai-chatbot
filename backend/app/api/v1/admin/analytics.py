"""Admin analytics endpoints (Phase 1)."""

from collections import Counter
from datetime import date as date_type
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.params import Query as QueryParam
from sqlalchemy import Date, and_, case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.database import get_db
from app.models import AppFeedback, Chat, Message, User, Vote

MAX_DATE_RANGE_DAYS = 365

router = APIRouter()


def _scalar_int(value) -> int:
    """Coerce a scalar aggregate to int (handles None for empty results)."""
    return int(value) if value is not None else 0


def _resolve_date_range(
    from_date: Optional[date_type] = None,
    to_date: Optional[date_type] = None,
) -> tuple[date_type, date_type, date_type, date_type]:
    """
    Resolve from/to query params with defaults and clamping.

    Returns (effective_from, effective_to, now_7d_ago, now_30d_ago) where
    effective_from/to are datetime objects for SQL filtering, and the 7d/30d
    windows are always relative to now.
    """
    # Unwrap Query objects when called directly (e.g. in tests)
    if isinstance(from_date, QueryParam):
        from_date = from_date.default
    if isinstance(to_date, QueryParam):
        to_date = to_date.default

    today = datetime.utcnow().date()
    to_dt = to_date if to_date else today
    from_dt = from_date if from_date else today - timedelta(days=30)

    # Validate: from must be on or before to
    if from_dt > to_dt:
        raise HTTPException(status_code=400, detail="from must be <= to")

    # Clamp: to_dt cannot be after today
    if to_dt > today:
        to_dt = today

    # Clamp: range cannot exceed MAX_DATE_RANGE_DAYS
    earliest = to_dt - timedelta(days=MAX_DATE_RANGE_DAYS)
    if from_dt < earliest:
        from_dt = earliest

    # Convert to datetime for SQL comparisons (end of day for to_dt)
    now = datetime.utcnow()
    effective_from = datetime.combine(from_dt, datetime.min.time())
    effective_to = datetime.combine(to_dt, datetime.max.time())
    now_7d = now - timedelta(days=7)
    now_30d = now - timedelta(days=30)

    return effective_from, effective_to, now_7d, now_30d


def _extract_usage_from_last_context(lc: dict) -> Optional[dict]:
    """
    Extract usage data from a lastContext dict.

    Handles both legacy shape (plain usage with modelId) and current shape
    ({"latest": usage, "byMessageId": {...}}).
    """
    if not isinstance(lc, dict):
        return None
    # Current shape: {"latest": {...}, "byMessageId": {...}}
    if "latest" in lc and isinstance(lc["latest"], dict):
        return lc["latest"]
    # Legacy shape: any dict with modelId (may or may not have totalTokens)
    if "modelId" in lc:
        return lc
    return None


@router.get("/users")
async def get_user_analytics(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    from_date: Optional[date_type] = Query(None, alias="from"),
    to_date: Optional[date_type] = Query(None, alias="to"),
):
    """Aggregate user statistics for the admin dashboard."""
    effective_from, effective_to, cutoff_7d, cutoff_30d = _resolve_date_range(from_date, to_date)

    total = _scalar_int((await db.execute(select(func.count(User.id)))).scalar_one())
    registered = _scalar_int(
        (await db.execute(select(func.count(User.id)).where(User.type == "regular"))).scalar_one()
    )
    guest = _scalar_int(
        (await db.execute(select(func.count(User.id)).where(User.type == "guest"))).scalar_one()
    )

    # User has no created_at column, so use Chat.createdAt as a proxy:
    # a "new" user is one who created their first chat in the window.
    new_7d = _scalar_int(
        (
            await db.execute(
                select(func.count(func.distinct(Chat.userId))).where(Chat.createdAt >= cutoff_7d)
            )
        ).scalar_one()
    )
    new_30d = _scalar_int(
        (
            await db.execute(
                select(func.count(func.distinct(Chat.userId))).where(Chat.createdAt >= cutoff_30d)
            )
        ).scalar_one()
    )

    active_7d = _scalar_int(
        (
            await db.execute(
                select(func.count(func.distinct(Chat.userId))).where(Chat.createdAt >= cutoff_7d)
            )
        ).scalar_one()
    )
    active_30d = _scalar_int(
        (
            await db.execute(
                select(func.count(func.distinct(Chat.userId))).where(Chat.createdAt >= cutoff_30d)
            )
        ).scalar_one()
    )

    return {
        "totalUsers": total,
        "registeredUsers": registered,
        "guestUsers": guest,
        "newUsers7d": new_7d,
        "newUsers30d": new_30d,
        "activeUsers7d": active_7d,
        "activeUsers30d": active_30d,
    }


def _extract_model_counts(last_contexts) -> list[dict]:
    """
    Count chats per model from Chat.lastContext usage payloads.

    Chat has no model column and Message.parts carries no model info; the model
    is persisted in lastContext as usage.modelId.
    """
    counts: Counter = Counter()
    for (lc,) in last_contexts:
        usage = _extract_usage_from_last_context(lc)
        if usage and usage.get("modelId"):
            counts[usage["modelId"]] += 1
    return [{"model": m, "count": c} for m, c in counts.most_common()]


@router.get("/chats")
async def get_chat_analytics(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    from_date: Optional[date_type] = Query(None, alias="from"),
    to_date: Optional[date_type] = Query(None, alias="to"),
):
    """Aggregate chat and message statistics for the admin dashboard."""
    effective_from, effective_to, cutoff_7d, cutoff_30d = _resolve_date_range(from_date, to_date)

    total_chats = _scalar_int((await db.execute(select(func.count(Chat.id)))).scalar_one())
    # Soft-deleted messages are excluded from totals.
    total_messages = _scalar_int(
        (
            await db.execute(select(func.count(Message.id)).where(Message.deletedAt.is_(None)))
        ).scalar_one()
    )
    chats_7d = _scalar_int(
        (
            await db.execute(select(func.count(Chat.id)).where(Chat.createdAt >= cutoff_7d))
        ).scalar_one()
    )
    chats_30d = _scalar_int(
        (
            await db.execute(select(func.count(Chat.id)).where(Chat.createdAt >= cutoff_30d))
        ).scalar_one()
    )

    avg_per_chat = round(total_messages / total_chats, 2) if total_chats else 0.0

    last_contexts = (await db.execute(select(Chat.lastContext))).all()
    top_models = _extract_model_counts(last_contexts)

    return {
        "totalChats": total_chats,
        "totalMessages": total_messages,
        "chats7d": chats_7d,
        "chats30d": chats_30d,
        "avgMessagesPerChat": avg_per_chat,
        "topModels": top_models,
    }


@router.get("/feedback")
async def get_feedback_analytics(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    from_date: Optional[date_type] = Query(None, alias="from"),
    to_date: Optional[date_type] = Query(None, alias="to"),
):
    """Aggregate feedback and vote statistics for the admin dashboard."""
    effective_from, effective_to, cutoff_7d, cutoff_30d = _resolve_date_range(from_date, to_date)

    avg_rating = (await db.execute(select(func.avg(AppFeedback.rating)))).scalar_one()
    avg_rating = round(avg_rating, 1) if avg_rating is not None else 0

    dist_rows = (
        await db.execute(
            select(AppFeedback.rating, func.count(AppFeedback.id))
            .group_by(AppFeedback.rating)
            .order_by(AppFeedback.rating)
        )
    ).all()
    rating_distribution = {str(r): 0 for r in range(1, 6)}
    for rating, count in dist_rows:
        if 1 <= rating <= 5:
            rating_distribution[str(rating)] = count

    total_feedback = _scalar_int(
        (await db.execute(select(func.count(AppFeedback.id)))).scalar_one()
    )
    feedback_7d = _scalar_int(
        (
            await db.execute(
                select(func.count(AppFeedback.id)).where(AppFeedback.created_at >= cutoff_7d)
            )
        ).scalar_one()
    )

    upvotes, total_votes = (
        await db.execute(
            select(
                func.sum(case((Vote.isUpvoted.is_(True), 1), else_=0)),
                func.count(Vote.isUpvoted),
            )
        )
    ).one()
    upvote_ratio = round(upvotes / total_votes, 2) if total_votes else 0.0

    day = cast(func.date_trunc("day", AppFeedback.created_at), Date)
    trend_rows = (
        await db.execute(
            select(day.label("date"), func.avg(AppFeedback.rating), func.count(AppFeedback.id))
            .where(AppFeedback.created_at >= cutoff_30d)
            .group_by(day)
            .order_by(day)
        )
    ).all()
    feedback_trend = [
        {
            "date": r.date.isoformat() if isinstance(r.date, date_type) else str(r.date),
            "avgRating": round(r[1] or 0, 2),
            "count": r[2],
        }
        for r in trend_rows
    ]

    return {
        "avgRating": avg_rating,
        "ratingDistribution": rating_distribution,
        "totalFeedback": total_feedback,
        "feedback7d": feedback_7d,
        "upvoteRatio": upvote_ratio,
        "feedbackTrend": feedback_trend,
    }


@router.get("/tokens")
async def get_token_analytics(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    from_date: Optional[date_type] = Query(None, alias="from"),
    to_date: Optional[date_type] = Query(None, alias="to"),
):
    """
    Aggregate token usage from Chat.lastContext across the requested date range.

    Reads usage payloads persisted in lastContext (both legacy and current shapes),
    sums prompt/completion/total tokens overall and per model, and estimates cost.
    """
    effective_from, effective_to, cutoff_7d, cutoff_30d = _resolve_date_range(from_date, to_date)

    # Fetch all chats with non-null lastContext in the date range.
    rows = (
        await db.execute(
            select(Chat.lastContext, Chat.createdAt).where(
                and_(
                    Chat.lastContext.isnot(None),
                    Chat.createdAt >= effective_from,
                    Chat.createdAt <= effective_to,
                )
            )
        )
    ).all()

    total_tokens = 0
    prompt_tokens = 0
    completion_tokens = 0
    tokens_7d = 0
    tokens_30d = 0
    cost_7d = 0.0
    cost_30d = 0.0
    model_tokens: dict[str, int] = {}

    for last_ctx, created_at in rows:
        usage = _extract_usage_from_last_context(last_ctx)
        if not usage:
            continue

        tt = _scalar_int(usage.get("totalTokens", 0))
        pt = _scalar_int(usage.get("inputTokens", tt))
        ct = _scalar_int(usage.get("outputTokens", 0))

        total_tokens += tt
        prompt_tokens += pt
        completion_tokens += ct

        model_id = usage.get("modelId", "unknown")
        model_tokens[model_id] = model_tokens.get(model_id, 0) + tt

        # Accumulate 7d and 30d windows (always relative to now)
        if created_at >= cutoff_7d:
            tokens_7d += tt
            cost_7d += _extract_total_cost(usage)

        if created_at >= cutoff_30d:
            tokens_30d += tt
            cost_30d += _extract_total_cost(usage)

    return {
        "totalTokens": total_tokens,
        "promptTokens": prompt_tokens,
        "completionTokens": completion_tokens,
        "tokensByModel": model_tokens,
        "tokensLast7d": tokens_7d,
        "tokensLast30d": tokens_30d,
        "costEstimate7d": round(cost_7d, 6),
        "costEstimate30d": round(cost_30d, 6),
    }


def _extract_total_cost(usage: dict) -> float:
    """Extract totalUSD cost from a usage dict. Returns 0.0 if not present."""
    if not isinstance(usage, dict):
        return 0.0
    cost = usage.get("costUSD")
    if isinstance(cost, dict):
        return float(cost.get("totalUSD", 0.0))
    if isinstance(cost, (int, float)):
        return float(cost)
    return 0.0
