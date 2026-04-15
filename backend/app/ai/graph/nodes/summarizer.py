"""Summarizer node: condenses long conversation history into a rolling session summary.

Only fires when ``len(openai_messages) > SUMMARIZE_THRESHOLD`` (= 20).
Non-streaming (streaming=False) — no SSE events are expected from this node.
Returns ``{"session_summary": <text>}`` or ``{}`` if below threshold.
"""

import logging

from langchain_core.messages import BaseMessage, SystemMessage

from app.ai.prompts import get_summarizer_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..message_utils import openai_to_langchain
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

SUMMARIZE_THRESHOLD = 20  # only summarize when history exceeds this many messages
_HISTORY_WINDOW = 30  # how many recent messages to pass to the summarizer


async def summarizer_node(state: ChatPipelineState) -> dict:
    """Condense long conversation history into a rolling session_summary.

    If the conversation history is short (below SUMMARIZE_THRESHOLD), this node
    is a no-op and returns an empty dict.  When history is long, it calls the
    LLM once (non-streaming) and returns the summary wrapped in
    ``{"session_summary": <text>}``.

    The summary is later injected by scout / research / narrator nodes as a
    ``[SESSION SUMMARY]`` HumanMessage prepended to their trimmed histories,
    giving those nodes awareness of earlier turns that were dropped by trimming.

    Returns:
        ``{"session_summary": text}`` if summarization ran, else ``{}``.
    """
    openai_messages: list[dict] = state.get("openai_messages", [])
    history_len = len(openai_messages)

    if history_len <= SUMMARIZE_THRESHOLD:
        logger.info(
            "[summarizer_node] history_len=%d ≤ threshold=%d — skipping",
            history_len,
            SUMMARIZE_THRESHOLD,
        )
        return {}

    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    system_prompt: str = get_summarizer_system_prompt()

    # Take the last _HISTORY_WINDOW messages; do NOT trim — summarizing is the point
    recent = openai_messages[-_HISTORY_WINDOW:]
    history: list[BaseMessage] = openai_to_langchain(recent)
    messages: list[BaseMessage] = [SystemMessage(content=system_prompt)] + history

    llm = get_chat_llm(model_type, streaming=False)
    response = await llm.ainvoke(messages)
    summary_text: str = response.content or ""

    logger.info(
        "[summarizer_node] history_len=%d → summary_len=%d",
        history_len,
        len(summary_text),
    )

    return {"session_summary": summary_text}
