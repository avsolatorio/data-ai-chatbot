import asyncio
import json
import logging
from datetime import datetime
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import get_ai_client, get_model_name
from app.ai.observability.token_usage import coerce_graph_final_usage_to_data_usage
from app.api.deps import get_current_user, get_optional_user
from app.api.v1.schemas.chat_schemas import (
    DeleteMessagesRequest,
    DeleteMessagesResponse,
    SuggestionResponse,
    UpdateChatVisibilityRequest,
    UpdateChatVisibilityResponse,
)
from app.api.v1.utils.background_tasks import (
    create_save_messages_task,
    create_update_context_task,
)
from app.api.v1.utils.graph_stream import (
    build_assistant_message_from_graph as _build_assistant_message_from_graph,
)
from app.api.v1.utils.graph_stream import (
    emit_standard_chat_prelude,
    stream_chat_graph_sse,
)
from app.api.v1.utils.graph_stream import (
    store_and_yield_stream_chunk as _store_and_yield,
)
from app.api.v1.utils.tool_setup import prepare_tools
from app.config import ModelType, get_settings
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import (
    create_stream_id,
    delete_chat_by_id,
    get_chat_by_id,
    get_latest_messages_by_chat_id,
    get_message_by_id,
    get_message_count_by_user_id,
    get_messages_by_chat_id,
    save_chat,
    save_messages,
    soft_delete_message_by_id,
    soft_delete_messages_by_chat_id_after_timestamp,
    update_chat_visibility_by_id,
)
from app.db.queries.suggestion_queries import get_suggestions_by_document_id
from app.ready import ensure_chat_ready_or_raise
from app.utils.chat_visibility import effective_visibility
from app.utils.message_converter import convert_messages_to_openai_format
from app.utils.resumable_stream import mark_stream_complete
from app.utils.stream import patch_response_with_headers
from app.utils.user_id import get_user_id_uuid, user_ids_match

logger = logging.getLogger(__name__)


router = APIRouter()

# Rate limiting configuration
ENTITLEMENTS = {
    "guest": {"maxMessagesPerDay": 55},
    "regular": {"maxMessagesPerDay": 100},
}

# Title generation prompt (ported from lib/ai/prompts.ts)
TITLE_PROMPT = """
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons
"""


# ruff: noqa: N815
class MessagePart(BaseModel):
    type: str  # "text" or "file"
    text: str | None = None
    mediaType: str | None = None
    name: str | None = None
    url: str | None = None


class ChatMessage(BaseModel):
    id: UUID
    role: str  # "user"
    parts: List[MessagePart]


class ChatRequest(BaseModel):
    id: UUID
    message: ChatMessage
    selectedChatModel: ModelType  # ModelType enum: CHAT_MODEL or CHAT_MODEL_REASONING
    selectedVisibilityType: str  # "public" or "private"


def get_text_from_message(message: ChatMessage) -> str:
    """
    Extract text content from a chat message.
    Ported from lib/utils.ts getTextFromMessage.
    """
    return "".join(part.text for part in message.parts if part.type == "text" and part.text)


async def generate_title_from_user_message(message: ChatMessage) -> str:
    """
    Generate a chat title from the user's first message.
    Ported from app/(chat)/actions.ts generateTitleFromUserMessage.
    """
    client = get_ai_client()
    model = get_model_name(ModelType.TITLE_MODEL)
    text = get_text_from_message(message)

    # Generate title using OpenAI (non-streaming)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": TITLE_PROMPT},
            {"role": "user", "content": text},
        ],
        temperature=0.7,
        max_tokens=100,  # Limit to keep titles short
    )

    title = response.choices[0].message.content or "New Chat"
    # Clean up title - remove quotes and colons, trim whitespace
    title = title.strip().strip('"').strip("'").replace(":", "").strip()
    # Ensure it's not more than 80 characters
    if len(title) > 80:
        title = title[:77] + "..."
    return title or "New Chat"


