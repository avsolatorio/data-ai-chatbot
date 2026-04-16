"""Summarizer node: condenses long conversation history into a rolling session summary.

Only fires when ``len(openai_messages) > SUMMARIZE_THRESHOLD`` (= 20) for the first
summary, or when ``new_messages_count >= SUMMARIZE_INCREMENT`` (= 8) for subsequent
incremental updates.  Non-streaming (streaming=False) — no SSE events are expected
from this node.

Returns ``{"session_summary": <text>, "summarized_message_count": <int>}`` or ``{}``
if below threshold.
"""

import logging

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.ai.observability.token_usage import append_llm_usage_fallback
from app.ai.prompts import get_summarizer_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..message_utils import openai_to_langchain
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

SUMMARIZE_THRESHOLD = 20  # only summarize when history exceeds this many messages (first time)
SUMMARIZE_INCREMENT = 8  # re-summarize every 8 new messages after the first summary
_HISTORY_WINDOW = 30  # how many recent messages to pass to the summarizer


async def summarizer_node(state: ChatPipelineState) -> dict:
    """Condense long conversation history into a rolling session_summary.

    First summarization fires when len(openai_messages) > SUMMARIZE_THRESHOLD.
    Subsequent summarizations fire when new_messages_count >= SUMMARIZE_INCREMENT.

    If an existing summary is present, only the new messages (since the last
    summarization) are passed to the LLM, together with the existing summary as a
    [PREVIOUS SUMMARY] prefix HumanMessage.

    Returns:
        ``{"session_summary": text, "summarized_message_count": int}`` if summarization
        ran, else ``{}``.
    """
    openai_messages: list[dict] = state.get("openai_messages", [])
    messages_count = len(openai_messages)

    existing_summary: str = state.get("session_summary", "") or ""
    summarized_count: int = state.get("summarized_message_count", 0) or 0
    new_messages_count: int = messages_count - summarized_count

    if not existing_summary:
        # No prior summary — only fire when history exceeds initial threshold
        if messages_count <= SUMMARIZE_THRESHOLD:
            logger.info(
                "[summarizer_node] history_len=%d ≤ threshold=%d — skipping",
                messages_count,
                SUMMARIZE_THRESHOLD,
            )
            return {}
    else:
        # Have a prior summary — only re-summarize when enough new messages have arrived
        if new_messages_count < SUMMARIZE_INCREMENT:
            logger.info(
                "[summarizer_node] new_messages=%d < increment=%d — skipping (existing summary kept)",
                new_messages_count,
                SUMMARIZE_INCREMENT,
            )
            return {}

    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    system_prompt: str = get_summarizer_system_prompt()

    if existing_summary:
        # Incremental path: prepend existing summary, then pass only new messages
        new_slice = openai_messages[summarized_count:]
        recent = new_slice[-_HISTORY_WINDOW:]
        history: list[BaseMessage] = openai_to_langchain(recent)
        messages: list[BaseMessage] = (
            [SystemMessage(content=system_prompt)]
            + [HumanMessage(content=f"[PREVIOUS SUMMARY]\n{existing_summary}")]
            + history
        )
        logger.info(
            "[summarizer_node] incremental: summarized_count=%d new_messages=%d",
            summarized_count,
            len(new_slice),
        )
    else:
        # Initial summarization: pass the last _HISTORY_WINDOW messages as before
        recent = openai_messages[-_HISTORY_WINDOW:]
        history = openai_to_langchain(recent)
        messages = [SystemMessage(content=system_prompt)] + history
        logger.info(
            "[summarizer_node] initial: history_len=%d",
            messages_count,
        )

    llm = get_chat_llm(model_type, streaming=False)
    response = await llm.ainvoke(messages)
    append_llm_usage_fallback(state.get("_usage_fallback_bucket"), response, node="summarizer")
    summary_text: str = response.content or ""

    logger.info(
        "[summarizer_node] history_len=%d → summary_len=%d",
        messages_count,
        len(summary_text),
    )

    return {
        "session_summary": summary_text,
        "summarized_message_count": messages_count,
    }
