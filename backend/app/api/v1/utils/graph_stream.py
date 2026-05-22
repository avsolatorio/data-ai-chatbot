"""Shared LangGraph → SSE streaming helpers for chat routes."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator
from typing import Any, List
from uuid import UUID

from opentelemetry import trace

from app.ai.graph.graph_tool_notify import create_tool_sse_queue
from app.ai.graph.pipeline import chat_graph
from app.ai.graph.sse_bridge import stream_graph_to_sse
from app.ai.observability.token_usage import UsageFallbackBucket
from app.ai.protocols.stream import (
    DataPart,
    DataThinkingPart,
    MessageStartPart,
    TextDeltaPart,
    TextEndPart,
    TextStartPart,
)
from app.utils.resumable_stream import store_stream_chunk

logger = logging.getLogger(__name__)

_chat_tracer = trace.get_tracer("ai_chatbot.chat")


async def store_and_yield_stream_chunk(
    stream_id: UUID, state: dict[str, Any], sse_bytes: bytes
) -> bytes:
    """Store one SSE chunk in Redis (async) and return bytes for the response."""
    seq = state["sequence"]
    state["sequence"] += 1
    asyncio.create_task(store_stream_chunk(stream_id, sse_bytes, seq))
    return sse_bytes


def build_routing_parts(message_id: str, reasoning: str) -> List[dict]:
    """Parts to prepend to assistant message for the Reasoning block (reload)."""
    parts: List[dict] = [
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


def build_assistant_message_from_graph(message_id: str, graph_out: dict, *, chat_id: UUID) -> dict:
    """Build the assistant message dict from LangGraph stream output for DB save."""
    routing_parts = build_routing_parts(message_id, graph_out.get("routing_reasoning", ""))
    persisted = graph_out.get("assistant_parts_for_db") or []
    if persisted:
        body: List[dict] = persisted
    else:
        answer_text = graph_out.get("answer_text", "")
        body = [{"type": "text", "text": answer_text}] if answer_text else []

    card = graph_out.get("quick_answer_card")
    if card and isinstance(card, dict):
        # Append at the end so the leading data-thinking parts remain a contiguous
        # prefix — splitDataThinkingPrefixParts stops at the first non-data-thinking
        # part, so inserting at the front would hide all tool call thinking parts
        # after a page reload. The frontend locates this part by type, not position.
        body.append({"type": "data-quickAnswerCard", "data": card})
    return {
        "id": message_id,
        "chatId": chat_id,
        "role": "assistant",
        "parts": routing_parts + body,
    }


def build_graph_input(
    *,
    openai_messages: list[dict],
    model_type: str,
    query_text: str,
    part_message_id: str,
    tool_set: dict[str, Any],
    forced_intent: str | None = None,
    session_summary: str = "",
    summarized_message_count: int = 0,
) -> dict[str, Any]:
    """Initial LangGraph state (chat pipeline)."""
    inp: dict[str, Any] = {
        "openai_messages": openai_messages,
        "model_type": model_type,
        "query_text": query_text,
        "message_id": part_message_id,
        "tool_set": tool_set,
        "intent": "",
        "routing_reasoning": "",
        "research_packet": "",
        "assistant_parts": [],
        "final_usage": None,
        "_usage_fallback_bucket": UsageFallbackBucket(),
        "_tool_sse_queue": create_tool_sse_queue(),
    }
    if forced_intent is not None:
        inp["forced_intent"] = forced_intent
    if session_summary:
        inp["session_summary"] = session_summary
    if summarized_message_count:
        inp["summarized_message_count"] = summarized_message_count
    return inp


async def emit_standard_chat_prelude(
    *,
    stream_id: UUID,
    state: dict[str, Any],
    part_message_id: str,
) -> AsyncIterator[bytes]:
    """MessageStart + routing stage + static 'Understanding…' thinking text (matches main chat)."""
    yield await store_and_yield_stream_chunk(
        stream_id,
        state,
        MessageStartPart(messageId=part_message_id).to_sse().encode("utf-8"),
    )
    await asyncio.sleep(0)

    yield await store_and_yield_stream_chunk(
        stream_id,
        state,
        DataPart(type="data-stage", data={"stage": "routing"}).to_sse().encode("utf-8"),
    )
    routing_part_id = f"routing-{part_message_id}"
    for part in (
        TextStartPart(id=routing_part_id),
        TextDeltaPart(id=routing_part_id, delta="Understanding your question…"),
        TextEndPart(id=routing_part_id),
    ):
        sse_bytes = (
            DataThinkingPart(id=part_message_id, data=part.model_dump(exclude_none=True))
            .to_sse()
            .encode("utf-8")
        )
        yield await store_and_yield_stream_chunk(stream_id, state, sse_bytes)
        await asyncio.sleep(0)


async def stream_chat_graph_sse(
    *,
    graph_out: dict[str, Any],
    openai_messages: list[dict],
    model_type: str,
    query_text: str,
    part_message_id: str,
    tool_set: dict[str, Any],
    assistant_row_id: str,
    forced_intent: str | None = None,
    session_summary: str = "",
    summarized_message_count: int = 0,
) -> AsyncIterator[bytes]:
    """Run ``chat_graph`` through ``stream_graph_to_sse`` and yield SSE bytes."""
    graph_input = build_graph_input(
        openai_messages=openai_messages,
        model_type=model_type,
        query_text=query_text,
        part_message_id=part_message_id,
        tool_set=tool_set,
        forced_intent=forced_intent,
        session_summary=session_summary,
        summarized_message_count=summarized_message_count,
    )
    logger.info("[graph_stream] stream_graph_to_sse start forced_intent=%s", forced_intent)
    turn_attrs: dict[str, str] = {
        "chatbot.message_id": part_message_id,
        "chatbot.model_type": model_type,
    }
    if forced_intent:
        turn_attrs["chatbot.forced_intent"] = forced_intent

    with _chat_tracer.start_as_current_span("chat.turn", attributes=turn_attrs):
        async for sse_bytes in stream_graph_to_sse(
            chat_graph,
            graph_input,
            part_message_id,
            out=graph_out,
            assistant_row_id=assistant_row_id,
        ):
            yield sse_bytes
    logger.info("[graph_stream] stream_graph_to_sse done")
