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

CONTENT_POLICY_USER_MESSAGE = (
    "This response is incomplete because the model provider blocked this reply under its content safety rules. "
    "Try rephrasing your question, narrowing the topic, or contacting support."
)

# Legacy sentinel persisted before BE-003; kept for reload/migration detection only.
LLM_POLICY_BLOCKED_TEXT = "[blocked]"

CONTENT_POLICY_BLOCKED_PART_TYPE = "data-contentPolicyBlocked"

LLM_STEP_FAILED_TEXT = "Sorry, this step could not be completed. Please try again in a moment."


def content_policy_blocked_part(*, node: str) -> dict:
    """Persisted/streamed part marking a non-fatal content-policy block."""
    return {
        "type": CONTENT_POLICY_BLOCKED_PART_TYPE,
        "data": {"node": node, "message": CONTENT_POLICY_USER_MESSAGE},
    }


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
