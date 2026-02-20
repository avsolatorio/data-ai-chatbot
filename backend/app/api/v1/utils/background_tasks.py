"""Background task helpers for chat streaming."""

import logging
from typing import Any, Dict, List
from uuid import UUID

from fastapi import BackgroundTasks

from app.ai.observability.token_usage import DataUsageData
from app.core.database import AsyncSessionLocal
from app.db.queries.chat_queries import (
    save_messages,
    update_chat_last_context_by_id,
)

logger = logging.getLogger(__name__)


def create_save_messages_task(
    background_tasks: BackgroundTasks,
    chat_id: UUID,
    messages: List[Dict[str, Any]],
) -> None:
    """Schedule a background task to save assistant messages."""
    if not messages:
        logger.warning("No assistant messages to save for chat %s", chat_id)
        return

    logger.info(
        "Scheduling save of %d assistant message(s) for chat %s",
        len(messages),
        chat_id,
    )

    # Create a copy of the list for the background task
    messages_copy = messages.copy()

    async def save_messages_task():
        try:
            async with AsyncSessionLocal() as session:
                await save_messages(session, messages_copy)
        except Exception as e:
            logger.exception(
                "Background save_messages failed for chat %s: %s",
                chat_id,
                e,
            )

    background_tasks.add_task(save_messages_task)


def create_update_context_task(
    background_tasks: BackgroundTasks,
    chat_id: UUID,
    usage: Dict[str, Any] | DataUsageData,
    message_id: str | None = None,
) -> None:
    """Schedule a background task to update chat context with usage.
    If message_id is set, usage is stored per-message so each response has its own usage.
    """
    if not usage:
        return

    if isinstance(usage, DataUsageData):
        usage = usage.model_dump()

    async def update_context_task():
        async with AsyncSessionLocal() as session:
            await update_chat_last_context_by_id(session, chat_id, usage, message_id=message_id)

    background_tasks.add_task(update_context_task)
