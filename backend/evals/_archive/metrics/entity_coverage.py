"""
Entity Coverage metric.

Checks if the LLM's final response mentions all expected entities
(countries, indicators, years, etc.).

Maps to: "expected covered entities (measure how well)"
"""

from __future__ import annotations

import re

from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase


class EntityCoverageMetric(BaseMetric):
    """
    Deterministic metric measuring entity coverage in the response.

    Checks that each expected entity appears somewhere in the
    actual_output of the test case (case-insensitive).

    Score = fraction of expected entities found in the output.
    """

    def __init__(self, threshold: float = 0.7):
        self.threshold = threshold
        self.score = 0.0
        self.reason = ""
        self.success = False

    @property
    def __name__(self):
        return "Entity Coverage"

    def measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        metadata = test_case.additional_metadata or {}
        expected_entities = metadata.get("expected_entities", [])

        if not expected_entities:
            self.score = 1.0
            self.reason = "No expected entities defined."
            self.success = True
            return self.score

        output = (test_case.actual_output or "").lower()

        if not output:
            self.score = 0.0
            self.reason = "No output to check entities against."
            self.success = False
            return self.score

        found = []
        missing = []

        for entity in expected_entities:
            pattern = re.escape(entity.lower())
            if len(entity) <= 4:
                pattern = rf"\b{pattern}\b"
            if re.search(pattern, output):
                found.append(entity)
            else:
                missing.append(entity)

        self.score = len(found) / len(expected_entities)
        self.success = self.score >= self.threshold

        if missing:
            self.reason = (
                f"{len(found)}/{len(expected_entities)} entities found. Missing: {missing}"
            )
        else:
            self.reason = f"All {len(expected_entities)} entities found in output."

        return self.score

    async def a_measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        return self.measure(test_case, *args, **kwargs)

    def is_successful(self) -> bool:
        return self.success
