"""Research Agent node: adaptive data retrieval for all query types.

Replaces the former transformer → scout → planner → research → recovery chain.
The agent classifies the query internally (Step 0) and adapts its tool call
depth to the question complexity — from simple point lookups (2-3 calls) to
full analytical decompositions (up to 8 calls).

Claim tags on every observation value ensure PCN verifiability.
"""

import logging

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.ai.prompts import get_research_agent_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..node_utils import run_tool_loop
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 10  # hard cap; Step 0 path budgets are enforced by the prompt


async def research_node(state: ChatPipelineState) -> dict:
    """Run the adaptive Research Agent and return the research packet.

    Executes a ReAct-style tool call loop. The agent classifies the query
    in Step 0 (no tool call) and then uses path-appropriate tool budgets.

    streaming=True so graph.astream_events() receives token-level events
    tagged with langgraph_node="research" — the SSE bridge maps these to
    the data-thinking panel.

    Returns state updates for research_packet.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    data_tools: list = state.get("tool_set", {}).get("mcp_data", {}).get("langchain_tools", [])

    if not data_tools:
        logger.warning(
            "[research_node] no MCP data tools available — "
            "MCP server may be unreachable. Returning empty packet."
        )
        return {
            "research_packet": (
                "### NO_DATA:\n"
                "MCP data tools are currently unavailable (server unreachable or not configured). "
                "No data could be retrieved for this query."
            )
        }

    llm = get_chat_llm(model_type, streaming=True).bind_tools(data_tools)
    system_prompt: str = get_research_agent_system_prompt()

    history = openai_to_langchain(state.get("openai_messages", []))

    # Inject session summary so the agent has full context even when conversation
    # history has been trimmed (e.g. country/topic established many turns ago).
    session_summary: str = state.get("session_summary", "") or ""
    if session_summary:
        history = [HumanMessage(content=f"[CONVERSATION SUMMARY]\n{session_summary}")] + history

    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="research",
    )

    tool_map = {t.name: t for t in data_tools}
    final_content, _, tool_results = await run_tool_loop(
        llm=llm,
        messages=messages,
        tool_map=tool_map,
        max_iterations=MAX_TOOL_ITERATIONS,
        state=state,
        graph_node="research",
        collect_tool_results=True,
    )

    logger.info(
        "[research_node] research_packet length=%d tool_results=%d",
        len(final_content),
        len(tool_results),
    )
    return {
        "research_packet": final_content,
        "research_tool_results": tool_results,
    }