@router.post("")
async def create_chat(
    request: ChatRequest,
    http_request: Request,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create or continue a chat conversation.
    Handles database operations and proxies AI streaming to Next.js.
    """
    logger.info("=== POST /api/chat called ===")
    logger.info(
        "current_user_id=%s (raw), request.id=%s, X-Session-Id header=%s",
        current_user.get("id"),
        request.id,
        http_request.headers.get("X-Session-Id"),
    )

    user_id = get_user_id_uuid(current_user["id"])
    user_type = current_user.get("type", "regular")

    logger.info(
        "User ID conversion: current_user_id=%s -> uuid=%s (type=%s)",
        current_user["id"],
        user_id,
        type(user_id).__name__,
    )

    await ensure_chat_ready_or_raise()

    # Note: User should already exist in database (created during registration/guest creation)
    # No need to check or create users here

    # 1. Rate limiting check
    logger.info("[chat] rate_limit check start")
    message_count = await get_message_count_by_user_id(db, user_id, hours=24)
    max_messages = ENTITLEMENTS.get(user_type, ENTITLEMENTS["regular"])["maxMessagesPerDay"]
    logger.info(
        "[chat] rate_limit check done: user_id=%s, message_count=%d, max_messages=%d",
        user_id,
        message_count,
        max_messages,
    )

    if message_count >= max_messages:
        logger.warning(
            "Rate limit exceeded: user_id=%s, user_type=%s, message_count=%d >= max_messages=%d",
            user_id,
            user_type,
            message_count,
            max_messages,
        )
        raise ChatSDKError(
            "rate_limit:chat",
            f"Rate limit exceeded. Maximum {max_messages} messages per day.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # 2. Get or create chat
    logger.info("[chat] get_chat_by_id start chat_id=%s", request.id)
    chat = await get_chat_by_id(db, request.id)
    logger.info("[chat] get_chat_by_id done found=%s", chat is not None)
    messages_from_db = []  # messagesFromDb

    if chat:
        logger.info(
            "Existing chat found: id=%s, userId=%s (type=%s), current_user_id_uuid=%s",
            chat.id,
            chat.userId,
            type(chat.userId).__name__,
            user_id,
        )
        # Validate ownership
        if chat.userId != user_id:
            logger.warning(
                "Chat ownership mismatch: chat.userId=%s != current_user_id_uuid=%s",
                chat.userId,
                user_id,
            )
            raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

        # Extract session summary from lastContext for incremental summarization
        last_context = (chat.lastContext or {}) if chat else {}
        loaded_session_summary: str = last_context.get("session_summary", "") or ""
        loaded_summarized_count: int = last_context.get("summarized_message_count", 0) or 0

        # Fetch existing messages
        messages_from_db = await get_messages_by_chat_id(db, request.id)

        # Prepare request for Next.js
        # Convert existing messages to dict format
        messages_from_db = [
            {
                "id": str(msg.id),
                "role": msg.role,
                "parts": msg.parts,
                "attachments": msg.attachments,
                "createdAt": msg.createdAt.isoformat(),
            }
            for msg in messages_from_db
        ]
        logger.info(
            "Fetched %d messages from DB for chat_id: %s", len(messages_from_db), request.id
        )
        logger.debug("messages_from_db: %s", json.dumps(messages_from_db, indent=4))

    else:
        loaded_session_summary = ""
        loaded_summarized_count = 0
        # Create new chat - generate title from user message
        stored_visibility = (
            request.selectedVisibilityType
            if get_settings().ENABLE_SHARE_CONVERSATION
            else "private"
        )
        logger.info(
            "Creating new chat: id=%s, userId=%s, visibility=%s",
            request.id,
            user_id,
            stored_visibility,
        )
        # Generate title from user message
        logger.info("[chat] generate_title_from_user_message start (new chat)")
        title = await generate_title_from_user_message(request.message)
        logger.info("[chat] generate_title_from_user_message done title=%s", (title or "")[:50])
        chat = await save_chat(
            db,
            request.id,
            user_id,
            title=title,
            visibility=stored_visibility,
        )
        logger.info(
            "Chat created: id=%s, userId=%s (stored in DB)",
            chat.id,
            chat.userId,
        )

    # 3. Save user message
    logger.info("[chat] save_messages start (user message)")
    await save_messages(
        db,
        [
            {
                "id": str(request.message.id),
                "chatId": str(request.id),
                "role": "user",
                "parts": [part.model_dump() for part in request.message.parts],
                "attachments": [],
                "createdAt": datetime.utcnow(),
            }
        ],
    )
    logger.info("[chat] save_messages done")

    # 4. Create stream ID
    logger.info("[chat] create_stream_id start")
    stream_id = uuid4()
    await create_stream_id(db, stream_id, request.id)
    logger.info("[chat] create_stream_id done stream_id=%s", stream_id)

    # 5. Prepare for AI streaming (direct call, no HTTP proxy)
    # Combine existing messages with the new user message for AI context
    all_messages = []
    for msg in messages_from_db:
        all_messages.append(
            {
                "id": str(msg["id"]),
                "role": msg["role"],
                "parts": msg["parts"],
                "attachments": msg.get("attachments") or [],
                "createdAt": msg["createdAt"],
            }
        )

    # Add the new user message
    all_messages.append(
        {
            "id": str(request.message.id),
            "role": request.message.role,
            "parts": [part.model_dump() for part in request.message.parts],
            "attachments": [],
            "createdAt": datetime.utcnow().isoformat(),
        }
    )

    logger.info("[chat] all_messages built count=%d", len(all_messages))

    # Convert messages to OpenAI format (fetches file data from database)
    logger.info("[chat] convert_messages_to_openai_format start")
    openai_messages = await convert_messages_to_openai_format(all_messages, db)
    logger.info("[chat] convert_messages_to_openai_format done count=%d", len(openai_messages))

    # Current query text (for @wdr token detection in router_node)
    query_text = get_text_from_message(request.message)

    # Prepare tools (LangChain tools are in tool_set["mcp_data"], ["mcp_viz"], ["local"])
    logger.info("[chat] prepare_tools start")
    tool_set = await prepare_tools(user_id, db)
    logger.info("[chat] prepare_tools done")

    # Track if stream was interrupted (client disconnect) vs completed normally
    stream_interrupted = False

    async def stream_generator():
        nonlocal stream_interrupted
        logger.info("[chat] stream_generator (LangGraph) started stream_id=%s", stream_id)
        state = {"sequence": 0}
        # Stream envelope id (SSE / UI); not the persisted Message row id.
        part_message_id = f"msg-{uuid4().hex}"
        # Persisted assistant message id (UUID) and lastContext.byMessageId key.
        message_id = str(uuid4())
        graph_out: dict = {}  # populated by stream_graph_to_sse

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
                forced_intent=None,
                session_summary=loaded_session_summary,
                summarized_message_count=loaded_summarized_count,
            ):
                yield await _store_and_yield(stream_id, state, sse_bytes)
                await asyncio.sleep(0)

        except GeneratorExit:
            stream_interrupted = True
            logger.info(
                "Stream interrupted (client disconnect) for stream_id=%s, chat_id=%s",
                stream_id,
                request.id,
            )
            raise  # Re-raise to properly close the generator
        finally:
            logger.info(
                "Stream generator exiting (stream_interrupted=%s); HTTP response will close",
                stream_interrupted,
            )
            if not stream_interrupted:
                asyncio.create_task(mark_stream_complete(stream_id))

                if graph_out.get("stream_failed"):
                    logger.info(
                        "[chat] skipping assistant persist (graph stream_failed) chat_id=%s",
                        request.id,
                    )
                else:
                    assistant_message = _build_assistant_message_from_graph(
                        message_id, graph_out, chat_id=request.id
                    )
                    logger.info(
                        "[chat] saving assistant message parts=%d",
                        len(assistant_message.get("parts", [])),
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
                        session_summary=graph_out.get("session_summary") or None,
                        summarized_message_count=graph_out.get("summarized_message_count") or None,
                    )

    response = StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

    return patch_response_with_headers(response)


@router.get("/{chat_id}/messages/latest")
async def get_latest_messages(
    chat_id: UUID,
    limit: int = Query(1, ge=1, le=10),
    current_user: dict | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the latest N messages for a chat.
    Returns only the messages, not the full chat data.
    Useful for efficiently fetching recently saved messages after streaming.

    Note: Uses get_optional_user to allow unauthenticated access to public chats.
    """
    logger.info("=== GET /api/chat/%s/messages/latest called (limit=%d) ===", chat_id, limit)

    # Get chat
    chat = await get_chat_by_id(db, chat_id)
    if not chat:
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)

    # Check access permissions (same logic as get_chat)
    effective = effective_visibility(chat.visibility)
    if effective == "private":
        # Private chats require authentication
        if not current_user:
            logger.warning("Access denied: private chat requires authentication")
            raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

        # Convert current user ID to UUID for comparison
        current_user_id_uuid = get_user_id_uuid(current_user["id"])

        if chat.userId != current_user_id_uuid:
            logger.warning(
                "Access denied: chat.userId=%s != current_user_id_uuid=%s",
                chat.userId,
                current_user_id_uuid,
            )
            raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

    # Get latest messages
    messages = await get_latest_messages_by_chat_id(db, chat_id, limit=limit)

    # Convert to response format
    return {
        "messages": [
            {
                "id": str(msg.id),
                "role": msg.role,
                "parts": msg.parts,
                "attachments": msg.attachments,
                "createdAt": msg.createdAt.isoformat(),
            }
            for msg in messages
        ]
    }


