"""
Chart / Visualization Rate metric.

Binary metric: was `data360_get_viz_spec` called when a chart was expected?
Was it NOT called when not expected?

Maps to: "expecting to call a chart yes/no"
"""

from __future__ import annotations

from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase

VIZ_TOOL_NAME = "data360_get_viz_spec"


class ChartRateMetric(BaseMetric):
    """
    Deterministic binary metric for visualization tool usage.

    Score:
        - 1.0 if chart expectation matches reality
        - 0.0 if mismatch
    """

    def __init__(self, threshold: float = 1.0):
        self.threshold = threshold
        self.score = 0.0
        self.reason = ""
        self.success = False

    @property
    def __name__(self):
        return "Chart Rate"

    def measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        metadata = test_case.additional_metadata or {}

        expect_chart = metadata.get("expect_chart")
        if expect_chart is None:
            # No expectation defined — skip (pass)
            self.score = 1.0
            self.reason = "No chart expectation defined; skipping."
            self.success = True
            return self.score

        # Check if viz tool was actually called
        actual_calls = metadata.get("actual_tool_calls", [])
        viz_called = any(
            (call.get("tool", call.get("name", "")) == VIZ_TOOL_NAME)
            if isinstance(call, dict)
            else str(call) == VIZ_TOOL_NAME
            for call in actual_calls
        )

        if expect_chart and viz_called:
            self.score = 1.0
            self.reason = "Chart expected and visualization tool was called. ✓"
        elif not expect_chart and not viz_called:
            self.score = 1.0
            self.reason = "No chart expected and visualization tool was not called. ✓"
        elif expect_chart and not viz_called:
            self.score = 0.0
            self.reason = "Chart expected but visualization tool was NOT called. ✗"
        else:  # not expect_chart and viz_called
            self.score = 0.0
            self.reason = "No chart expected but visualization tool WAS called. ✗"

        self.success = self.score >= self.threshold
        return self.score

    async def a_measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        return self.measure(test_case, *args, **kwargs)

    def is_successful(self) -> bool:
        return self.success
