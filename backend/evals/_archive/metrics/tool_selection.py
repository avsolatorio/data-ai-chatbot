"""
Tool Selection Accuracy metric.

Measures precision/recall/F1 of which MCP tools the LLM chose to call
versus which tools were expected for a given test case.

Maps to: "measurement of rate the tool is called and/or correct"
         "is it calling that unnecessary, and anything that is not called"
"""

from __future__ import annotations

from dataclasses import dataclass, field

from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase


@dataclass
class ToolSelectionResult:
    """Breakdown of tool selection evaluation."""

    expected: set[str]
    actual: set[str]
    true_positives: set[str] = field(default_factory=set)
    false_positives: set[str] = field(default_factory=set)
    false_negatives: set[str] = field(default_factory=set)
    precision: float = 0.0
    recall: float = 0.0
    f1: float = 0.0


class ToolSelectionMetric(BaseMetric):
    """
    Deterministic metric comparing expected vs actual tool calls.

    Scores:
        - precision: fraction of called tools that were expected
        - recall: fraction of expected tools that were called
        - score: F1 (harmonic mean of precision and recall)
    """

    def __init__(
        self,
        expected_tools_key: str = "expected_tools",
        unexpected_tools_key: str = "unexpected_tools",
        threshold: float = 0.7,
    ):
        self.expected_tools_key = expected_tools_key
        self.unexpected_tools_key = unexpected_tools_key
        self.threshold = threshold
        self.score = 0.0
        self.reason = ""
        self.success = False
        self._result: ToolSelectionResult | None = None

    @property
    def __name__(self):
        return "Tool Selection Accuracy"

    def measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        """Evaluate tool selection accuracy."""
        metadata = test_case.additional_metadata or {}
        expected_tools_list = metadata.get(self.expected_tools_key, [])
        unexpected_tools_list = metadata.get(self.unexpected_tools_key, [])

        expected = set()
        for item in expected_tools_list:
            if isinstance(item, dict):
                expected.add(item.get("tool", item.get("name", "")))
            else:
                expected.add(str(item))

        unexpected = set(unexpected_tools_list)

        actual = set()
        tool_calls = metadata.get("actual_tool_calls", [])
        for call in tool_calls:
            if isinstance(call, dict):
                actual.add(call.get("tool", call.get("name", "")))
            else:
                actual.add(str(call))

        true_positives = expected & actual
        false_positives = (actual - expected) | (actual & unexpected)
        false_negatives = expected - actual

        precision = len(true_positives) / len(actual) if actual else 1.0
        recall = len(true_positives) / len(expected) if expected else 1.0

        if precision + recall > 0:
            f1 = 2 * (precision * recall) / (precision + recall)
        else:
            f1 = 0.0

        self._result = ToolSelectionResult(
            expected=expected,
            actual=actual,
            true_positives=true_positives,
            false_positives=false_positives,
            false_negatives=false_negatives,
            precision=precision,
            recall=recall,
            f1=f1,
        )

        self.score = f1
        self.success = self.score >= self.threshold

        parts = [f"Precision: {precision:.2f}, Recall: {recall:.2f}, F1: {f1:.2f}"]
        if false_positives:
            parts.append(f"Unexpected calls: {sorted(false_positives)}")
        if false_negatives:
            parts.append(f"Missing calls: {sorted(false_negatives)}")
        self.reason = " | ".join(parts)

        return self.score

    async def a_measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        return self.measure(test_case, *args, **kwargs)

    def is_successful(self) -> bool:
        return self.success
