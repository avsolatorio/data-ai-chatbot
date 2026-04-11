import asyncio
import logging
import time
import traceback

import json5
from langchain_core.tools import BaseTool
from langchain_core.utils.function_calling import convert_to_openai_tool

from ._client import get_mcp_client
from .adapter_factory import MCP_DATA360_SERVER_NAME, create_multiserver_mcp_client
from .normalize import normalize_mcp_tool_arguments

logger = logging.getLogger(__name__)

# NOTE: Implement outputSchema for MCP tools. https://github.com/modelcontextprotocol/modelcontextprotocol/pull/371

# Shared cache: (monotonic_ts, (langchain_tools, openai_definitions))
_mcp_bundle_cache: tuple[float, tuple[list[BaseTool], list[dict]]] | None = None
_bundle_lock = asyncio.Lock()


async def load_mcp_tool_bundle_uncached() -> tuple[list[BaseTool], list[dict]]:
    """Fetch LangChain MCP tools via langchain-mcp-adapters and build OpenAI-style definitions."""
    client = create_multiserver_mcp_client()
    tools = await client.get_tools(server_name=MCP_DATA360_SERVER_NAME)
    openai_definitions: list[dict] = []
    for t in tools:
        spec = convert_to_openai_tool(t)
        openai_definitions.append({**spec, "strict": True})
    logger.info(
        "[mcp] load_mcp_tool_bundle_uncached count=%d server=%s",
        len(tools),
        MCP_DATA360_SERVER_NAME,
    )
    return tools, openai_definitions


async def get_mcp_tool_bundle() -> tuple[list[BaseTool], list[dict]]:
    """Return (all LangChain MCP tools, OpenAI tool definitions) with TTL cache."""
    global _mcp_bundle_cache
    from app.config import get_mcp_settings

    settings = get_mcp_settings()
    ttl = settings.tools_cache_ttl_seconds
    async with _bundle_lock:
        now = time.monotonic()
        if _mcp_bundle_cache is not None and ttl > 0 and (now - _mcp_bundle_cache[0]) < ttl:
            logger.info(
                "[mcp] get_mcp_tool_bundle cache hit age=%.0fs",
                now - _mcp_bundle_cache[0],
            )
            return _mcp_bundle_cache[1]

    tools, defs = await load_mcp_tool_bundle_uncached()
    async with _bundle_lock:
        now2 = time.monotonic()
        if _mcp_bundle_cache is not None and ttl > 0 and (now2 - _mcp_bundle_cache[0]) < ttl:
            return _mcp_bundle_cache[1]
        _mcp_bundle_cache = (time.monotonic(), (tools, defs))
        return tools, defs


def invalidate_mcp_tool_bundle_cache() -> None:
    """Clear in-process MCP tool bundle (e.g. after server deploy)."""
    global _mcp_bundle_cache
    _mcp_bundle_cache = None


async def main():
    client = get_mcp_client()
    async with client:
        await client.ping()
        tools = await client.list_tools()
        print(tools)
        result = await client.call_tool(
            "ai4data_ai4data_mcpsearch_relevant_indicators", {"query": "malnutrition"}
        )
        print(result)
        return tools


async def get_mcp_tools():
    """OpenAI-shaped tool definitions for classic streaming and API (from adapter bundle)."""
    from app.config import get_mcp_settings

    mcp_url = get_mcp_settings().server_url
    logger.info("[mcp] get_mcp_tools (bundle) url=%s", mcp_url)
    _, definitions = await get_mcp_tool_bundle()
    logger.info("[mcp] get_mcp_tools done count=%d", len(definitions))
    return definitions


async def call_mcp_tool(tool_name: str, arguments: dict, as_jsonable: bool = True):
    """Invoke MCP tool via FastMCP client (classic stream path in app.utils.stream)."""
    try:
        normalized = normalize_mcp_tool_arguments(dict(arguments))
        client = get_mcp_client()
        async with client:
            result = await client.call_tool(tool_name, normalized)
            if as_jsonable:
                try:
                    return json5.loads(
                        result.content[0]
                        .text.lstrip("root=")
                        .replace(": None", ": null")
                        .replace(": True", ": true")
                        .replace(": False", ": false")
                        .strip()
                    )
                except Exception:
                    return result.content[0].model_dump()
            else:
                return result
    except Exception as e:
        tbck = traceback.format_exc()

        raise Exception(
            f"Error calling MCP tool {tool_name}, with arguments {arguments!r}: {str(e)}\n{tbck}"
        )
