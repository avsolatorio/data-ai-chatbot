"""
Workflow Sequence Correctness metric.

Validates that tools are called in the expected order using subsequence
matching. Detects skipped steps and out-of-order calls.

Maps to: "workflow, does it correctly call tools in a flow that is intended"
"""

from __future__ import annotations

from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase


def _is_subsequence(expected: list[str], actual: list[str]) -> tuple[bool, list[str]]:
    """
    Check if `expected` is a subsequence of `actual`.

    Returns:
        (is_match, missed_items): Whether all expected items appear in order,
        and which items were missed.
    """
    it = iter(actual)
    missed = []
    for item in expected:
        found = False
        for a in it:
            if a == item:
                found = True
                break
        if not found:
            missed.append(item)
    return len(missed) == 0, missed


class WorkflowOrderMetric(BaseMetric):
    """
    Deterministic metric checking that expected tools are called in the
    correct sequential order (as a subsequence of actual calls).

    Score:
        - 1.0 if the expected sequence is a valid subsequence of actual calls
        - Partial score based on longest matching prefix otherwise
    """

    def __init__(self, threshold: float = 0.7):
        self.threshold = threshold
        self.score = 0.0
        self.reason = ""
        self.success = False

    @property
    def __name__(self):
        return "Workflow Sequence Correctness"

    def measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        metadata = test_case.additional_metadata or {}

        # Get expected tool sequence
        expected_tools = metadata.get("expected_tools", [])
        expected_sequence = []
        for item in expected_tools:
            if isinstance(item, dict):
                expected_sequence.append(item.get("tool", item.get("name", "")))
            else:
                expected_sequence.append(str(item))

        if not expected_sequence:
            self.score = 1.0
            self.reason = "No expected workflow sequence defined."
            self.success = True
            return self.score

        # Get actual tool call sequence (order matters)
        actual_calls = metadata.get("actual_tool_calls", [])
        actual_sequence = []
        for call in actual_calls:
            if isinstance(call, dict):
                actual_sequence.append(call.get("tool", call.get("name", "")))
            else:
                actual_sequence.append(str(call))

        if not actual_sequence:
            self.score = 0.0
            self.reason = f"No tools were called. Expected: {expected_sequence}"
            self.success = False
            return self.score

        # Check subsequence
        is_match, missed = _is_subsequence(expected_sequence, actual_sequence)

        if is_match:
            self.score = 1.0
            self.reason = (
                f"All {len(expected_sequence)} expected tools called in correct order. "
                f"Actual sequence: {actual_sequence}"
            )
        else:
            # Partial score: fraction of expected steps that were matched
            matched = len(expected_sequence) - len(missed)
            self.score = matched / len(expected_sequence)
            self.reason = (
                f"{matched}/{len(expected_sequence)} steps in order. "
                f"Missed/out-of-order: {missed}. "
                f"Actual: {actual_sequence}"
            )

        self.success = self.score >= self.threshold
        return self.score

    async def a_measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        return self.measure(test_case, *args, **kwargs)

    def is_successful(self) -> bool:
        return self.success
