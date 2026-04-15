"""Recovery node: retries failed research using alternative data strategies.

When the initial research returns an empty or no-data packet, this node analyzes
the failure and attempts alternative approaches (synonym indicators, broader time
ranges, regional aggregates, different databases).

Streaming=True — tool events appear in the data-thinking panel, same as research.
Returns ``{"research_packet": updated_packet, "recovery_attempted": True}``.
"""

import logging

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.ai.prompts import get_recovery_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..node_utils import run_tool_loop
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 8  # recovery may need more iterations than a normal research call


async def recovery_node(state: ChatPipelineState) -> dict:
    """Retry data retrieval when the initial research packet indicates no data was found.

    The full MCP data tool set is available — same as the main research node.
    The failed research_packet (if present) is injected as a HumanMessage so the
    LLM understands what was already tried.

    ``streaming=True`` ensures ``graph.astream_events()`` emits token-level events
    tagged with ``langgraph_node="recovery"`` — the SSE bridge maps these to the
    data-thinking envelope.

    Returns state updates for ``research_packet`` and ``recovery_attempted``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    data_tools: list = state.get("tool_set", {}).get("mcp_data", {}).get("langchain_tools", [])

    if not data_tools:
        logger.warning("[recovery_node] no data tools available — returning failure packet")
        return {
            "research_packet": "Recovery failed: no data tools available.",
            "recovery_attempted": True,
        }

    llm = get_chat_llm(model_type, streaming=True).bind_tools(data_tools)
    system_prompt: str = get_recovery_system_prompt()

    history = openai_to_langchain(state.get("openai_messages", []))

    # Prepend session summary if available
    session_summary: str = state.get("session_summary", "") or ""
    if session_summary:
        history = [HumanMessage(content=f"[SESSION SUMMARY]\n{session_summary}")] + history

    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="recovery",
    )

    # Inject the failed research packet so the LLM knows what was tried
    failed_packet: str = state.get("research_packet", "") or ""
    if failed_packet:
        messages = messages + [
            HumanMessage(
                content=(
                    "[FAILED RESEARCH PACKET — use this to understand what was tried]\n"
                    + failed_packet
                )
            )
        ]

    tool_map = {t.name: t for t in data_tools}
    final_content, _ = await run_tool_loop(
        llm=llm,
        messages=messages,
        tool_map=tool_map,
        max_iterations=MAX_TOOL_ITERATIONS,
        state=state,
        graph_node="recovery",
    )

    logger.info("[recovery_node] recovery_packet length=%d", len(final_content))

    return {
        "research_packet": final_content,
        "recovery_attempted": True,
    }
