"""Explain node: answers definitional and methodology questions using metadata tools.

Tools available: a subset of data-retrieval tools — search, metadata, and list only.
No data-row retrieval (data360_get_data, data360_get_disaggregation, etc.) and no viz tools.

The node produces a RESEARCH PACKET in the same format as research_node so the
narrator can consume it without modification.  Token-budget trimming uses the
"explain" budget which is lower than research (metadata calls are cheap).
"""

import logging

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.ai.prompts import get_explain_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..node_utils import run_tool_loop
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

# Tools the explain node is allowed to call (metadata-only subset)
EXPLAIN_TOOL_NAMES: frozenset[str] = frozenset(
    {
        "data360_search_indicators",
        "data360_get_metadata",
        "data360_list_indicators",
    }
)

MAX_TOOL_ITERATIONS = 5  # metadata calls are cheap; rarely need more than 2 rounds


async def explain_node(state: ChatPipelineState) -> dict:
    """Answer definitional/methodology questions and return a metadata research packet.

    Runs a lightweight ReAct tool loop restricted to metadata tools (no data rows,
    no viz).  The resulting packet is handed to the narrator for formatting.

    The LLM uses ``streaming=True`` so ``graph.astream_events()`` emits token-level
    events tagged with ``langgraph_node="explain"`` — the SSE bridge maps these to
    the data-thinking envelope (hidden in the collapsible panel, same as research).

    Returns state updates for ``research_packet``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    all_data_tools: list = state.get("tool_set", {}).get("mcp_data", {}).get("langchain_tools", [])

    # Filter to metadata-only tools
    explain_tools = [t for t in all_data_tools if t.name in EXPLAIN_TOOL_NAMES]
    if not explain_tools:
        logger.warning("[explain_node] no explain tools available — falling back to empty packet")
        return {"research_packet": "No metadata tools available."}

    llm = get_chat_llm(model_type, streaming=True).bind_tools(explain_tools)
    language: str = state.get("detected_language", "") or ""
    system_prompt: str = get_explain_system_prompt(language=language)

    history = openai_to_langchain(state.get("openai_messages", []))

    # Inject session summary so the agent retains context across long conversations.
    session_summary: str = state.get("session_summary", "") or ""
    if session_summary:
        history = [HumanMessage(content=f"[CONVERSATION SUMMARY]\n{session_summary}")] + history

    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="explain",
    )

    tool_map = {t.name: t for t in explain_tools}
    # require_tool_before_finish: model cannot emit the final packet until search has run once.
    final_content, _, _ = await run_tool_loop(
        llm=llm,
        messages=messages,
        tool_map=tool_map,
        max_iterations=MAX_TOOL_ITERATIONS,
        state=state,
        graph_node="explain",
        collect_tool_results=False,
        require_tool_before_finish="data360_search_indicators",
    )

    logger.info("[explain_node] research_packet length=%d", len(final_content))
    return {"research_packet": final_content}
