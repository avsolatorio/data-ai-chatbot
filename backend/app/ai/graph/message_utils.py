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

    return lc_messages


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
