"""Clarifier node: asks one focused question to resolve a missing query slot.

No tools — single LLM call.  The clarifying question is returned as a visible
text response.  The user's reply re-enters the pipeline at the router on the
next turn (no in-graph loopback needed).

Token budget is small (2K) since the clarifier only needs the last 2 turns + context.
"""

import logging

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

from app.ai.observability.token_usage import append_llm_usage_fallback
from app.ai.prompts import get_clarifier_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)


async def clarifier_node(state: ChatPipelineState) -> dict:
    """Ask the user one targeted question to resolve the missing slot.

    Injects ``missing_slots`` and ``routing_reasoning`` from the router into
    the conversation context so the LLM knows exactly which slot is absent.

    ``streaming=True`` ensures token-level events flow through the SSE bridge
    as ``langgraph_node="clarifier"`` → plain text-delta (visible to the user).

    Returns state updates for ``clarification_question``, ``assistant_parts``,
    and ``final_usage``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    missing_slots: list[str] = state.get("missing_slots", [])
    routing_reasoning: str = state.get("routing_reasoning", "")
    # query_text: str = state.get("query_text", "")

    llm = get_chat_llm(model_type, streaming=True)
    language: str = state.get("detected_language", "") or ""
    system_prompt: str = get_clarifier_system_prompt(language=language)

    history = openai_to_langchain(state.get("openai_messages", []))

    # Prepend session summary so the clarifier has full context even when
    # conversation history was truncated (e.g. country established 10+ turns ago).
    session_summary: str = state.get("session_summary", "") or ""
    if session_summary:
        history = [HumanMessage(content=f"[CONVERSATION SUMMARY]\n{session_summary}")] + history

    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="clarifier",
    )

    # Inject routing context as a hidden system hint so the LLM knows what's missing
    context_parts = []
    if missing_slots:
        context_parts.append(f"Missing slots: {', '.join(missing_slots)}")
    if routing_reasoning:
        context_parts.append(f"Router reasoning: {routing_reasoning}")
    if context_parts:
        messages.append(HumanMessage(content="[CONTEXT] " + " | ".join(context_parts)))

    logger.info("[clarifier_node] asking about missing_slots=%s", missing_slots)
    response: AIMessage = await llm.ainvoke(messages)
    append_llm_usage_fallback(state.get("_usage_fallback_bucket"), response)

    final_content: str = (response.content or "").strip()
    final_usage: dict | None = None
    if hasattr(response, "usage_metadata") and response.usage_metadata:
        final_usage = dict(response.usage_metadata)

    # If the LLM determined all slots are already filled from context, it returns
    # "[PROCEED]" — we swallow this and emit nothing to the user (the router will
    # reclassify on the next turn with the full context now visible).
    if final_content.strip().upper() == "[PROCEED]":
        logger.info("[clarifier_node] all slots filled from context — emitting nothing")
        return {
            "clarification_question": "",
            "assistant_parts": state.get("assistant_parts", []),
            "final_usage": final_usage,
        }

    logger.info("[clarifier_node] clarification_question length=%d", len(final_content))

    assistant_part = {"type": "text", "text": final_content, "state": "done"}
    existing_parts: list[dict] = state.get("assistant_parts", [])

    return {
        "clarification_question": final_content,
        "assistant_parts": existing_parts + [assistant_part],
        "final_usage": final_usage,
    }
