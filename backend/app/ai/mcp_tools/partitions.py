"""Partition MCP tool names for LangGraph nodes (research vs narrator)."""

from __future__ import annotations

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
