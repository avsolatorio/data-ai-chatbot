"""
Argument Correctness metric.

Checks whether the key arguments passed to each tool call match the
expected values. Supports partial matching (args_contain) where only
specified keys need to match.

Maps to: "translation of the input to arguments (findcodelist value, year)"
"""

from __future__ import annotations

from typing import Any

from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase


def _deep_contains(actual: Any, expected: Any) -> bool:
    """
    Check if `actual` contains all key-value pairs from `expected`.

    - For dicts: every key in expected must exist in actual with matching value.
    - For strings: case-insensitive substring match.
    - For other types: equality check.
    """
    if isinstance(expected, dict) and isinstance(actual, dict):
        return all(k in actual and _deep_contains(actual[k], v) for k, v in expected.items())
    if isinstance(expected, str) and isinstance(actual, str):
        # Allow comma-separated values in any order
        exp_parts = {p.strip().upper() for p in expected.split(",")}
        act_parts = {p.strip().upper() for p in actual.split(",")}
        return exp_parts.issubset(act_parts)
    return actual == expected


class ArgumentCorrectnessMetric(BaseMetric):
    """
    Deterministic metric checking tool call arguments against expected values.

    For each expected tool call with `args_contain`, verifies that the
    corresponding actual call has matching argument values.

    Score = fraction of expected tool calls with correct arguments.
    """

    def __init__(self, threshold: float = 0.7):
        self.threshold = threshold
        self.score = 0.0
        self.reason = ""
        self.success = False

    @property
    def __name__(self):
        return "Argument Correctness"

    def measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        metadata = test_case.additional_metadata or {}
        expected_tools = metadata.get("expected_tools", [])
        actual_calls = metadata.get("actual_tool_calls", [])

        if not expected_tools:
            self.score = 1.0
            self.reason = "No expected tools with argument constraints."
            self.success = True
            return self.score

        # Filter to expected tools that have args_contain
        expectations_with_args = [
            e for e in expected_tools if isinstance(e, dict) and e.get("args_contain")
        ]

        if not expectations_with_args:
            self.score = 1.0
            self.reason = "No argument constraints specified."
            self.success = True
            return self.score

        # Build lookup: tool_name -> list of actual calls
        actual_by_name: dict[str, list[dict]] = {}
        for call in actual_calls:
            if isinstance(call, dict):
                name = call.get("tool", call.get("name", ""))
                actual_by_name.setdefault(name, []).append(call)

        correct = 0
        issues: list[str] = []

        for exp in expectations_with_args:
            tool_name = exp.get("tool", exp.get("name", ""))
            exp_args = exp["args_contain"]

            matching_calls = actual_by_name.get(tool_name, [])
            if not matching_calls:
                issues.append(f"{tool_name}: not called")
                continue

            # Check if any actual call matches the expected args
            matched = False
            for call in matching_calls:
                actual_args = call.get("arguments", call.get("args", {}))
                if _deep_contains(actual_args, exp_args):
                    matched = True
                    break

            if matched:
                correct += 1
            else:
                actual_args_summary = matching_calls[0].get(
                    "arguments", matching_calls[0].get("args", {})
                )
                issues.append(f"{tool_name}: expected {exp_args}, got {actual_args_summary}")

        total = len(expectations_with_args)
        self.score = correct / total if total > 0 else 1.0
        self.success = self.score >= self.threshold

        if issues:
            self.reason = f"{correct}/{total} correct. Issues: " + "; ".join(issues)
        else:
            self.reason = f"{correct}/{total} argument checks passed."

        return self.score

    async def a_measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        return self.measure(test_case, *args, **kwargs)

    def is_successful(self) -> bool:
        return self.success
