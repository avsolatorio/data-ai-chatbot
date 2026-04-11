"""Research node (Planner): retrieves Data360 data and produces a research packet.

Tools available: data-retrieval MCP tools only (no viz — that's narrator's job).
The node runs a ReAct-style tool call loop until the LLM stops requesting tools,
then returns the final assistant content as ``research_packet`` for the narrator.

Token-budget trimming is applied before each LLM call so the planner never
exceeds its context limit even in long multi-turn conversations.
"""

import logging
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, SystemMessage, ToolMessage

from app.ai.prompts import get_thinking_system_prompt
from app.config import ModelType

from ..graph_tool_notify import notify_tool_end, notify_tool_start
from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 15  # safety cap on planner tool call rounds


async def research_node(state: ChatPipelineState) -> dict:
    """Run the Research Planner and return the research packet.

    Executes a multi-step tool call loop:
    1. Call the LLM with data-retrieval tools.
    2. If the response contains tool calls, execute them and feed results back.
    3. Repeat until the LLM produces a plain text response (the research packet).

    The LLM is configured with ``streaming=True`` so that ``graph.astream_events()``
    in the SSE bridge receives token-level ``on_chat_model_stream`` events tagged
    with ``langgraph_node="research"`` — which the bridge maps to data-thinking SSE.

    Returns state updates for ``research_packet`` and ``assistant_parts``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    data_tools: list = state.get("tool_set", {}).get("mcp_data", {}).get("langchain_tools", [])

    llm = get_chat_llm(model_type, streaming=True).bind_tools(data_tools)
    system_prompt: str = get_thinking_system_prompt()

    # Convert conversation history to LangChain messages and trim
    history = openai_to_langchain(state.get("openai_messages", []))
    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="research",
    )

    tool_map: dict[str, Any] = {t.name: t for t in data_tools}
    final_content: str = ""

    for iteration in range(MAX_TOOL_ITERATIONS):
        logger.info("[research_node] LLM call iteration=%d", iteration)
        response: AIMessage = await llm.ainvoke(messages)
        messages.append(response)
        final_content = response.content or ""

        if not response.tool_calls:
            logger.info(
                "[research_node] no more tool calls after %d iterations — done", iteration + 1
            )
            break

        # Execute each tool call and append results
        for tc in response.tool_calls:
            tool_name: str = tc["name"]
            tool_args: dict = tc.get("args", {})
            tool_call_id: str = tc.get("id", tool_name)

            logger.info("[research_node] calling tool=%s", tool_name)
            tool = tool_map.get(tool_name)
            await notify_tool_start(
                state,
                graph_node="research",
                tool_name=tool_name,
                tool_call_id=tool_call_id,
                tool_input=tool_args,
            )
            if tool is None:
                tool_result = f"Tool '{tool_name}' not available."
                logger.warning("[research_node] unknown tool=%s", tool_name)
            else:
                try:
                    tool_result = await tool.ainvoke(tool_args)
                except Exception as exc:
                    tool_result = f"Tool '{tool_name}' error: {exc}"
                    logger.error("[research_node] tool=%s error: %s", tool_name, exc)
            await notify_tool_end(
                state,
                graph_node="research",
                tool_name=tool_name,
                tool_call_id=tool_call_id,
                output=tool_result,
            )

            messages.append(ToolMessage(content=str(tool_result), tool_call_id=tool_call_id))
    else:
        logger.warning("[research_node] reached MAX_TOOL_ITERATIONS=%d", MAX_TOOL_ITERATIONS)

    logger.info("[research_node] research_packet length=%d", len(final_content))
    return {"research_packet": final_content}
