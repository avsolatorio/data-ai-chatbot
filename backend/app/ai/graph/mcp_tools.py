"""LangGraph MCP tool partitions (data vs viz).

Tools are loaded once via ``langchain-mcp-adapters`` in
:mod:`app.ai.mcp_tools.data360_mcp` (shared bundle cache).
"""

from __future__ import annotations

import logging

from app.ai.mcp_tools.data360_mcp import get_mcp_tool_bundle
from app.ai.mcp_tools.partitions import DATA_TOOL_NAMES, VIZ_TOOL_NAMES

logger = logging.getLogger(__name__)

__all__ = ["DATA_TOOL_NAMES", "VIZ_TOOL_NAMES", "get_langchain_mcp_tools"]


async def get_langchain_mcp_tools() -> tuple[list, list]:
    """Return (data_tools, viz_tools) for research_node and narrator_node."""
    lc_all, _defs = await get_mcp_tool_bundle()
    data_tools = [t for t in lc_all if t.name in DATA_TOOL_NAMES]
    viz_tools = [t for t in lc_all if t.name in VIZ_TOOL_NAMES]
    logger.info(
        "[mcp_tools] partitioned LangChain MCP tools: data=%d viz=%d total=%d",
        len(data_tools),
        len(viz_tools),
        len(lc_all),
    )
    return data_tools, viz_tools
