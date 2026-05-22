"""OpenTelemetry spans for LangChain / MCP tool invocations."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from opentelemetry import trace

_tracer = trace.get_tracer("ai_chatbot.tools")


async def invoke_tool_with_span(
    tool: Callable[..., Any],
    tool_args: dict[str, Any],
    *,
    tool_name: str,
    graph_node: str,
) -> Any:
    """Run ``tool.ainvoke`` under a ``chatbot.tool.<name>`` parent span."""
    attributes = {
        "chatbot.tool.name": tool_name,
        "chatbot.graph.node": graph_node,
    }
    with _tracer.start_as_current_span(f"chatbot.tool.{tool_name}", attributes=attributes):
        return await tool.ainvoke(tool_args)