@router.get("/{chat_id}")
async def get_chat(
    chat_id: UUID,
    current_user: dict | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a chat by ID with its messages.
    Returns chat data, messages, and ownership status for the current user.

    Note: Uses get_optional_user to allow unauthenticated access to public chats,
    matching the behavior of the deleted Next.js route.
    """
    logger.info("=== GET /api/chat/%s called ===", chat_id)
    logger.info(
        "current_user=%s (type=%s, restored=%s)",
        current_user.get("id") if current_user else None,
        current_user.get("type") if current_user else None,
        current_user.get("_restore_guest") or current_user.get("_restore_user")
        if current_user
        else False,
    )
    # Log cookies check
    logger.info(
        "Cookies check: current_user present=%s, has_restore_flag=%s",
        current_user is not None,
        (current_user.get("_restore_guest") or current_user.get("_restore_user"))
        if current_user
        else False,
    )

    # Get chat
    chat = await get_chat_by_id(db, chat_id)
    if not chat:
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)

    # Check access permissions
    is_owner = False
    effective = effective_visibility(chat.visibility)

    if effective == "private":
        # Private chats require authentication
        if not current_user:
            logger.warning("Access denied: private chat requires authentication")
            raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

        # Convert current user ID to UUID for comparison
        current_user_id_uuid = get_user_id_uuid(current_user["id"])
        logger.info(
            "User ID comparison: current_user_id=%s -> uuid=%s, chat.userId=%s (type=%s), visibility=%s",
            current_user["id"],
            current_user_id_uuid,
            chat.userId,
            type(chat.userId).__name__,
            effective,
        )

        if chat.userId != current_user_id_uuid:
            logger.warning(
                "Access denied: chat.userId=%s != current_user_id_uuid=%s (from %s)",
                chat.userId,
                current_user_id_uuid,
                current_user["id"],
            )
            raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

        is_owner = True
    else:
        # Public chats: check ownership if user is authenticated
        if current_user:
            current_user_id_uuid = get_user_id_uuid(current_user["id"])
            is_owner = chat.userId == current_user_id_uuid

    # Get messages
    messages = await get_messages_by_chat_id(db, chat_id)

    # Convert to response format
    return {
        "chat": {
            "id": str(chat.id),
            "title": chat.title,
            "createdAt": chat.createdAt.isoformat(),
            "updatedAt": chat.updatedAt.isoformat(),
            "visibility": effective,
            "userId": str(chat.userId),
            "lastContext": chat.lastContext,
        },
        "messages": [
            {
                "id": str(msg.id),
                "role": msg.role,
                "parts": msg.parts,
                "attachments": msg.attachments,
                "createdAt": msg.createdAt.isoformat(),
            }
            for msg in messages
        ],
        "isOwner": is_owner,
    }


@router.delete("")
async def delete_chat(
    chat_id: UUID = Query(..., alias="id"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a chat by ID.
    Returns the deleted chat object.
    """
    # Validate chat exists
    chat = await get_chat_by_id(db, chat_id)
    if not chat:
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)

    # Validate user owns the chat
    if not user_ids_match(current_user["id"], chat.userId):
        logger.warning(
            "Delete access denied (ownership mismatch): current_user_id=%s, chat.userId=%s, chatId=%s. "
            "Chat may have been created before login (guest) or under different session.",
            current_user["id"],
            chat.userId,
            chat_id,
        )
        raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

    # Delete the chat (cascade deletes votes, messages, streams)
    deleted_chat = await delete_chat_by_id(db, chat_id)

    if not deleted_chat:
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)

    # Convert to dict format matching frontend expectations
    return {
        "id": str(deleted_chat.id),
        "title": deleted_chat.title,
        "createdAt": deleted_chat.createdAt.isoformat(),
        "updatedAt": deleted_chat.updatedAt.isoformat(),
        "visibility": deleted_chat.visibility,
        "userId": str(deleted_chat.userId),
        "lastContext": deleted_chat.lastContext,
    }


