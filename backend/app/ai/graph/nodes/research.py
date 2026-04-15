"""Research node (Planner): retrieves Data360 data and produces a research packet.

Tools available: data-retrieval MCP tools only (no viz — that's narrator's job).
The node runs a ReAct-style tool call loop (via ``run_tool_loop``) until the LLM
stops requesting tools, then returns the final assistant content as ``research_packet``
for the narrator.

Token-budget trimming is applied before the loop so the planner never exceeds its
context limit even in long multi-turn conversations.
"""

import logging

from langchain_core.messages import BaseMessage, SystemMessage

from app.ai.prompts import get_thinking_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..node_utils import run_tool_loop
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 15  # safety cap on planner tool call rounds


async def research_node(state: ChatPipelineState) -> dict:
    """Run the Research Planner and return the research packet.

    Executes a ReAct-style tool call loop:
    1. Call the LLM with data-retrieval tools.
    2. If the response contains tool calls, execute them and feed results back.
    3. Repeat until the LLM produces a plain text response (the research packet).

    The LLM is configured with ``streaming=True`` so that ``graph.astream_events()``
    in the SSE bridge receives token-level ``on_chat_model_stream`` events tagged
    with ``langgraph_node="research"`` — which the bridge maps to data-thinking SSE.

    Returns state updates for ``research_packet``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    data_tools: list = state.get("tool_set", {}).get("mcp_data", {}).get("langchain_tools", [])

    llm = get_chat_llm(model_type, streaming=True).bind_tools(data_tools)
    system_prompt: str = get_thinking_system_prompt()

    history = openai_to_langchain(state.get("openai_messages", []))
    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="research",
    )

    tool_map = {t.name: t for t in data_tools}
    final_content, _ = await run_tool_loop(
        llm=llm,
        messages=messages,
        tool_map=tool_map,
        max_iterations=MAX_TOOL_ITERATIONS,
        state=state,
        graph_node="research",
    )

    logger.info("[research_node] research_packet length=%d", len(final_content))
    return {"research_packet": final_content}
