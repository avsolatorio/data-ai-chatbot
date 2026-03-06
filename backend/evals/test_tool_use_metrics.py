"""Unit tests for tool-use evaluation plumbing.

Tests _build_condensed_context, _serialize_condensed_context, and
_select_metrics_for_turn with the new tool_calls and routing fields.

These tests don't require any LLM calls or external services.

Usage:
    cd /Users/rafaelmacalaba/WBG/data-ai-chatbot/backend
    PYTHONPATH=. uv run python -m pytest evals/test_tool_use_metrics.py -v
"""

from __future__ import annotations

import pytest

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_tool_calls_pipeline():
    """Tool calls as captured by pipeline_runner (pipeline mode)."""
    return [
        {
            "tool": "data360_search_indicators",
            "arguments": {"query": "GDP per capita", "required_country": "Kenya"},
            "result": {"indicators": [{"idno": "WB_WDI_NY_GDP_PCAP_CD"}]},
        },
        {
            "tool": "data360_get_data",
            "arguments": {
                "database_id": "WB_WDI",
                "indicator_id": "WB_WDI_NY_GDP_PCAP_CD",
                "disaggregation_filters": {"REF_AREA": "KEN"},
            },
            "result": {"data": [{"OBS_VALUE": 1234.5}]},
        },
    ]


@pytest.fixture
def sample_tool_calls_http():
    """Tool calls as captured by HTTP mode (different key names)."""
    return [
        {
            "name": "data360_search_indicators",
            "args": {"query": "literacy rate"},
            "output": {"indicators": []},
        },
    ]


@pytest.fixture
def sample_per_turn_metric_defs():
    """Minimal per-turn metric definitions for testing pre-filter logic."""
    return [
        {"name": "Per-Turn Data Accuracy", "requires": "tool_data"},
        {"name": "Per-Turn Tool Selection", "requires": "tool_calls"},
        {"name": "Per-Turn Tool Sequencing", "requires": "tool_calls"},
        {"name": "Per-Turn Argument Quality", "requires": "tool_calls"},
        {"name": "Per-Turn Routing Correctness", "requires": "routing"},
        {"name": "Per-Turn Context Retention", "requires": "prior_context"},
        {"name": "Per-Turn Data Gap Handling", "requires": "data_gap"},
    ]


# ---------------------------------------------------------------------------
# Tests for _build_condensed_context
# ---------------------------------------------------------------------------


class TestBuildCondensedContext:
    def _call(self, **kwargs):
        from evals.run_conversation_eval import _build_condensed_context

        defaults = {
            "user_input": "What is the GDP of Kenya?",
            "assistant_output": "The GDP of Kenya is...",
            "turn_idx": 0,
        }
        defaults.update(kwargs)
        return _build_condensed_context(**defaults)

    def test_without_tool_calls_backward_compat(self):
        """Without tool_calls param, new fields default to empty/False."""
        ctx = self._call()
        assert ctx["structured_tool_calls"] == []
        assert ctx["tool_sequence"] == []
        assert ctx["has_tool_calls"] is False
        assert ctx["routing_intent"] == ""

    def test_with_pipeline_tool_calls(self, sample_tool_calls_pipeline):
        """Pipeline mode tool_calls are normalized correctly."""
        ctx = self._call(tool_calls=sample_tool_calls_pipeline)
        assert ctx["has_tool_calls"] is True
        assert len(ctx["structured_tool_calls"]) == 2
        assert ctx["tool_sequence"] == [
            "data360_search_indicators",
            "data360_get_data",
        ]
        # Check normalization
        tc0 = ctx["structured_tool_calls"][0]
        assert tc0["tool"] == "data360_search_indicators"
        assert tc0["arguments"]["query"] == "GDP per capita"
        assert tc0["result"] is not None

    def test_with_http_tool_calls(self, sample_tool_calls_http):
        """HTTP mode tool_calls (name/args/output) are normalized."""
        ctx = self._call(tool_calls=sample_tool_calls_http)
        assert ctx["has_tool_calls"] is True
        assert ctx["tool_sequence"] == ["data360_search_indicators"]
        tc0 = ctx["structured_tool_calls"][0]
        assert tc0["tool"] == "data360_search_indicators"
        assert tc0["arguments"]["query"] == "literacy rate"

    def test_with_routing_intent(self):
        """Routing intent is stored in context."""
        ctx = self._call(routing_intent="RESEARCH")
        assert ctx["routing_intent"] == "RESEARCH"

    def test_empty_tool_calls_list(self):
        """Empty tool_calls list results in has_tool_calls=False."""
        ctx = self._call(tool_calls=[])
        assert ctx["has_tool_calls"] is False
        assert ctx["structured_tool_calls"] == []
        assert ctx["tool_sequence"] == []


