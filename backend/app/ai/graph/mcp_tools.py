"""LangChain-compatible MCP tool wrappers for the LangGraph pipeline.

Strategy:
- All data360 tools come from the same MCP server.
- We connect once (reusing the existing get_mcp_tools() + call_mcp_tool() from
  app.ai.mcp_tools.data360_mcp) and convert OpenAI-format definitions to
  LangChain StructuredTool instances.
- Tools are split into DATA_TOOL_NAMES (for research_node) and VIZ_TOOL_NAMES
  (for narrator_node) by filtering on tool name after a single load.
- A 5-minute in-memory cache avoids calling list_tools on every request.
"""

import asyncio
import logging
import time
from typing import Any, Type

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field, create_model

from app.ai.mcp_tools.data360_mcp import call_mcp_tool, get_mcp_tools

logger = logging.getLogger(__name__)

# ── Tool name partitions ───────────────────────────────────────────────────────

DATA_TOOL_NAMES: frozenset[str] = frozenset(
    {
        "data360_search_indicators",
        "data360_get_metadata",
        "data360_get_data",
        "data360_get_disaggregation",
        "data360_find_codelist_value",
        "data360_list_indicators",
        "data360_get_data_api_url",
    }
)

VIZ_TOOL_NAMES: frozenset[str] = frozenset(
    {
        "data360_get_viz_spec",
        "data360_get_multi_indicator_viz_spec",
        "data360_get_supported_chart_types",
    }
)

# ── Cache ─────────────────────────────────────────────────────────────────────

_CACHE_TTL_SECONDS = 300  # 5 minutes, matching tool_setup.py
_lc_mcp_tools_cache: tuple[float, tuple[list, list]] | None = None
_lc_mcp_tools_cache_lock = asyncio.Lock()

# ── Pydantic model builder ────────────────────────────────────────────────────

_JSON_SCHEMA_TYPE_MAP: dict[str, type] = {
    "string": str,
    "number": float,
    "integer": int,
    "boolean": bool,
    "array": list,
    "object": dict,
}


def _make_args_model(tool_name: str, json_schema: dict) -> Type[BaseModel]:
    """Build a Pydantic model from a JSON Schema dict (for args_schema)."""
    props: dict = json_schema.get("properties", {})
    required: set[str] = set(json_schema.get("required", []))
    fields: dict[str, Any] = {}

    for prop_name, prop_def in props.items():
        py_type: type = _JSON_SCHEMA_TYPE_MAP.get(prop_def.get("type", "string"), str)
        desc: str = prop_def.get("description", "")
        if prop_name in required:
            fields[prop_name] = (py_type, Field(description=desc))
        else:
            fields[prop_name] = (
                py_type | None,
                Field(default=None, description=desc),
            )

    class_name = "".join(part.capitalize() for part in tool_name.split("_")) + "Args"
    return create_model(class_name, **fields)  # type: ignore[call-overload]


# ── MCP invocation wrapper ────────────────────────────────────────────────────


async def _invoke_mcp_tool(tool_name: str, kwargs: dict) -> str:
    """Call the MCP server via existing call_mcp_tool() and return a string."""
    try:
        result = await call_mcp_tool(tool_name, kwargs, as_jsonable=False)
        # call_mcp_tool with as_jsonable=False returns the raw MCP result object
        if hasattr(result, "content") and result.content:
            parts = []
            for item in result.content:
                if hasattr(item, "text"):
                    parts.append(item.text)
                else:
                    parts.append(str(item))
            return "\n".join(parts)
        return str(result)
    except Exception as exc:
        logger.error("[mcp_tools] %s invocation failed: %s", tool_name, exc)
        raise


# ── StructuredTool builder ────────────────────────────────────────────────────


def _build_langchain_tool(mcp_tool_def: dict) -> StructuredTool:
    """Convert an OpenAI-format MCP tool definition to a LangChain StructuredTool."""
    fn_def: dict = mcp_tool_def["function"]
    tool_name: str = fn_def["name"]
    description: str = fn_def.get("description", "")
    params: dict = fn_def.get("parameters", {})

    args_schema = _make_args_model(tool_name, params)

    # Capture tool_name in closure
    _name = tool_name

    async def _arun(**kwargs: Any) -> str:  # noqa: ANN401
        return await _invoke_mcp_tool(_name, kwargs)

    return StructuredTool(
        name=tool_name,
        description=description,
        args_schema=args_schema,
        coroutine=_arun,
    )


# ── Public API ────────────────────────────────────────────────────────────────


async def get_langchain_mcp_tools() -> tuple[list[StructuredTool], list[StructuredTool]]:
    """Return (data_tools, viz_tools) as LangChain StructuredTool lists.

    Data tools go to research_node (retrieval only).
    Viz tools go to narrator_node (visualization generation).

    Uses a 5-minute in-process cache keyed on tool definitions fetched from the
    MCP server — same TTL as the raw MCP tool cache in tool_setup.py.
    """
    global _lc_mcp_tools_cache

    async with _lc_mcp_tools_cache_lock:
        now = time.monotonic()
        if _lc_mcp_tools_cache is not None and (now - _lc_mcp_tools_cache[0]) < _CACHE_TTL_SECONDS:
            age = now - _lc_mcp_tools_cache[0]
            logger.info("[mcp_tools] using cached LangChain MCP tools (age=%.0fs)", age)
            return _lc_mcp_tools_cache[1]

    try:
        logger.info("[mcp_tools] loading MCP tool definitions for LangChain wrapping")
        mcp_tool_defs = await get_mcp_tools()
        lc_tools = [_build_langchain_tool(t) for t in mcp_tool_defs]
        data_tools = [t for t in lc_tools if t.name in DATA_TOOL_NAMES]
        viz_tools = [t for t in lc_tools if t.name in VIZ_TOOL_NAMES]
        logger.info(
            "[mcp_tools] built %d data tools, %d viz tools",
            len(data_tools),
            len(viz_tools),
        )
    except Exception as exc:
        logger.warning("[mcp_tools] failed to load MCP tools: %s. Returning empty lists.", exc)
        data_tools, viz_tools = [], []

    async with _lc_mcp_tools_cache_lock:
        _lc_mcp_tools_cache = (time.monotonic(), (data_tools, viz_tools))

    return data_tools, viz_tools
