"""
DeepEval built-in MCP metrics wrapper.

Provides convenience functions for setting up DeepEval's native
MCPUseMetric and MCPTaskCompletionMetric with the Data360 MCP server.
"""

from __future__ import annotations

from typing import Any

from deepeval.metrics import MCPTaskCompletionMetric, MCPUseMetric
from evals.mcp_server_def import get_data360_mcp_server


def create_mcp_use_metric(
    tools: list[dict[str, Any]] | None = None,
    threshold: float = 0.5,
    model: str | None = None,
) -> MCPUseMetric:
    """
    Create an MCPUseMetric configured for Data360.

    This LLM-as-judge metric evaluates:
    - How well the LLM leveraged its MCP capabilities
    - Correctness of arguments generated for tool calls
    Final score = min(capability_score, argument_score)
    """
    mcp_server = get_data360_mcp_server(tools=tools)
    kwargs: dict[str, Any] = {
        "mcp_servers": [mcp_server],
        "threshold": threshold,
    }
    if model:
        kwargs["model"] = model
    return MCPUseMetric(**kwargs)


def create_mcp_task_completion_metric(
    tools: list[dict[str, Any]] | None = None,
    threshold: float = 0.5,
    model: str | None = None,
) -> MCPTaskCompletionMetric:
    """
    Create an MCPTaskCompletionMetric configured for Data360.

    This LLM-as-judge metric evaluates whether the LLM achieved
    the user's stated goal using the available MCP tools.
    """
    mcp_server = get_data360_mcp_server(tools=tools)
    kwargs: dict[str, Any] = {
        "mcp_servers": [mcp_server],
        "threshold": threshold,
    }
    if model:
        kwargs["model"] = model
    return MCPTaskCompletionMetric(**kwargs)
