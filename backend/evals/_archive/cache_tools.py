"""
CLI script to cache MCP tool definitions from a live server.

Usage:
    cd backend/
    MCP_SERVER_URL=http://localhost:8021/sse PYTHONPATH=. .venv/bin/python -m evals.cache_tools
"""

from __future__ import annotations

import asyncio
import json
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

_CACHE_DIR = Path(__file__).parent / ".cache"
_TOOLS_CACHE = _CACHE_DIR / "tool_definitions.json"


async def main():
    from app.ai.mcp_tools.data360_mcp import get_mcp_tools

    logger.info("Fetching tool definitions from live MCP server...")
    try:
        tools = await get_mcp_tools()
        _CACHE_DIR.mkdir(parents=True, exist_ok=True)
        _TOOLS_CACHE.write_text(json.dumps(tools, indent=2, default=str))
        logger.info("Cached %d tools to %s", len(tools), _TOOLS_CACHE)

        for tool in tools:
            func = tool.get("function", tool)
            name = func.get("name", "?")
            desc = func.get("description", "")[:80]
            logger.info("  - %s: %s", name, desc)

    except Exception as e:
        logger.error("Failed: %s", e)
        logger.error("Set MCP_SERVER_URL=http://localhost:8021/sse in env")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
