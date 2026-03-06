"""
Cross-model sensitivity testing.

Runs the same test cases across multiple models and compares
tool call patterns and argument correctness.

Usage:
    cd backend/
    uv run python -m evals.sensitivity_runner
    uv run python -m evals.sensitivity_runner --models gpt-4o,gpt-4.1-mini --tags single-turn
"""

from __future__ import annotations

import argparse
import asyncio
import logging
from dataclasses import dataclass, field
from pathlib import Path

from evals.harness import (
    build_llm_test_case,
    load_all_test_cases,
)
from evals.metrics import (
    ArgumentCorrectnessMetric,
    ChartRateMetric,
    ToolSelectionMetric,
    WorkflowOrderMetric,
)

logger = logging.getLogger(__name__)

DEFAULT_MODELS = ["gpt-4o-mini", "gpt-4o"]


@dataclass
class ModelResult:
    """Results for a single model on a single test case."""

    model: str
    test_case_id: str
    tool_selection_score: float = 0.0
    argument_correctness_score: float = 0.0
    workflow_order_score: float = 0.0
    chart_rate_score: float = 0.0
    tool_calls: list[str] = field(default_factory=list)
    error: str | None = None


@dataclass
class SensitivityReport:
    """Aggregated sensitivity analysis report."""

    models: list[str]
    test_cases: list[str]
    results: list[ModelResult] = field(default_factory=list)

    def to_comparison_table(self) -> str:
        """Generate a markdown comparison table."""
        lines = ["# Sensitivity Analysis Report\n"]
        lines.append(f"Models compared: {', '.join(self.models)}\n")
        lines.append(f"Test cases: {len(self.test_cases)}\n")

        lines.append("\n## Aggregate Scores\n")
        lines.append("| Model | Tool Selection | Arg Correctness | Workflow Order | Chart Rate |")
        lines.append("|-------|---------------|-----------------|----------------|------------|")

        for model in self.models:
            model_results = [r for r in self.results if r.model == model and r.error is None]
            if not model_results:
                lines.append(f"| {model} | N/A | N/A | N/A | N/A |")
                continue
            n = len(model_results)
            avg_ts = sum(r.tool_selection_score for r in model_results) / n
            avg_ac = sum(r.argument_correctness_score for r in model_results) / n
            avg_wo = sum(r.workflow_order_score for r in model_results) / n
            avg_cr = sum(r.chart_rate_score for r in model_results) / n
            lines.append(f"| {model} | {avg_ts:.2f} | {avg_ac:.2f} | {avg_wo:.2f} | {avg_cr:.2f} |")

        lines.append("\n## Consistency Analysis\n")
        inconsistent = []
        for tc_id in self.test_cases:
            tc_results = [r for r in self.results if r.test_case_id == tc_id and r.error is None]
            if len(tc_results) < 2:
                continue
            tool_sets = [frozenset(r.tool_calls) for r in tc_results]
            if len(set(tool_sets)) > 1:
                inconsistent.append(tc_id)

        if inconsistent:
            lines.append(f"**{len(inconsistent)} test cases** with inconsistent tool calls:\n")
            for tc_id in inconsistent:
                tc_results = [
                    r for r in self.results if r.test_case_id == tc_id and r.error is None
                ]
                for r in tc_results:
                    lines.append(f"  - {r.model}: {r.tool_calls}")
        else:
            lines.append("All test cases produced consistent tool call patterns across models.\n")

        return "\n".join(lines)


async def run_sensitivity(
    models: list[str],
    tags: list[str] | None = None,
    output_path: str | None = None,
) -> SensitivityReport:
    """
    Run test cases across multiple models and compare results.

    NOTE: Currently uses mock tool calls to demonstrate the framework.
    For real model-vs-model comparison, integrate with the LLM client.
    """
    test_cases = load_all_test_cases(tags=tags)

    if not test_cases:
        logger.warning("No test cases found for tags: %s", tags)
        return SensitivityReport(models=models, test_cases=[])

    report = SensitivityReport(
        models=models,
        test_cases=[tc.id for tc in test_cases],
    )

    metrics = {
        "tool_selection": ToolSelectionMetric(threshold=0.0),
        "argument_correctness": ArgumentCorrectnessMetric(threshold=0.0),
        "workflow_order": WorkflowOrderMetric(threshold=0.0),
        "chart_rate": ChartRateMetric(threshold=0.0),
    }

    for model in models:
        logger.info("Running sensitivity test for model: %s", model)

        for tc in test_cases:
            try:
                # TODO: Replace with actual LLM call through the chatbot pipeline
                mock_calls = [
                    {
                        "tool": e.get("tool", e.get("name", "")),
                        "arguments": e.get("args_contain", {}),
                    }
                    for e in tc.expected_tools
                    if isinstance(e, dict)
                ]

                llm_tc = build_llm_test_case(
                    eval_tc=tc,
                    actual_output=f"[Mock output from {model}]",
                    recorded_calls=mock_calls,
                )

                result = ModelResult(
                    model=model,
                    test_case_id=tc.id,
                    tool_calls=[c.get("tool", "") for c in mock_calls],
                )

                result.tool_selection_score = metrics["tool_selection"].measure(llm_tc)
                result.argument_correctness_score = metrics["argument_correctness"].measure(llm_tc)
                result.workflow_order_score = metrics["workflow_order"].measure(llm_tc)
                result.chart_rate_score = metrics["chart_rate"].measure(llm_tc)

                report.results.append(result)

            except Exception as e:
                logger.error("Error on %s / %s: %s", model, tc.id, e)
                report.results.append(ModelResult(model=model, test_case_id=tc.id, error=str(e)))

    table = report.to_comparison_table()
    print(table)

    if output_path:
        Path(output_path).write_text(table)
        logger.info("Report saved to %s", output_path)

    return report


def main():
    parser = argparse.ArgumentParser(description="Cross-model sensitivity testing")
    parser.add_argument("--models", type=str, default=",".join(DEFAULT_MODELS))
    parser.add_argument("--tags", type=str, default=None)
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    models = [m.strip() for m in args.models.split(",")]
    tags = [t.strip() for t in args.tags.split(",")] if args.tags else None

    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_sensitivity(models=models, tags=tags, output_path=args.output))


if __name__ == "__main__":
    main()
