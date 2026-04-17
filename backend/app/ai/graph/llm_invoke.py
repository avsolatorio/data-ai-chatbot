"""Safe LLM ``ainvoke`` for LangGraph nodes — avoids crashing the stream on policy/API errors."""

from __future__ import annotations

import logging
from typing import Literal

from langchain_core.messages import AIMessage

try:
    from litellm.exceptions import ContentPolicyViolationError
except ImportError:  # pragma: no cover

    class ContentPolicyViolationError(Exception):  # type: ignore[misc, no-redef]
        """Fallback if litellm is not installed."""

        pass


logger = logging.getLogger(__name__)

LLM_POLICY_BLOCKED_TEXT = "[blocked]"
LLM_STEP_FAILED_TEXT = "Sorry, this step could not be completed. Please try again in a moment."


def assistant_text_part(text: str) -> dict:
    """Single assistant message part for DB / state assembly."""
    return {"type": "text", "text": text, "state": "done"}


LLMOutcome = Literal["ok", "policy", "other"]


async def safe_llm_ainvoke(
    llm: object,
    messages: list,
    *,
    context: str,
) -> tuple[AIMessage | None, LLMOutcome]:
    """Call ``llm.ainvoke(messages)``; return ``(message, outcome)`` without raising."""
    try:
        msg: AIMessage = await llm.ainvoke(messages)  # type: ignore[union-attr]
        return msg, "ok"
    except ContentPolicyViolationError as exc:
        logger.warning("[%s] LLM blocked by content policy: %s", context, exc)
        return None, "policy"
    except Exception as exc:
        logger.warning(
            "[%s] LLM call failed: %s",
            context,
            exc,
            exc_info=logger.isEnabledFor(logging.DEBUG),
        )
        return None, "other"
