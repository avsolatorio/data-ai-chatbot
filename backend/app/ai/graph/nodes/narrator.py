"""Narrator node (Writer): converts the research packet into the user-facing answer.

Tools available: viz MCP tools (get_viz_spec, get_multi_indicator_viz_spec,
get_supported_chart_types) + local document tools (createDocument, updateDocument).

The narrator receives the research_packet from research_node and crafts the final
response.  It may optionally call viz tools to generate chart URLs when the packet
indicates the user asked for a chart.

Token-budget trimming is applied to the conversation history injected as context.
``astream_events()`` tokens from this node are tagged with ``langgraph_node="narrator"``
and the SSE bridge maps them to plain text-delta events (visible to the user).
"""

import json
import logging
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, SystemMessage, ToolMessage

from app.ai.observability.token_usage import append_llm_usage_fallback
from app.ai.prompts import get_system_prompt
from app.config import ModelType

from ..graph_debug_log import log_llm_messages_preview
from ..graph_tool_notify import notify_tool_end, notify_tool_start
from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 5  # narrator mainly calls viz tools; few iterations needed


async def narrator_node(state: ChatPipelineState) -> dict:
    """Generate the user-facing response from the research packet.

    The research_packet is embedded in the system message (trusted context) so
    it is not scanned by Azure Prompt Shields as indirect injection.
    The narrator may call viz tools to generate chart URLs.

    ``streaming=True`` ensures ``graph.astream_events()`` receives token-level
    events tagged with ``langgraph_node="narrator"`` for the SSE bridge.

    Returns state updates for ``assistant_parts`` and ``final_usage``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    tool_set: dict = state.get("tool_set", {})
    viz_tools: list = tool_set.get("mcp_viz", {}).get("langchain_tools", [])
    local_tools: list = tool_set.get("local", {}).get("langchain_tools", [])
    narrator_tools: list = viz_tools + local_tools

    try:
        mt = ModelType(model_type)
    except ValueError:
        mt = ModelType.CHAT_MODEL

    language: str = state.get("detected_language", "") or ""
    system_prompt: str = get_system_prompt(
        selected_chat_model=mt, request_hints=None, language=language
    )
    llm = get_chat_llm(model_type, streaming=True).bind_tools(narrator_tools)

    # Build message list: trimmed history only (research packet goes into system message)
    history = openai_to_langchain(state.get("openai_messages", []))
    research_packet: str = state.get("research_packet", "")
    tool_results: list[dict] = state.get("research_tool_results") or []

    if research_packet or tool_results:
        # Build the research context block that is prepended to the system prompt.
        # Placed in the system message (not a HumanMessage) to avoid Azure Prompt Shields.
        #
        # Structure:
        #   1. RAW TOOL RESULTS — the actual data values with claim IDs, as returned
        #      by the MCP tools. Narrator reads numbers directly from here; no
        #      intermediate transcription through an extra LLM pass.
        #   2. RESEARCH AGENT ROUTING PACKET — PATH classification, indicator
        #      selection rationale, GAPS, EVIDENCE NOTES, VIZ params, API URL.
        #      This is the research agent's intelligence layer.
        context_parts: list[str] = []

        if tool_results:
            # Emit only data-bearing tools (get_data, get_metadata) — skip
            # search/codelist calls which are lookup scaffolding, not content.
            data_tools = frozenset(
                {
                    "data360_get_data",
                    "data360_get_metadata",
                    "data360_list_indicators",
                }
            )
            data_outputs = [r for r in tool_results if r.get("tool_name") in data_tools]
            if data_outputs:
                tool_block_lines = [
                    "─" * 60,
                    "RAW TOOL RESULTS",
                    "These are the exact outputs returned by the MCP data tools.",
                    "All numeric values and claim IDs come from here — use them directly.",
                    "─" * 60,
                    "",
                ]
                for i, r in enumerate(data_outputs, 1):
                    tool_block_lines.append(f"[Tool {i}: {r['tool_name']}]")
                    args_str = ", ".join(f"{k}={v!r}" for k, v in r.get("tool_args", {}).items())
                    if args_str:
                        tool_block_lines.append(f"Args: {args_str}")
                    output = r.get("output", "")
                    # Pretty-print JSON if the output is structured
                    if isinstance(output, (dict, list)):
                        tool_block_lines.append(json.dumps(output, ensure_ascii=False, indent=2))
                    else:
                        tool_block_lines.append(str(output))
                    tool_block_lines.append("")
                tool_block_lines += [
                    "─" * 60,
                    "END OF RAW TOOL RESULTS",
                    "─" * 60,
                    "",
                ]
                context_parts.append("\n".join(tool_block_lines))

        if research_packet:
            routing_block = (
                "─" * 60 + "\n"
                "RESEARCH AGENT ROUTING PACKET\n"
                "PATH classification, indicator selection, gaps, and methodology notes.\n"
                "This IS the research packet referenced in the instructions below.\n"
                "─" * 60 + "\n\n" + research_packet + "\n\n" + "─" * 60 + "\n"
                "END OF RESEARCH AGENT ROUTING PACKET — rendering instructions follow.\n"
                "─" * 60 + "\n\n"
            )
            context_parts.append(routing_block)

        system_prompt = "".join(context_parts) + system_prompt

    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="narrator",
    )

    tool_map: dict[str, Any] = {t.name: t for t in narrator_tools}
    final_content: str = ""
    final_usage: dict | None = None

    for iteration in range(MAX_TOOL_ITERATIONS):
        logger.info("[narrator_node] LLM call iteration=%d", iteration)
        log_llm_messages_preview(
            message_id=str(state.get("message_id", "")),
            graph_node="narrator",
            messages=messages,
            iteration=iteration,
        )
        response: AIMessage = await llm.ainvoke(messages)
        append_llm_usage_fallback(state.get("_usage_fallback_bucket"), response)
        messages.append(response)
        final_content = response.content or ""

        # Capture usage metadata if available
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            final_usage = dict(response.usage_metadata)

        if not response.tool_calls:
            break

        for tc in response.tool_calls:
            tool_name: str = tc["name"]
            tool_args: dict = tc.get("args", {})
            tool_call_id: str = tc.get("id", tool_name)

            logger.info("[narrator_node] calling tool=%s", tool_name)
            tool = tool_map.get(tool_name)
            await notify_tool_start(
                state,
                graph_node="narrator",
                tool_name=tool_name,
                tool_call_id=tool_call_id,
                tool_input=tool_args,
            )
            if tool is None:
                tool_result = f"Tool '{tool_name}' not available."
            else:
                try:
                    tool_result = await tool.ainvoke(tool_args)
                except Exception as exc:
                    tool_result = f"Tool '{tool_name}' error: {exc}"
                    logger.error("[narrator_node] tool=%s error: %s", tool_name, exc)

            await notify_tool_end(
                state,
                graph_node="narrator",
                tool_name=tool_name,
                tool_call_id=tool_call_id,
                output=tool_result,
            )

            messages.append(ToolMessage(content=str(tool_result), tool_call_id=tool_call_id))
    else:
        logger.warning("[narrator_node] reached MAX_TOOL_ITERATIONS=%d", MAX_TOOL_ITERATIONS)

    logger.info("[narrator_node] final_content length=%d", len(final_content))

    # Build a simple text part for DB persistence
    assistant_part = {"type": "text", "text": final_content, "state": "done"}
    existing_parts: list[dict] = state.get("assistant_parts", [])

    return {
        "assistant_parts": existing_parts + [assistant_part],
        "final_usage": final_usage,
    }
