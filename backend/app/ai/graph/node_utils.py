"""Shared utilities for LangGraph pipeline nodes.

Provides a reusable ReAct-style tool call loop used by both the research node
(full data retrieval) and the explain node (metadata-only retrieval).
"""

import logging
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage

from app.ai.observability.token_usage import append_llm_usage_fallback

from .graph_debug_log import log_llm_messages_preview
from .graph_tool_notify import notify_tool_end, notify_tool_start
from .message_utils import plain_text_from_ai_message_content

logger = logging.getLogger(__name__)


async def run_tool_loop(
    *,
    llm: Any,
    messages: list[BaseMessage],
    tool_map: dict[str, Any],
    max_iterations: int,
    state: dict,
    graph_node: str,
    collect_tool_results: bool = False,
    require_tool_before_finish: str | None = None,
) -> tuple[str, dict | None, list[dict]]:
    """Run a ReAct-style tool call loop until the LLM stops requesting tools.

    Args:
        llm:                  LangChain LLM already bound with tools.
        messages:             Initial message list (system + history). Modified in-place.
        tool_map:             Dict mapping tool name → LangChain tool callable.
        max_iterations:       Maximum number of LLM call rounds (safety cap).
        state:                Pipeline state dict (usage tracking and SSE queue).
        graph_node:           LangGraph node name (SSE notifications and logging).
        collect_tool_results: When True, accumulate raw tool outputs for the caller.
                              Used by research_node to pass results directly to narrator.
        require_tool_before_finish: If set, the model may not finish with plain text until
            this tool name has been executed at least once. If it tries to stop early,
            the last assistant message is removed and a reminder is injected (explain_node).

    Returns:
        (final_content, final_usage, tool_results):
          - final_content:  the last plain-text LLM response (routing/metadata packet)
          - final_usage:    token usage dict from the last response, or None
          - tool_results:   list of {"tool_name", "tool_args", "output"} dicts
                            (empty list when collect_tool_results=False)
    """
    final_content: str = ""
    final_usage: dict | None = None
    tool_results: list[dict] = []
    tools_executed: set[str] = set()

    for iteration in range(max_iterations):
        logger.info("[%s] LLM call iteration=%d", graph_node, iteration)
        log_llm_messages_preview(
            message_id=str(state.get("message_id", "")),
            graph_node=graph_node,
            messages=messages,
            iteration=iteration,
        )
        response: AIMessage = await llm.ainvoke(messages)
        append_llm_usage_fallback(state.get("_usage_fallback_bucket"), response, node=graph_node)
        messages.append(response)
        final_content = plain_text_from_ai_message_content(getattr(response, "content", None))

        # Capture full usage metadata if available
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            um = response.usage_metadata
            final_usage = (
                dict(um)
                if isinstance(um, dict)
                else um.model_dump(exclude_none=True)
                if hasattr(um, "model_dump")
                else {
                    "input_tokens": getattr(um, "input_tokens", 0) or 0,
                    "output_tokens": getattr(um, "output_tokens", 0) or 0,
                    "total_tokens": getattr(um, "total_tokens", 0) or 0,
                    "cache_read_input_tokens": getattr(um, "cache_read_input_tokens", 0) or 0,
                    "reasoning_tokens": getattr(um, "reasoning_tokens", 0) or 0,
                }
            )

        if not response.tool_calls:
            if require_tool_before_finish and require_tool_before_finish not in tools_executed:
                logger.info(
                    "[%s] model finished without tools but %s not run yet — retry",
                    graph_node,
                    require_tool_before_finish,
                )
                messages.pop()
                messages.append(
                    HumanMessage(
                        content=(
                            f"You must call `{require_tool_before_finish}` at least once "
                            "with the user's term or topic before writing the RESEARCH PACKET. "
                            "Do not answer from memory."
                        )
                    )
                )
                continue
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
            tools_executed.add(tool_name)

            if collect_tool_results:
                tool_results.append(
                    {
                        "tool_name": tool_name,
                        "tool_args": tool_args,
                        "output": tool_result,
                    }
                )
    else:
        logger.warning("[%s] reached max_iterations=%d", graph_node, max_iterations)

    if require_tool_before_finish and require_tool_before_finish not in tools_executed:
        logger.warning(
            "[%s] iteration cap reached without required tool=%s",
            graph_node,
            require_tool_before_finish,
        )
        final_content = (
            "### RESEARCH PACKET:\n"
            "- User intent: Metadata lookup was required but the search tool did not run in time.\n"
            "### NO_DATA:\n"
            "Repeat or narrow the question; do not invent definitions without Data360 metadata.\n"
        )

    return final_content, final_usage, tool_results
