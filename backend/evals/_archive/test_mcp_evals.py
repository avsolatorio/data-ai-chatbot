"""
MCP evaluation test runner.

Runs tool selection, argument correctness, workflow order, chart rate,
entity coverage, and DeepEval MCP metrics against test cases.

Usage:
    cd backend/
    uv run pytest evals/test_mcp_evals.py -v
    uv run pytest evals/test_mcp_evals.py -k "tool_selection" -v
"""

from __future__ import annotations

import pytest
from deepeval.test_case import LLMTestCase
from evals.harness import (
    EvalTestCase,
    build_llm_test_case,
    load_test_cases_from_yaml,
)
from evals.metrics import (
    ArgumentCorrectnessMetric,
    ChartRateMetric,
    EntityCoverageMetric,
    ToolSelectionMetric,
    WorkflowOrderMetric,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _build_test_case_with_mock_calls(
    eval_tc: EvalTestCase,
    mock_calls: list[dict] | None = None,
    mock_output: str = "Mock response for evaluation.",
) -> LLMTestCase:
    """
    Build a DeepEval LLMTestCase from an EvalTestCase.

    In a full integration test, mock_calls would come from running the LLM.
    For unit-testing the metrics themselves, we pass mock_calls directly.
    """
    return build_llm_test_case(
        eval_tc=eval_tc,
        actual_output=mock_output,
        recorded_calls=mock_calls or [],
    )


# ---------------------------------------------------------------------------
# Tool Selection tests
# ---------------------------------------------------------------------------
class TestToolSelection:
    """Evaluate tool selection accuracy across test cases."""

    @pytest.fixture
    def metric(self):
        return ToolSelectionMetric(threshold=0.5)

    @pytest.mark.parametrize(
        "eval_tc",
        load_test_cases_from_yaml("tool_selection.yaml"),
        ids=lambda tc: tc.id,
    )
    def test_tool_selection_structure(self, eval_tc: EvalTestCase):
        """Verify test case structure is valid."""
        assert eval_tc.id, "Test case must have an ID"
        assert eval_tc.input, "Test case must have input"

    def test_perfect_match(self, metric):
        """When actual calls match expected exactly, score should be 1.0."""
        tc = EvalTestCase(
            id="test_perfect",
            description="Perfect match test",
            input="What is GDP of Kenya?",
            expected_tools=[
                {"tool": "data360_search_indicators"},
                {"tool": "data360_get_data"},
            ],
        )
        llm_tc = _build_test_case_with_mock_calls(
            tc,
            mock_calls=[
                {"tool": "data360_search_indicators", "arguments": {}},
                {"tool": "data360_get_data", "arguments": {}},
            ],
        )
        score = metric.measure(llm_tc)
        assert score == 1.0, f"Expected perfect score, got {score}: {metric.reason}"

    def test_missing_tool(self, metric):
        """When an expected tool is not called, recall should drop."""
        tc = EvalTestCase(
            id="test_missing",
            description="Missing tool test",
            input="What is GDP of Kenya?",
            expected_tools=[
                {"tool": "data360_search_indicators"},
                {"tool": "data360_get_data"},
            ],
        )
        llm_tc = _build_test_case_with_mock_calls(
            tc,
            mock_calls=[
                {"tool": "data360_search_indicators", "arguments": {}},
            ],
        )
        score = metric.measure(llm_tc)
        assert 0.0 < score < 1.0, f"Expected partial score, got {score}"

    def test_unexpected_tool(self, metric):
        """When an unexpected tool is called, precision should drop."""
        tc = EvalTestCase(
            id="test_extra",
            description="Extra tool test",
            input="What is GDP of Kenya?",
            expected_tools=[
                {"tool": "data360_search_indicators"},
            ],
            unexpected_tools=["data360_get_viz_spec"],
        )
        llm_tc = _build_test_case_with_mock_calls(
            tc,
            mock_calls=[
                {"tool": "data360_search_indicators", "arguments": {}},
                {"tool": "data360_get_viz_spec", "arguments": {}},
            ],
        )
        score = metric.measure(llm_tc)
        assert score < 1.0, f"Expected reduced score due to extra call, got {score}"


# ---------------------------------------------------------------------------
# Argument Correctness tests
# ---------------------------------------------------------------------------
class TestArgumentCorrectness:
    """Evaluate argument translation accuracy."""

    @pytest.fixture
    def metric(self):
        return ArgumentCorrectnessMetric(threshold=0.5)

    def test_correct_args(self, metric):
        """Arguments matching expected values should score 1.0."""
        tc = EvalTestCase(
            id="test_args_correct",
            description="Correct arguments",
            input="GDP of Kenya",
            expected_tools=[
                {
                    "tool": "data360_find_codelist_value",
                    "args_contain": {"codelist_type": "REF_AREA", "query": "Kenya"},
                },
            ],
        )
        llm_tc = _build_test_case_with_mock_calls(
            tc,
            mock_calls=[
                {
                    "tool": "data360_find_codelist_value",
                    "arguments": {"codelist_type": "REF_AREA", "query": "Kenya"},
                },
            ],
        )
        score = metric.measure(llm_tc)
        assert score == 1.0, f"Expected 1.0, got {score}: {metric.reason}"

    def test_wrong_args(self, metric):
        """Incorrect argument values should reduce the score."""
        tc = EvalTestCase(
            id="test_args_wrong",
            description="Wrong arguments",
            input="GDP of Kenya",
            expected_tools=[
                {
                    "tool": "data360_find_codelist_value",
                    "args_contain": {"codelist_type": "REF_AREA", "query": "Kenya"},
                },
            ],
        )
        llm_tc = _build_test_case_with_mock_calls(
            tc,
            mock_calls=[
                {
                    "tool": "data360_find_codelist_value",
                    "arguments": {"codelist_type": "REF_AREA", "query": "Tanzania"},
                },
            ],
        )
        score = metric.measure(llm_tc)
        assert score == 0.0, f"Expected 0.0 for wrong args, got {score}"


# ---------------------------------------------------------------------------
# Workflow Order tests
# ---------------------------------------------------------------------------
class TestWorkflowOrder:
    """Evaluate workflow sequence correctness."""

    @pytest.fixture
    def metric(self):
        return WorkflowOrderMetric(threshold=0.5)

    def test_correct_order(self, metric):
        """Tools in correct order should score 1.0."""
        tc = EvalTestCase(
            id="test_order",
            description="Correct order",
            input="GDP of Nigeria",
            expected_tools=[
                {"tool": "data360_find_codelist_value"},
                {"tool": "data360_search_indicators"},
                {"tool": "data360_get_data"},
            ],
        )
        llm_tc = _build_test_case_with_mock_calls(
            tc,
            mock_calls=[
                {"tool": "data360_find_codelist_value", "arguments": {}},
                {"tool": "data360_search_indicators", "arguments": {}},
                {"tool": "data360_get_data", "arguments": {}},
            ],
        )
        score = metric.measure(llm_tc)
        assert score == 1.0

    def test_wrong_order(self, metric):
        """Tools in wrong order should reduce score."""
        tc = EvalTestCase(
            id="test_wrong_order",
            description="Wrong order",
            input="GDP of Nigeria",
            expected_tools=[
                {"tool": "data360_find_codelist_value"},
                {"tool": "data360_search_indicators"},
                {"tool": "data360_get_data"},
            ],
        )
        llm_tc = _build_test_case_with_mock_calls(
            tc,
            mock_calls=[
                {"tool": "data360_get_data", "arguments": {}},
                {"tool": "data360_search_indicators", "arguments": {}},
                {"tool": "data360_find_codelist_value", "arguments": {}},
            ],
        )
        score = metric.measure(llm_tc)
        assert score < 1.0


# ---------------------------------------------------------------------------
# Chart Rate tests
# ---------------------------------------------------------------------------
class TestChartRate:
    """Evaluate chart/visualization trigger accuracy."""

    @pytest.fixture
    def metric(self):
        return ChartRateMetric()

    def test_chart_expected_and_called(self, metric):
        tc = EvalTestCase(
            id="test_chart_yes",
            input="Show me a chart of GDP",
            expect_chart=True,
        )
        llm_tc = _build_test_case_with_mock_calls(
            tc,
            mock_calls=[{"tool": "data360_get_viz_spec", "arguments": {}}],
        )
        assert metric.measure(llm_tc) == 1.0

    def test_chart_not_expected_not_called(self, metric):
        tc = EvalTestCase(
            id="test_chart_no",
            input="What is GDP of Kenya?",
            expect_chart=False,
        )
        llm_tc = _build_test_case_with_mock_calls(tc, mock_calls=[])
        assert metric.measure(llm_tc) == 1.0

    def test_chart_expected_not_called(self, metric):
        tc = EvalTestCase(
            id="test_chart_miss",
            input="Show me a chart",
            expect_chart=True,
        )
        llm_tc = _build_test_case_with_mock_calls(tc, mock_calls=[])
        assert metric.measure(llm_tc) == 0.0


# ---------------------------------------------------------------------------
# Entity Coverage tests
# ---------------------------------------------------------------------------
class TestEntityCoverage:
    """Evaluate entity coverage in output."""

    @pytest.fixture
    def metric(self):
        return EntityCoverageMetric(threshold=0.5)

    def test_all_entities_found(self, metric):
        tc = EvalTestCase(
            id="test_entities",
            input="GDP of Kenya",
            expected_entities=["Kenya", "GDP"],
        )
        llm_tc = _build_test_case_with_mock_calls(
            tc,
            mock_output="The GDP of Kenya in 2023 was $113 billion.",
        )
        assert metric.measure(llm_tc) == 1.0

    def test_missing_entity(self, metric):
        tc = EvalTestCase(
            id="test_missing_entity",
            input="GDP of Kenya",
            expected_entities=["Kenya", "GDP", "2023"],
        )
        llm_tc = _build_test_case_with_mock_calls(
            tc,
            mock_output="The GDP of Kenya was $113 billion.",
        )
        score = metric.measure(llm_tc)
        assert 0.0 < score < 1.0


# ---------------------------------------------------------------------------
# Live Pipeline Integration tests (requires --live flag)
# ---------------------------------------------------------------------------
@pytest.mark.live
class TestLivePipeline:
    """
    Run real prompts through the chatbot pipeline and evaluate.

    These tests require:
      - Backend .env with LLM API keys
      - Live MCP server (or cached tools)

    Run with: PYTHONPATH=. pytest evals/test_mcp_evals.py -k live --live -v
    """

    @pytest.fixture
    def tool_metric(self):
        return ToolSelectionMetric(threshold=0.3)

    @pytest.fixture
    def entity_metric(self):
        return EntityCoverageMetric(threshold=0.5)

    @pytest.mark.asyncio
    async def test_live_data_query(self, tool_metric, entity_metric):
        """A data query should trigger search_indicators and produce relevant output."""
        from evals.pipeline_runner import run_eval_pipeline

        result = await run_eval_pipeline(
            "What is the GDP per capita of Kenya?",
            skip_routing=True,  # Force RESEARCH path
        )

        assert result.error is None, f"Pipeline error: {result.error}"
        assert len(result.tool_calls) > 0, "Expected at least one tool call"
        assert result.final_output, "Expected non-empty final output"

        # Check that search_indicators was called
        tool_names = [tc["tool"] for tc in result.tool_calls]
        assert "data360_search_indicators" in tool_names, (
            f"Expected data360_search_indicators in {tool_names}"
        )

        # Evaluate with metrics
        tc = EvalTestCase(
            id="live_gdp_kenya",
            input="What is the GDP per capita of Kenya?",
            expected_tools=[
                {"tool": "data360_search_indicators"},
            ],
            expected_entities=["Kenya"],
        )
        llm_tc = build_llm_test_case(
            eval_tc=tc,
            actual_output=result.final_output,
            recorded_calls=result.tool_calls,
        )

        tool_score = tool_metric.measure(llm_tc)
        assert tool_score > 0, f"Tool selection score too low: {tool_score}"

        entity_score = entity_metric.measure(llm_tc)
        assert entity_score > 0, f"Entity coverage score too low: {entity_score}"

    @pytest.mark.asyncio
    async def test_live_routing_direct(self):
        """A greeting should be routed to DIRECT path with no MCP tools."""
        from evals.pipeline_runner import run_eval_pipeline

        result = await run_eval_pipeline("Hello, how are you?")

        assert result.error is None, f"Pipeline error: {result.error}"
        assert result.routing_intent == "DIRECT", (
            f"Expected DIRECT routing, got {result.routing_intent}"
        )
        assert len(result.tool_calls) == 0, (
            f"Expected no MCP tool calls for greeting, got {result.tool_calls}"
        )
        assert result.final_output, "Expected non-empty response"
