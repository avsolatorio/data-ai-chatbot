"""Utilities for converting between OpenAI-format messages and LangChain messages.

The backend uses a dict-based OpenAI message format throughout
(from convert_messages_to_openai_format()).  LangGraph nodes need
LangChain BaseMessage objects.  This module provides the bridge.
"""

import json
import logging
from typing import Any

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)

logger = logging.getLogger(__name__)


def openai_to_langchain(openai_messages: list[dict[str, Any]]) -> list[BaseMessage]:
    """Convert a list of OpenAI-format message dicts to LangChain BaseMessage objects.

    Handles:
    - user messages (content as str or list of content parts)
    - assistant messages (plain text or with tool_calls)
    - tool messages (tool results)
    - system messages (passed through as SystemMessage)

    The result is sanitized: orphaned ToolMessages and AIMessages with tool_calls
    whose responses were cut off (e.g. due to history slicing) are removed so that
    Azure / OpenAI never receive an invalid message sequence.
    """
    lc_messages: list[BaseMessage] = []

    for msg in openai_messages:
        role: str = msg.get("role", "")
        content: Any = msg.get("content", "")

        if role == "user":
            text = _extract_text(content)
            lc_messages.append(HumanMessage(content=text))

        elif role == "assistant":
            tool_calls_raw: list[dict] = msg.get("tool_calls", [])
            text = _extract_text(content)
            if tool_calls_raw:
                lc_tool_calls = []
                for tc in tool_calls_raw:
                    fn = tc.get("function", {})
                    try:
                        args = json.loads(fn.get("arguments", "{}"))
                    except json.JSONDecodeError:
                        args = {}
                    lc_tool_calls.append(
                        {"id": tc.get("id", ""), "name": fn.get("name", ""), "args": args}
                    )
                lc_messages.append(AIMessage(content=text, tool_calls=lc_tool_calls))
            else:
                lc_messages.append(AIMessage(content=text))

        elif role == "tool":
            lc_messages.append(
                ToolMessage(
                    content=str(content) if not isinstance(content, str) else content,
                    tool_call_id=msg.get("tool_call_id", ""),
                )
            )

        elif role == "system":
            text = _extract_text(content)
            lc_messages.append(SystemMessage(content=text))

        else:
            logger.debug("openai_to_langchain: skipping unknown role=%s", role)

    return _sanitize_tool_sequences(lc_messages)


def _sanitize_tool_sequences(messages: list[BaseMessage]) -> list[BaseMessage]:
    """Remove incomplete tool-call sequences from a message list.

    When conversation history is sliced (e.g. "last 6 messages"), a tool
    interaction can be cut mid-sequence, producing either:
      - A ToolMessage with no preceding AIMessage that has matching tool_calls
        (the AIMessage fell outside the slice window)
      - An AIMessage with tool_calls whose ToolMessage responses were not included
        (the ToolMessages fell outside the slice window)

    Azure and OpenAI both reject such sequences with a 400 error.  This function
    removes the offending messages so the LLM receives a valid sequence.

    Algorithm (3 passes):
      1. Collect all ToolMessage IDs present in the list.
      2. Collect "valid" tool_call_ids — only those belonging to an AIMessage that
         is itself present AND whose full response set is also present.
         (An AIMessage whose originating pair is cut off is never validated.)
      3. Keep only messages that belong to a validated complete interaction,
         or are plain messages with no tool involvement.
    """
    # Pass 1: which tool_call_ids have a ToolMessage response in this list?
    ids_with_response: set[str] = {
        msg.tool_call_id for msg in messages if isinstance(msg, ToolMessage) and msg.tool_call_id
    }

    # Pass 2: which tool_call_ids come from a *present* AIMessage with a *complete*
    # response set?  Both conditions must hold — the AIMessage must be in the list
    # AND all its expected ToolMessage responses must also be in the list.
    valid_ids: set[str] = set()
    for msg in messages:
        if isinstance(msg, AIMessage) and msg.tool_calls:
            ids = {tc.get("id", "") for tc in msg.tool_calls if tc.get("id")}
            if ids and ids.issubset(ids_with_response):
                valid_ids.update(ids)

    # Pass 3: filter.
    result: list[BaseMessage] = []
    for msg in messages:
        if isinstance(msg, AIMessage) and msg.tool_calls:
            ids = {tc.get("id", "") for tc in msg.tool_calls if tc.get("id")}
            if ids and ids.issubset(valid_ids):
                result.append(msg)
            else:
                logger.debug(
                    "_sanitize_tool_sequences: dropping AIMessage with incomplete tool_calls ids=%s",
                    ids - valid_ids,
                )
        elif isinstance(msg, ToolMessage):
            if msg.tool_call_id in valid_ids:
                result.append(msg)
            else:
                logger.debug(
                    "_sanitize_tool_sequences: dropping orphaned ToolMessage tool_call_id=%s",
                    msg.tool_call_id,
                )
        else:
            result.append(msg)

    return result


def _extract_text(content: Any) -> str:
    """Flatten OpenAI multi-part content to a plain string."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(item.get("text", ""))
        return "\n".join(parts)
    return str(content) if content else ""


def plain_text_from_ai_message_content(content: Any) -> str:
    """Flatten ``AIMessage.content`` from an LLM response to a single string for DB / UI.

    LangChain may return a string, OpenAI-style ``[{"type":"text","text":"..."}]`` blocks,
    a list of plain strings, or objects with a ``.text`` attribute. Using ``content or ""``
    in callers is wrong for non-empty lists (truthy but not displayable text).
    """
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        pieces: list[str] = []
        for block in content:
            if isinstance(block, str):
                pieces.append(block)
            elif isinstance(block, dict) and block.get("type") == "text":
                pieces.append(str(block.get("text", "")))
            else:
                inner = getattr(block, "text", None)
                if isinstance(inner, str):
                    pieces.append(inner)
        return "".join(pieces)
    return str(content) if content else ""
