"""
MCPServer definition loader for DeepEval evaluations.

Builds a DeepEval `MCPServer` from the live Data360 MCP tool definitions
or from a cached snapshot, providing the ground truth of available tools
and their schemas for evaluation metrics.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from deepeval.mcp import MCPServer, MCPTool

logger = logging.getLogger(__name__)

# Path for cached tool definitions (avoids requiring a live MCP server)
_CACHE_DIR = Path(__file__).parent / ".cache"
_TOOLS_CACHE = _CACHE_DIR / "tool_definitions.json"


def _tool_dict_to_mcp_tool(tool_def: dict[str, Any]) -> MCPTool:
    """Convert a chatbot-style tool definition dict to a DeepEval MCPTool."""
    func = tool_def.get("function", tool_def)
    return MCPTool(
        name=func["name"],
        description=func.get("description", ""),
        input_schema=func.get("parameters", func.get("inputSchema", {})),
    )


async def load_live_tools() -> list[dict[str, Any]]:
    """Fetch tool definitions from the live MCP server via the chatbot client."""
    from app.ai.mcp_tools.data360_mcp import get_mcp_tools

    return await get_mcp_tools()


async def cache_tool_definitions() -> Path:
    """Fetch live tool definitions and save them as a JSON cache file."""
    tools = await load_live_tools()
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    _TOOLS_CACHE.write_text(json.dumps(tools, indent=2, default=str))
    logger.info("Cached %d tool definitions to %s", len(tools), _TOOLS_CACHE)
    return _TOOLS_CACHE


def load_cached_tools() -> list[dict[str, Any]]:
    """Load tool definitions from the local cache file."""
    if not _TOOLS_CACHE.exists():
        raise FileNotFoundError(
            f"No cached tool definitions found at {_TOOLS_CACHE}. "
            "Run `cache_tool_definitions()` first, or start the MCP server."
        )
    return json.loads(_TOOLS_CACHE.read_text())


def get_data360_mcp_server(
    tools: list[dict[str, Any]] | None = None,
    server_name: str = "data360-mcp",
) -> MCPServer:
    """
    Build a DeepEval MCPServer from tool definitions.

    Args:
        tools: Optional list of tool definition dicts. If None, loads from cache.
        server_name: Name for the MCPServer instance.

    Returns:
        MCPServer ready for use in DeepEval test cases.
    """
    if tools is None:
        tools = load_cached_tools()

    mcp_tools = [_tool_dict_to_mcp_tool(t) for t in tools]

    return MCPServer(
        name=server_name,
        tools=mcp_tools,
    )


# Convenience: list of all known Data360 MCP tool names
DATA360_TOOL_NAMES = [
    "data360_search_indicators",
    "data360_get_metadata",
    "data360_get_data",
    "data360_get_disaggregation",
    "data360_find_codelist_value",
    "data360_list_indicators",
    "data360_get_data_api_url",
    "data360_get_viz_spec",
    "data360_get_supported_chart_types",
]
