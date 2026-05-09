"""Quick Answer node: streamlined data retrieval for simple, well-specified questions.

Handles PATH A (point lookup), simple PATH B (two-country/two-year comparison), and
simple PATH C (single-indicator trend) questions where the answer can be obtained with
1–3 tool calls and no analytical decomposition is needed.

Differences from research_node:
  - Uses a shorter prompt (get_quick_answer_system_prompt) with no CONCEPT VOCABULARY.
  - Hard cap of 3 tool call iterations (vs 10 for research).
  - Sets response_mode="quick" in state so the narrator produces minimal prose.
  - Preferred tools: data360_summarize_data, data360_compare_countries,
    data360_rank_countries, data360_get_data — whichever covers the question in fewest calls.
"""

import logging

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.ai.prompts import get_quick_answer_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..node_utils import run_tool_loop
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 3  # quick path: 1-3 tool calls only


async def quick_answer_node(state: ChatPipelineState) -> dict:
    """Run a minimal tool loop for simple data questions.

    Uses the same ReAct-style tool loop as research_node but with a much
    shorter prompt and a hard cap of 3 iterations.  Sets response_mode="quick"
    so the narrator produces only a brief bridging sentence rather than full
    analytical prose — the visual weight is carried by the aggregation renderers
    (SummarizeData, CompareCountries, RankCountries) already present in the UI.

    streaming=True so graph.astream_events() receives token-level events tagged
    with langgraph_node="quick_answer" — the SSE bridge routes these to the
    data-thinking panel (same as "research").

    Returns state updates for research_packet, research_tool_results, and
    response_mode.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    data_tools: list = state.get("tool_set", {}).get("mcp_data", {}).get("langchain_tools", [])

    if not data_tools:
        logger.warning(
            "[quick_answer_node] no MCP data tools available — falling back to empty packet."
        )
        return {
            "research_packet": (
                "### NO_DATA:\n"
                "MCP data tools are currently unavailable. No data could be retrieved."
            ),
            "research_tool_results": [],
            "response_mode": "quick",
        }

    llm = get_chat_llm(model_type, streaming=True).bind_tools(data_tools)
    system_prompt: str = get_quick_answer_system_prompt()

    history = openai_to_langchain(state.get("openai_messages", []))

    # Inject session summary for context (country/indicator carry-forward).
    session_summary: str = state.get("session_summary", "") or ""
    if session_summary:
        history = [HumanMessage(content=f"[CONVERSATION SUMMARY]\n{session_summary}")] + history

    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="research",  # use research budget — same token window
    )

    tool_map = {t.name: t for t in data_tools}
    final_content, _, tool_results = await run_tool_loop(
        llm=llm,
        messages=messages,
        tool_map=tool_map,
        max_iterations=MAX_TOOL_ITERATIONS,
        state=state,
        graph_node="quick_answer",
        collect_tool_results=True,
    )

    logger.info(
        "[quick_answer_node] research_packet length=%d tool_results=%d",
        len(final_content),
        len(tool_results),
    )
    return {
        "research_packet": final_content,
        "research_tool_results": tool_results,
        "response_mode": "quick",
    }
