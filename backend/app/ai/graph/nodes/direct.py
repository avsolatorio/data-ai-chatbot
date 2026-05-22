"""Direct node: fast-path for greetings, small talk, and simple follow-ups.

No MCP tools — only local document tools (if enabled).
Tokens from this node are tagged with ``langgraph_node="direct"`` by LangGraph
and the SSE bridge maps them to plain text-delta events (no thinking panel).
"""

import logging
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, SystemMessage, ToolMessage

from app.ai.observability.token_usage import append_llm_usage_fallback
from app.ai.prompts import get_direct_system_prompt
from app.config import ModelType
from app.observability.tool_spans import invoke_tool_with_span

from ..graph_tool_notify import notify_tool_end, notify_tool_start
from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain, plain_text_from_ai_message_content
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 5  # direct path rarely needs tool calls


async def direct_node(state: ChatPipelineState) -> dict:
    """Generate a direct response without research planning.

    Local document tools are available (createDocument, updateDocument) but
    no MCP data tools.  Uses token-budget trimming with the "direct" budget.

    ``streaming=True`` ensures ``graph.astream_events()`` receives token-level
    events tagged with ``langgraph_node="direct"`` for the SSE bridge.

    Returns state updates for ``assistant_parts`` and ``final_usage``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    local_tools: list = state.get("tool_set", {}).get("local", {}).get("langchain_tools", [])

    llm = get_chat_llm(model_type, streaming=True).bind_tools(local_tools)
    language: str = state.get("detected_language", "") or ""
    system_prompt: str = get_direct_system_prompt(language=language)

    history = openai_to_langchain(state.get("openai_messages", []))
    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="direct",
    )

    tool_map: dict[str, Any] = {t.name: t for t in local_tools}
    final_content: str = ""
    final_usage: dict | None = None

    for iteration in range(MAX_TOOL_ITERATIONS):
        logger.info("[direct_node] LLM call iteration=%d", iteration)
        response: AIMessage = await llm.ainvoke(messages)
        append_llm_usage_fallback(state.get("_usage_fallback_bucket"), response, node="direct")
        messages.append(response)
        final_content = plain_text_from_ai_message_content(getattr(response, "content", None))

        if hasattr(response, "usage_metadata") and response.usage_metadata:
            final_usage = dict(response.usage_metadata)

        if not response.tool_calls:
            break

        for tc in response.tool_calls:
            tool_name: str = tc["name"]
            tool_args: dict = tc.get("args", {})
            tool_call_id: str = tc.get("id", tool_name)

            logger.info("[direct_node] calling tool=%s", tool_name)
            tool = tool_map.get(tool_name)
            await notify_tool_start(
                state,
                graph_node="direct",
                tool_name=tool_name,
                tool_call_id=tool_call_id,
                tool_input=tool_args,
            )
            if tool is None:
                tool_result = f"Tool '{tool_name}' not available."
            else:
                try:
                    tool_result = await invoke_tool_with_span(
                        tool,
                        tool_args,
                        tool_name=tool_name,
                        graph_node="direct",
                    )
                except Exception as exc:
                    tool_result = f"Tool '{tool_name}' error: {exc}"
                    logger.error("[direct_node] tool=%s error: %s", tool_name, exc)

            await notify_tool_end(
                state,
                graph_node="direct",
                tool_name=tool_name,
                tool_call_id=tool_call_id,
                output=tool_result,
            )

            messages.append(ToolMessage(content=str(tool_result), tool_call_id=tool_call_id))
    else:
        logger.warning("[direct_node] reached MAX_TOOL_ITERATIONS=%d", MAX_TOOL_ITERATIONS)

    logger.info("[direct_node] final_content length=%d", len(final_content))

    assistant_part = {"type": "text", "text": final_content, "state": "done"}
    existing_parts: list[dict] = state.get("assistant_parts", [])

    return {
        "assistant_parts": existing_parts + [assistant_part],
        "final_usage": final_usage,
    }
