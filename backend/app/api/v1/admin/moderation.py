"""Admin moderation endpoints (Phase 2).

User and chat management for the admin dashboard: list users/chats with
counts, disable/enable user accounts, and soft-delete chats.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import invalidate_user_cache, require_admin
from app.core.database import get_db
from app.db.queries.chat_queries import soft_delete_chat_by_id
from app.db.queries.user_queries import get_user_by_id
from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User

router = APIRouter()


@router.get("/users")
async def list_users(
    q: str = Query("", description="Search by email substring"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List users with their chat counts, optionally filtered by email search."""
    chat_count_sq = (
        select(Chat.userId.label("user_id"), func.count(Chat.id).label("chat_count"))
        .where(Chat.deletedAt.is_(None))
        .group_by(Chat.userId)
        .subquery()
    )
    earliest_chat_sq = (
        select(Chat.userId.label("user_id"), func.min(Chat.createdAt).label("created_at"))
        .where(Chat.deletedAt.is_(None))
        .group_by(Chat.userId)
        .subquery()
    )

    conditions = []
    if q:
        q_clean = q.replace("\x00", "")
        if q_clean:
            conditions.append(User.email.ilike(f"%{q_clean}%"))
        else:
            # After stripping null bytes, q is empty — return empty result
            return {"users": [], "total": 0}

    offset = (page - 1) * pageSize

    stmt = (
        select(User, chat_count_sq.c.chat_count, earliest_chat_sq.c.created_at)
        .outerjoin(chat_count_sq, chat_count_sq.c.user_id == User.id)
        .outerjoin(earliest_chat_sq, earliest_chat_sq.c.user_id == User.id)
        .where(*conditions)
        .order_by(User.id.desc())
        .offset(offset)
        .limit(pageSize)
    )
    result = await db.execute(stmt)
    rows = result.all()

    total_stmt = select(func.count(User.id)).where(*conditions)
    total = (await db.execute(total_stmt)).scalar() or 0

    users = [
        {
            "id": str(user.id),
            "email": user.email,
            "type": user.type,
            "name": user.name,
            "chatCount": chat_count or 0,
            "createdAt": created_at,
            "disabled": user.disabled,
        }
        for user, chat_count, created_at in rows
    ]

    return {"users": users, "total": total}


@router.post("/users/{user_id}/disable")
async def toggle_user_disabled(
    user_id: UUID,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Toggle a user's disabled state. Disabled users cannot authenticate."""
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.disabled = not user.disabled
    await db.commit()
    # Drop the cached auth entry so the new state applies immediately
    await invalidate_user_cache(str(user.id))

    return {"ok": True, "disabled": user.disabled}


@router.get("/chats")
async def list_chats(
    q: str = Query("", description="Search by title substring"),
    userId: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List non-deleted chats with owner email and message counts."""
    msg_count_sq = (
        select(Message.chatId.label("chat_id"), func.count(Message.id).label("msg_count"))
        .where(Message.deletedAt.is_(None))
        .group_by(Message.chatId)
        .subquery()
    )

    conditions = [Chat.deletedAt.is_(None)]
    if q:
        q_clean = q.replace("\x00", "")
        if q_clean:
            conditions.append(Chat.title.ilike(f"%{q_clean}%"))
        else:
            return {"chats": [], "total": 0}
    if userId is not None:
        conditions.append(Chat.userId == userId)

    offset = (page - 1) * pageSize

    stmt = (
        select(Chat, User.email, msg_count_sq.c.msg_count)
        .join(User, User.id == Chat.userId)
        .outerjoin(msg_count_sq, msg_count_sq.c.chat_id == Chat.id)
        .where(*conditions)
        .order_by(Chat.createdAt.desc())
        .offset(offset)
        .limit(pageSize)
    )
    result = await db.execute(stmt)
    rows = result.all()

    total_stmt = select(func.count(Chat.id)).where(*conditions)
    total = (await db.execute(total_stmt)).scalar() or 0

    chats = [
        {
            "id": str(chat.id),
            "title": chat.title,
            "userId": str(chat.userId),
            "userEmail": user_email,
            "messageCount": msg_count or 0,
            "createdAt": chat.createdAt,
            "updatedAt": chat.updatedAt,
        }
        for chat, user_email, msg_count in rows
    ]

    return {"chats": chats, "total": total}


@router.delete("/chats/{chat_id}")
async def delete_chat(
    chat_id: UUID,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a chat and its associated messages. Hard-deletes votes and streams."""
    deleted_chat = await soft_delete_chat_by_id(db, chat_id)
    if not deleted_chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
    return {"ok": True}
