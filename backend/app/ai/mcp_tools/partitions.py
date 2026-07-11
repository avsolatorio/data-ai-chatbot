"""Partition MCP tool names for LangGraph nodes (research vs narrator)."""

from __future__ import annotations

DATA_TOOL_NAMES: frozenset[str] = frozenset(
    {
        "data360_search_indicators",
        "data360_search_datasets",
        "data360_get_metadata",
        "data360_get_data",
        "data360_get_disaggregation",
        "data360_find_codelist_value",
        "data360_list_indicators",
        "data360_get_data_api_url",
        "data360_expand_country_group",
        "data360_summarize_data",
        "data360_rank_countries",
        "data360_compare_countries",
    }
)

# Used by both clarifier_node and followup_node to emit structured choices.
CHOICE_TOOL_NAMES: frozenset[str] = frozenset({"data360_interactive_choices"})

VIZ_TOOL_NAMES: frozenset[str] = frozenset(
    {
        "data360_get_viz_spec",
        "data360_get_multi_indicator_viz_spec",
        "data360_get_supported_chart_types",
    }
)
