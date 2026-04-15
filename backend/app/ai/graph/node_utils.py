"""Shared utilities for LangGraph pipeline nodes.

Provides a reusable ReAct-style tool call loop used by both the research node
(full data retrieval) and the explain node (metadata-only retrieval).
"""

import logging
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, ToolMessage

from app.ai.observability.token_usage import append_llm_usage_fallback

from .graph_debug_log import log_llm_messages_preview
from .graph_tool_notify import notify_tool_end, notify_tool_start

logger = logging.getLogger(__name__)


async def run_tool_loop(
    *,
    llm: Any,
    messages: list[BaseMessage],
    tool_map: dict[str, Any],
    max_iterations: int,
    state: dict,
    graph_node: str,
) -> tuple[str, dict | None]:
    """Run a ReAct-style tool call loop until the LLM stops requesting tools.

    Args:
        llm:            LangChain LLM already bound with tools (``llm.bind_tools(...)``).
        messages:       Initial message list (system + history). Modified in-place.
        tool_map:       Dict mapping tool name → LangChain tool callable.
        max_iterations: Maximum number of LLM call rounds (safety cap).
        state:          Pipeline state dict (used for usage tracking and SSE queue).
        graph_node:     LangGraph node name (used for SSE tool notifications and logging).

    Returns:
        (final_content, final_usage):
          - final_content: the last plain-text LLM response (the research/explain packet)
          - final_usage:   token usage dict from the last response, or None
    """
    final_content: str = ""
    final_usage: dict | None = None

    for iteration in range(max_iterations):
        logger.info("[%s] LLM call iteration=%d", graph_node, iteration)
        log_llm_messages_preview(
            message_id=str(state.get("message_id", "")),
            graph_node=graph_node,
            messages=messages,
            iteration=iteration,
        )
        response: AIMessage = await llm.ainvoke(messages)
        append_llm_usage_fallback(state.get("_usage_fallback_bucket"), response)
        messages.append(response)
        final_content = response.content or ""

        # Capture usage metadata if available
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            final_usage = {
                "input_tokens": response.usage_metadata.get("input_tokens", 0),
                "output_tokens": response.usage_metadata.get("output_tokens", 0),
            }

        if not response.tool_calls:
            logger.info(
                "[%s] no more tool calls after %d iterations — done",
                graph_node,
                iteration + 1,
            )
            break

        # Execute each tool call and feed results back
        for tc in response.tool_calls:
            tool_name: str = tc["name"]
            tool_args: dict = tc.get("args", {})
            tool_call_id: str = tc.get("id", tool_name)

            logger.info("[%s] calling tool=%s", graph_node, tool_name)
            tool = tool_map.get(tool_name)
            await notify_tool_start(
                state,
                graph_node=graph_node,
                tool_name=tool_name,
                tool_call_id=tool_call_id,
                tool_input=tool_args,
            )
            if tool is None:
                tool_result = f"Tool '{tool_name}' not available."
                logger.warning("[%s] unknown tool=%s", graph_node, tool_name)
            else:
                try:
                    tool_result = await tool.ainvoke(tool_args)
                except Exception as exc:
                    tool_result = f"Tool '{tool_name}' error: {exc}"
                    logger.error("[%s] tool=%s error: %s", graph_node, tool_name, exc)
            await notify_tool_end(
                state,
                graph_node=graph_node,
                tool_name=tool_name,
                tool_call_id=tool_call_id,
                output=tool_result,
            )
            messages.append(ToolMessage(content=str(tool_result), tool_call_id=tool_call_id))
    else:
        logger.warning("[%s] reached max_iterations=%d", graph_node, max_iterations)

    return final_content, final_usage
