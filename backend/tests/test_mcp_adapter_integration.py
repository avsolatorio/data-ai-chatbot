"""Unit tests for langchain-mcp-adapters integration helpers."""

from __future__ import annotations

import pytest
from langchain_core.tools import StructuredTool
from langchain_core.utils.function_calling import convert_to_openai_tool
from langchain_mcp_adapters.interceptors import MCPToolCallRequest
from pydantic import BaseModel, Field

from app.ai.mcp_tools.adapter_factory import NormalizeMcpToolArgsInterceptor
from app.ai.mcp_tools.normalize import normalize_mcp_tool_arguments
from app.ai.mcp_tools.partitions import CHOICE_TOOL_NAMES, DATA_TOOL_NAMES, VIZ_TOOL_NAMES


def test_normalize_disaggregation_json_string() -> None:
    out = normalize_mcp_tool_arguments({"disaggregation_filters": '{"a": 1}'})
    assert out["disaggregation_filters"] == {"a": 1}


def test_normalize_numeric_strings() -> None:
    out = normalize_mcp_tool_arguments({"start_year": "2020", "limit": "10"})
    assert out["start_year"] == 2020
    assert out["limit"] == 10


def test_openai_tool_definition_strict_shape() -> None:
    class _Args(BaseModel):
        q: str = Field(description="query")

    async def _fn(q: str) -> str:
        return q

    tool = StructuredTool.from_function(
        name="data360_get_data",
        description="test",
        args_schema=_Args,
        coroutine=_fn,
    )
    spec = convert_to_openai_tool(tool)
    wrapped = {**spec, "strict": True}
    assert wrapped["type"] == "function"
    assert wrapped["strict"] is True
    assert wrapped["function"]["name"] == "data360_get_data"
    assert "parameters" in wrapped["function"]


@pytest.mark.asyncio
async def test_normalize_interceptor_overrides_args() -> None:
    interceptor = NormalizeMcpToolArgsInterceptor()
    captured: dict = {}

    async def handler(req: MCPToolCallRequest):
        captured["args"] = dict(req.args)
        return "ok"

    req = MCPToolCallRequest(
        name="data360_get_data",
        args={"start_year": "2020"},
        server_name="data360",
    )
    result = await interceptor(req, handler)
    assert result == "ok"
    assert captured["args"]["start_year"] == 2020


def test_partition_tool_name_sets() -> None:
    assert "data360_get_data" in DATA_TOOL_NAMES
    assert "data360_expand_country_group" in DATA_TOOL_NAMES
    assert "data360_search_datasets" in DATA_TOOL_NAMES
    # interactive_choices moved to its own partition for clarifier + followup nodes
    assert "data360_interactive_choices" not in DATA_TOOL_NAMES
    assert "data360_interactive_choices" in CHOICE_TOOL_NAMES
    assert "data360_get_viz_spec" in VIZ_TOOL_NAMES
    assert DATA_TOOL_NAMES.isdisjoint(VIZ_TOOL_NAMES)
    assert DATA_TOOL_NAMES.isdisjoint(CHOICE_TOOL_NAMES)
    assert VIZ_TOOL_NAMES.isdisjoint(CHOICE_TOOL_NAMES)
