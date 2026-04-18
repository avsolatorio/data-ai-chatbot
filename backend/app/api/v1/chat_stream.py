"""Resumable chat stream at /api/v1/chat/stream — LangGraph + SSE (aligned with main /api/chat)."""

import asyncio
import logging
import traceback
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.observability.token_usage import coerce_graph_final_usage_to_data_usage
from app.api.deps import get_current_user
from app.api.v1.schemas.chat_schemas import ChatMessage, StreamRequest
from app.api.v1.utils.background_tasks import (
    create_save_messages_task,
    create_update_context_task,
)
from app.api.v1.utils.graph_stream import (
    build_assistant_message_from_graph,
    emit_standard_chat_prelude,
    store_and_yield_stream_chunk,
    stream_chat_graph_sse,
)
from app.api.v1.utils.tool_setup import prepare_tools
from app.config import IntentType
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import create_stream_id, get_chat_by_id
from app.ready import ensure_chat_ready_or_raise
from app.utils.message_converter import convert_messages_to_openai_format
from app.utils.resumable_stream import mark_stream_complete
from app.utils.stream import patch_response_with_headers
from app.utils.user_id import get_user_id_uuid

logger = logging.getLogger(__name__)

router = APIRouter()


def _query_text_from_stream_message(message: ChatMessage) -> str:
    return "".join(part.text or "" for part in message.parts if part.type == "text" and part.text)


@router.post("/stream")
async def stream_chat(
    request: StreamRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream AI response for a chat (v1). Uses the same LangGraph pipeline as /api/chat
    with intent forced to DIRECT (legacy plain-chat behavior, no research branch).
    """
    logger.info("=== STREAM CHAT ENDPOINT CALLED (v1 LangGraph) ===")
    logger.info("Chat ID: %s", request.id)
    try:
        await ensure_chat_ready_or_raise()

        user_id = get_user_id_uuid(current_user["id"])

        existing_chat = await get_chat_by_id(db, request.id)
        if existing_chat is not None and existing_chat.userId != user_id:
            logger.warning(
                "Stream access denied: chat_id=%s belongs to user=%s, current_user=%s",
                request.id,
                existing_chat.userId,
                user_id,
            )
            raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

        all_messages = []
        for msg in request.existingMessages:
            all_messages.append(
                {
                    "id": str(msg["id"]),
                    "role": msg["role"],
                    "parts": msg["parts"],
                    "attachments": msg["attachments"] or [],
                    "createdAt": msg["createdAt"],
                }
            )

        all_messages.append(
            {
                "id": str(request.message.id),
                "role": request.message.role,
                "parts": [part.dict() for part in request.message.parts],
                "attachments": [],
                "createdAt": datetime.utcnow().isoformat(),
            }
        )

        openai_messages = await convert_messages_to_openai_format(all_messages, db)
        query_text = _query_text_from_stream_message(request.message)

        tool_set = await prepare_tools(user_id, db)

        stream_id = request.streamId
        if not stream_id:
            stream_id = uuid4()
            await create_stream_id(db, stream_id, request.id)

        stream_interrupted = False

        async def stream_generator():
            nonlocal stream_interrupted
            state = {"sequence": 0}
            part_message_id = f"msg-{uuid4().hex}"
            message_id = str(uuid4())
            graph_out: dict = {}

            async def _store_and_yield_local(sse_bytes: bytes) -> bytes:
                return await store_and_yield_stream_chunk(stream_id, state, sse_bytes)

            try:
                async for sse_bytes in emit_standard_chat_prelude(
                    stream_id=stream_id,
                    state=state,
                    part_message_id=part_message_id,
                ):
                    yield sse_bytes

                async for sse_bytes in stream_chat_graph_sse(
                    graph_out=graph_out,
                    openai_messages=openai_messages,
                    model_type=request.selectedChatModel.value,
                    query_text=query_text,
                    part_message_id=part_message_id,
                    tool_set=tool_set,
                    assistant_row_id=message_id,
                    forced_intent=IntentType.DIRECT.value,
                ):
                    yield await _store_and_yield_local(sse_bytes)
                    await asyncio.sleep(0)
            except GeneratorExit:
                stream_interrupted = True
                logger.info(
                    "Stream interrupted (client disconnect) stream_id=%s chat_id=%s",
                    stream_id,
                    request.id,
                )
                raise
            finally:
                if not stream_interrupted:
                    asyncio.create_task(mark_stream_complete(stream_id))
                    if not graph_out.get("stream_failed"):
                        assistant_message = build_assistant_message_from_graph(
                            message_id, graph_out, chat_id=request.id
                        )
                        create_save_messages_task(
                            background_tasks,
                            request.id,
                            [assistant_message],
                        )
                    # Always persist token usage — even partial usage from a failed stream is
                    # valuable for cost tracking and debugging.
                    final_usage_raw = graph_out.get("final_usage") or {}
                    if final_usage_raw:
                        by_node = None
                        if isinstance(final_usage_raw, dict):
                            final_usage_raw = dict(final_usage_raw)  # copy before mutating
                            by_node = final_usage_raw.pop("byNode", None)
                        usage_data = coerce_graph_final_usage_to_data_usage(
                            final_usage_raw,
                            model=request.selectedChatModel.value,
                        )
                        persisted = usage_data.model_dump()
                        if by_node:
                            persisted["byNode"] = by_node
                        create_update_context_task(
                            background_tasks,
                            request.id,
                            persisted,
                            message_id=message_id,
                        )

        response = StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
        )
        return patch_response_with_headers(response)

    except Exception as e:
        stack_trace = traceback.format_exc()
        if isinstance(e, ChatSDKError):
            raise
        raise ChatSDKError(
            "offline:chat",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in stream_chat: {e}\n{stack_trace}",
        ) from e