# ---------------------------------------------------------------------------
# Tests for _serialize_condensed_context
# ---------------------------------------------------------------------------


class TestSerializeCondensedContext:
    def test_includes_tool_sequence(self, sample_tool_calls_pipeline):
        from evals.run_conversation_eval import (
            _build_condensed_context,
            _serialize_condensed_context,
        )

        ctx = _build_condensed_context(
            "What is GDP of Kenya?",
            "The GDP is...",
            0,
            tool_calls=sample_tool_calls_pipeline,
            routing_intent="RESEARCH",
        )
        serialized = _serialize_condensed_context(ctx)

        assert "Tool Sequence: data360_search_indicators -> data360_get_data" in serialized
        assert "Routing: RESEARCH" in serialized
        assert "Tool Call 1: data360_search_indicators(" in serialized
        assert "Tool Call 2: data360_get_data(" in serialized

    def test_no_tool_data_no_tool_section(self):
        from evals.run_conversation_eval import (
            _build_condensed_context,
            _serialize_condensed_context,
        )

        ctx = _build_condensed_context("Hello", "Hi there!", 0)
        serialized = _serialize_condensed_context(ctx)

        assert "Tool Sequence" not in serialized
        assert "Tool Call" not in serialized
        assert "Routing" not in serialized


# ---------------------------------------------------------------------------
# Tests for _select_metrics_for_turn
# ---------------------------------------------------------------------------


class TestSelectMetricsForTurn:
    def _call(self, ctx, defs):
        from evals.run_conversation_eval import _select_metrics_for_turn

        return _select_metrics_for_turn(ctx, defs)

    def test_tool_calls_metrics_selected_when_tools_present(self, sample_per_turn_metric_defs):
        """requires: tool_calls metrics are selected when has_tool_calls=True."""
        ctx = {
            "turn_idx": 0,
            "has_tool_data": False,
            "has_tool_calls": True,
            "has_data_gap": False,
            "has_comparison": False,
            "has_technical_terms": False,
        }
        selected = self._call(ctx, sample_per_turn_metric_defs)
        assert "Per-Turn Tool Selection" in selected
        assert "Per-Turn Tool Sequencing" in selected
        assert "Per-Turn Argument Quality" in selected

    def test_tool_calls_metrics_skipped_when_no_tools(self, sample_per_turn_metric_defs):
        """requires: tool_calls metrics are skipped when has_tool_calls=False."""
        ctx = {
            "turn_idx": 0,
            "has_tool_data": False,
            "has_tool_calls": False,
            "has_data_gap": False,
            "has_comparison": False,
            "has_technical_terms": False,
        }
        selected = self._call(ctx, sample_per_turn_metric_defs)
        assert "Per-Turn Tool Selection" not in selected
        assert "Per-Turn Tool Sequencing" not in selected
        assert "Per-Turn Argument Quality" not in selected

    def test_routing_metric_always_selected(self, sample_per_turn_metric_defs):
        """requires: routing metrics are always selected regardless of context."""
        ctx = {
            "turn_idx": 0,
            "has_tool_data": False,
            "has_tool_calls": False,
            "has_data_gap": False,
            "has_comparison": False,
            "has_technical_terms": False,
        }
        selected = self._call(ctx, sample_per_turn_metric_defs)
        assert "Per-Turn Routing Correctness" in selected

    def test_prior_context_requires_turn_gt_0(self, sample_per_turn_metric_defs):
        """requires: prior_context is skipped on turn 0, selected on turn 1+."""
        ctx_turn0 = {
            "turn_idx": 0,
            "has_tool_data": False,
            "has_tool_calls": False,
            "has_data_gap": False,
            "has_comparison": False,
            "has_technical_terms": False,
        }
        ctx_turn1 = {**ctx_turn0, "turn_idx": 1}

        selected_0 = self._call(ctx_turn0, sample_per_turn_metric_defs)
        selected_1 = self._call(ctx_turn1, sample_per_turn_metric_defs)

        assert "Per-Turn Context Retention" not in selected_0
        assert "Per-Turn Context Retention" in selected_1