@router.delete("/messages", response_model=DeleteMessagesResponse)
async def delete_messages(
    request: DeleteMessagesRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Soft-delete a message. If includeTrailing is True (default),
    also soft-deletes all subsequent messages in the same chat.
    """
    message_id = UUID(request.id)
    message = await get_message_by_id(db, message_id)

    if not message:
        raise ChatSDKError("not_found:message", status_code=status.HTTP_404_NOT_FOUND)

    chat = await get_chat_by_id(db, message.chatId)
    if not chat:
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)

    if not user_ids_match(current_user["id"], chat.userId):
        raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

    if request.includeTrailing:
        deleted_count = await soft_delete_messages_by_chat_id_after_timestamp(
            db, message.chatId, message.createdAt
        )
    else:
        deleted_count = await soft_delete_message_by_id(db, message_id)

    logger.info(
        "Soft-deleted %d message(s) for chat_id=%s from message_id=%s (includeTrailing=%s)",
        deleted_count,
        message.chatId,
        message_id,
        request.includeTrailing,
    )
    return DeleteMessagesResponse(deletedCount=deleted_count)


@router.patch("/visibility", response_model=UpdateChatVisibilityResponse)
async def update_chat_visibility(
    request: UpdateChatVisibilityRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a chat's visibility (public/private)."""
    chat_id = UUID(request.chatId)
    chat = await get_chat_by_id(db, chat_id)

    if not chat:
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)

    if not user_ids_match(current_user["id"], chat.userId):
        raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

    if not get_settings().ENABLE_SHARE_CONVERSATION and request.visibility == "public":
        raise ChatSDKError(
            "forbidden:chat",
            "Public chat sharing is disabled",
            status.HTTP_403_FORBIDDEN,
        )

    updated_chat = await update_chat_visibility_by_id(db, chat_id, request.visibility)
    return UpdateChatVisibilityResponse(id=str(updated_chat.id), visibility=updated_chat.visibility)


@router.get("/suggestions", response_model=List[SuggestionResponse])
async def get_suggestions(
    document_id: str = Query(..., alias="documentId"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get suggestions for a document by document ID."""
    document_uuid = UUID(document_id)
    suggestions = await get_suggestions_by_document_id(db, document_uuid)

    if not suggestions:
        return []

    if not user_ids_match(current_user["id"], suggestions[0].user_id):
        raise ChatSDKError("forbidden:api", status_code=status.HTTP_403_FORBIDDEN)

    return [
        SuggestionResponse(
            id=str(s.id),
            documentId=str(s.document_id),
            originalText=s.original_text,
            suggestedText=s.suggested_text,
            description=s.description,
            isResolved=s.is_resolved,
            userId=str(s.user_id),
            createdAt=s.created_at.isoformat() if s.created_at else None,
        )
        for s in suggestions
    ]
