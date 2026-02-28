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

from app.ai.client import get_ai_client, get_async_ai_client, get_model_name
from app.ai.observability.token_usage import DataUsageData
from app.ai.prompts import (
    THINKING_TO_ANSWER_TOKEN,
    get_combined_system_prompt,
    get_direct_system_prompt,
)
from app.ai.protocols.stream import (
    DataPart,
    DataThinkingPart,
    MessageStartPart,
    TextDeltaPart,
    TextEndPart,
    TextStartPart,
)
from app.ai.routing import check_intent
from app.api.deps import get_current_user, get_optional_user
from app.api.v1.utils.background_tasks import (
    create_save_messages_task,
    create_update_context_task,
)
from app.api.v1.utils.continue_stream import _continue_stream_in_background
from app.api.v1.utils.tool_setup import prepare_tools
from app.config import IntentType, ModelType
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import (
    create_stream_id,
    delete_chat_by_id,
    soft_delete_message_by_id,
    soft_delete_messages_by_chat_id_after_timestamp,
    get_chat_by_id,
    get_latest_messages_by_chat_id,
    get_message_by_id,
    get_message_count_by_user_id,
    get_messages_by_chat_id,
    save_chat,
    save_messages,
    update_chat_visibility_by_id,
)
from app.db.queries.suggestion_queries import get_suggestions_by_document_id
from app.utils.message_converter import convert_messages_to_openai_format
from app.utils.resumable_stream import mark_stream_complete, store_stream_chunk
from app.api.v1.schemas.chat_schemas import (
    DeleteMessagesRequest,
    DeleteMessagesResponse,
    SuggestionResponse,
    UpdateChatVisibilityRequest,
    UpdateChatVisibilityResponse,
)
from app.utils.stream import patch_response_with_headers
from app.utils.stream_processor import StreamEventProcessor
from app.utils.user_id import get_user_id_uuid, user_ids_match

logger = logging.getLogger(__name__)


# ---- Stream generator helpers (keep stream_generator readable) ----


async def _store_and_yield(stream_id: UUID, state: dict, sse_bytes: bytes):
    """Yield one SSE chunk after storing it; increment sequence and flush."""
    seq = state["sequence"]
    state["sequence"] += 1
    asyncio.create_task(store_stream_chunk(stream_id, sse_bytes, seq))
    return sse_bytes


async def _emit_routing_phase(
    message_id: str,
    stream_id: UUID,
    openai_messages: list,
    state: dict,
    out: dict,
    query: str = "",
):
    """Async generator: emit routing stage + 'Understanding your question' + check_intent + reasoning. Sets out['use_thinking'] and out['reasoning']."""
    # Stage and static text
    yield await _store_and_yield(
        stream_id,
        state,
        DataPart(type="data-stage", data={"stage": "routing"}).to_sse().encode("utf-8"),
    )
    await asyncio.sleep(0)
    routing_part_id = f"routing-{message_id}"
    for part in (
        TextStartPart(id=routing_part_id),
        TextDeltaPart(id=routing_part_id, delta="Understanding your question…"),
        TextEndPart(id=routing_part_id),
    ):
        sse_bytes = (
            DataThinkingPart(id=message_id, data=part.model_dump(exclude_none=True))
            .to_sse()
            .encode("utf-8")
        )
        yield await _store_and_yield(stream_id, state, sse_bytes)
        await asyncio.sleep(0)

    intent, reasoning = await check_intent(openai_messages)
    out["use_thinking"] = intent == IntentType.RESEARCH
    out["reasoning"] = reasoning or ""

    # Force WDR research path when the query contains @wdr
    if "@wdr" in query.lower():
        out["use_thinking"] = True
        out["reasoning"] = (
            "WDR research triggered by @wdr."
            if not out["reasoning"]
            else out["reasoning"] + " (WDR forced by @wdr.)"
        )

    if not out["use_thinking"]:
        logger.info(
            "Fast-path: DIRECT intent. Chat phase streams text-start/text-delta; frontend shows them via useChat."
        )

    if reasoning:
        reason_part_id = f"routing-reason-{message_id}"
        for part in (
            TextStartPart(id=reason_part_id),
            TextDeltaPart(id=reason_part_id, delta=reasoning),
            TextEndPart(id=reason_part_id),
        ):
            sse_bytes = (
                DataThinkingPart(id=message_id, data=part.model_dump(exclude_none=True))
                .to_sse()
                .encode("utf-8")
            )
            yield await _store_and_yield(stream_id, state, sse_bytes)
            await asyncio.sleep(0)


