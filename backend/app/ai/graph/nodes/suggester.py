"""Suggester node: bridges off-scope queries to relevant development data questions.

No tools — single LLM call.  Acknowledges the user's topic and generates 3-5
thematically adjacent development data questions they could explore instead.

Token budget is small (4K) since the suggester only needs the last few turns.
"""

import logging
import re

from langchain_core.messages import AIMessage, BaseMessage, SystemMessage

from app.ai.observability.token_usage import append_llm_usage_fallback
from app.ai.prompts import get_suggester_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)


def _extract_suggestions(text: str) -> list[str]:
    """Extract bullet-point questions from the suggester response for telemetry."""
    lines = text.splitlines()
    suggestions = []
    for line in lines:
        stripped = line.strip()
        # Match lines starting with -, *, or a number followed by . or )
        if re.match(r"^[-*•]\s+.+", stripped) or re.match(r"^\d+[.)]\s+.+", stripped):
            question = re.sub(r"^[-*•\d.)\s]+", "", stripped).strip()
            if question:
                suggestions.append(question)
    return suggestions


async def suggester_node(state: ChatPipelineState) -> dict:
    """Generate 3-5 development data questions adjacent to an off-scope query.

    ``streaming=True`` ensures token-level events flow through the SSE bridge
    as ``langgraph_node="suggester"`` → plain text-delta (visible to the user).

    Returns state updates for ``suggestions``, ``assistant_parts``, and ``final_usage``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)

    llm = get_chat_llm(model_type, streaming=True)
    language: str = state.get("detected_language", "") or ""
    system_prompt: str = get_suggester_system_prompt(language=language)

    history = openai_to_langchain(state.get("openai_messages", []))
    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="suggester",
    )

    logger.info("[suggester_node] generating suggestions for off-scope query")
    response: AIMessage = await llm.ainvoke(messages)
    append_llm_usage_fallback(state.get("_usage_fallback_bucket"), response, node="suggester")

    final_content: str = response.content or ""
    final_usage: dict | None = None
    if hasattr(response, "usage_metadata") and response.usage_metadata:
        final_usage = dict(response.usage_metadata)

    suggestions = _extract_suggestions(final_content)
    logger.info(
        "[suggester_node] response length=%d suggestions_count=%d",
        len(final_content),
        len(suggestions),
    )

    assistant_part = {"type": "text", "text": final_content, "state": "done"}
    existing_parts: list[dict] = state.get("assistant_parts", [])

    return {
        "suggestions": suggestions,
        "assistant_parts": existing_parts + [assistant_part],
        "final_usage": final_usage,
    }