async def _stream_with_store(stream_id: UUID, state: dict, aiter):
    """Forward an async iterable of SSE bytes, storing each and yielding it."""
    async for event_bytes in aiter:
        yield await _store_and_yield(stream_id, state, event_bytes)
        await asyncio.sleep(0)


def _build_routing_parts(message_id: str, reasoning: str) -> List[dict]:
    """Parts to prepend to assistant message for the Reasoning block (reload)."""
    parts = [
        {
            "type": "data-thinking",
            "id": message_id,
            "data": {"type": "text", "text": "Understanding your question…"},
        },
    ]
    if reasoning:
        parts.append(
            {
                "type": "data-thinking",
                "id": message_id,
                "data": {"type": "text", "text": reasoning},
            }
        )
    return parts


def _build_assistant_message(
    message_id: str,
    reasoning: str,
    stream_processor: StreamEventProcessor,
) -> dict:
    """Build the assistant message dict with routing parts for saving.
    When mode was unified, stream_processor.assistant_messages[0] already has
    both thinking and chat parts. When mode was chat, it has only chat parts.
    Use message_id (sent to frontend in MessageStartPart) as the saved message id
    so lastContext.byMessageId and the DB message id match.
    """
    routing_parts = _build_routing_parts(message_id, reasoning)
    assistant_message = stream_processor.assistant_messages[0].copy()
    assistant_message["id"] = message_id
    assistant_message["parts"] = routing_parts + assistant_message["parts"]
    return assistant_message


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
        # Create new chat - generate title from user message
        logger.info(
            "Creating new chat: id=%s, userId=%s, visibility=%s",
            request.id,
            user_id,
            request.selectedVisibilityType,
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
            visibility=request.selectedVisibilityType,
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

    # Current query text (for @wdr token detection)
    query_text = get_text_from_message(request.message)

    # System prompt: combined (one-LLM) for RESEARCH path; direct for DIRECT path
    request_hints = None  # Will be implemented later
    system_direct = get_direct_system_prompt()
    system_combined = get_combined_system_prompt(request.selectedChatModel, request_hints)

    # Get async AI client for streaming and model name
    client = get_async_ai_client()
    model = get_model_name(request.selectedChatModel)
    logger.info("[chat] AI client ready model=%s", model)

    # Prepare tools
    logger.info("[chat] prepare_tools start")
    tool_set = await prepare_tools(user_id, db)
    logger.info("[chat] prepare_tools done")

    # Processor is created inside stream_generator after use_thinking is known

    # Track if stream was interrupted (client disconnect) vs completed normally
    stream_interrupted = False

    async def stream_generator():
        nonlocal stream_interrupted
        logger.info("[chat] stream_generator started stream_id=%s", stream_id)
        state = {"sequence": 0}

        # This is the part message id
        part_message_id = f"msg-{uuid4().hex}"

        # This is the response message id
        message_id = str(uuid4())
        use_thinking = False
        reasoning = ""
        stream_processor = None
        chat_system = system_direct
        tools_for_stream = tool_set["local"]["tools"]
        tool_defs_for_stream = tool_set["local"]["tool_definitions"]

        try:
            yield MessageStartPart(messageId=part_message_id).to_sse().encode("utf-8")
            await asyncio.sleep(0)

            logger.info("[chat] _emit_routing_phase start (check_intent + routing LLM)")
            out = {}
            async for chunk in _emit_routing_phase(
                part_message_id, stream_id, openai_messages, state, out, query=query_text
            ):
                yield chunk
            logger.info("[chat] _emit_routing_phase done use_thinking=%s", out.get("use_thinking"))
            use_thinking = out["use_thinking"]
            reasoning = out["reasoning"]
            chat_system = system_combined if use_thinking else system_direct
            merged_tools = {**tool_set["mcp"]["tools"], **tool_set["local"]["tools"]}
            merged_definitions = (
                tool_set["mcp"]["tool_definitions"] + tool_set["local"]["tool_definitions"]
            )
            tools_for_stream = merged_tools if use_thinking else tool_set["local"]["tools"]
            tool_defs_for_stream = (
                merged_definitions if use_thinking else tool_set["local"]["tool_definitions"]
            )

            stream_processor = StreamEventProcessor(
                request.id, mode="unified" if use_thinking else "chat"
            )
            logger.info("[chat] main stream start mode=%s", "unified" if use_thinking else "chat")
            if use_thinking:
                # Single LLM call: combined prompt, merged MCP + local tools, transition token
                async for chunk in _stream_with_store(
                    stream_id,
                    state,
                    stream_processor.process_stream(
                        client=client,
                        model=model,
                        messages=openai_messages,
                        system=system_combined,
                        tools=tools_for_stream,
                        tool_definitions=tool_defs_for_stream,
                        thinking_to_answer_token=THINKING_TO_ANSWER_TOKEN,
                    ),
                ):
                    yield chunk
            else:
                # Direct path: one call, no thinking
                async for chunk in _stream_with_store(
                    stream_id,
                    state,
                    stream_processor.process_stream(
                        client=client,
                        model=model,
                        messages=openai_messages,
                        system=system_direct,
                        tools=tools_for_stream,
                        tool_definitions=tool_defs_for_stream,
                    ),
                ):
                    yield chunk

        except GeneratorExit:
            # Client disconnected (browser refresh, navigation, etc.)
            stream_interrupted = True
            logger.info(
                "Stream interrupted (client disconnect) for stream_id=%s, chat_id=%s",
                stream_id,
                request.id,
            )
            # Continue stream in background when we have a processor (skip if disconnect during routing)
            if stream_processor is not None:
                asyncio.create_task(
                    _continue_stream_in_background(
                        stream_id=stream_id,
                        chat_id=request.id,
                        client=client,
                        model=model,
                        messages=openai_messages,
                        system=chat_system,
                        tools=tools_for_stream,
                        tool_definitions=tool_defs_for_stream,
                        background_tasks=background_tasks,
                        processor=stream_processor,
                        current_sequence=state["sequence"],
                        thinking_to_answer_token=THINKING_TO_ANSWER_TOKEN if use_thinking else None,
                    )
                )
            raise  # Re-raise to properly close the generator
        finally:
            logger.info(
                "Stream generator exiting (stream_interrupted=%s); HTTP response will close",
                stream_interrupted,
            )
            # Only mark as complete if stream finished normally (not interrupted)
            if not stream_interrupted and stream_processor is not None:
                # Mark stream as complete in Redis (non-blocking)
                asyncio.create_task(mark_stream_complete(stream_id))

                assert len(stream_processor.assistant_messages) == 1, (
                    "Stream processor assistant messages count should be 1, but got %d"
                    % len(stream_processor.assistant_messages)
                )

                assistant_message = _build_assistant_message(
                    message_id, reasoning, stream_processor
                )
                logger.info("Assistant message: %s", assistant_message)
                create_save_messages_task(
                    background_tasks,
                    request.id,
                    [assistant_message],
                )
                if stream_processor.final_usage:
                    create_update_context_task(
                        background_tasks,
                        request.id,
                        DataUsageData.model_validate(stream_processor.final_usage),
                        message_id=message_id,
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
    if chat.visibility == "private":
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

    if chat.visibility == "private":
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
            chat.visibility,
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
            "visibility": chat.visibility,
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
        deleted_count, message.chatId, message_id, request.includeTrailing,
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

    updated_chat = await update_chat_visibility_by_id(db, chat_id, request.visibility)
    return UpdateChatVisibilityResponse(
        id=str(updated_chat.id), visibility=updated_chat.visibility
    )


@router.get("/suggestions", response_model=List[SuggestionResponse])
async def get_suggestions(
    documentId: str = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get suggestions for a document by document ID."""
    document_id = UUID(documentId)
    suggestions = await get_suggestions_by_document_id(db, document_id)

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
