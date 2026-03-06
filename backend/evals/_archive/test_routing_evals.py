"""
Routing evaluation test runner.

Tests the intent router (check_intent) directly for RESEARCH vs DIRECT
classification accuracy.

Usage:
    cd backend/
    uv run pytest evals/test_routing_evals.py -v
"""

from __future__ import annotations

import pytest
from evals.harness import EvalTestCase, load_test_cases_from_yaml

ROUTING_CASES = load_test_cases_from_yaml("routing.yaml")
DIRECT_CASES = [tc for tc in ROUTING_CASES if tc.expected_routing == "DIRECT"]
RESEARCH_CASES = [tc for tc in ROUTING_CASES if tc.expected_routing == "RESEARCH"]


class TestRoutingClassification:
    """Tests for the intent router."""

    @pytest.mark.parametrize("eval_tc", ROUTING_CASES, ids=lambda tc: tc.id)
    def test_routing_case_structure(self, eval_tc: EvalTestCase):
        """Verify all routing test cases have a valid expected_routing."""
        assert eval_tc.expected_routing in (
            "RESEARCH",
            "DIRECT",
        ), f"Test case {eval_tc.id} has invalid expected_routing: {eval_tc.expected_routing}"

    @pytest.mark.asyncio
    @pytest.mark.parametrize("eval_tc", DIRECT_CASES, ids=lambda tc: tc.id)
    async def test_direct_routing(self, eval_tc: EvalTestCase):
        """Messages that should be routed to DIRECT."""
        from app.ai.routing import check_intent

        messages = []
        for msg in eval_tc.conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": eval_tc.input})

        intent, reasoning = await check_intent(messages)
        assert intent.value == "DIRECT", (
            f"[{eval_tc.id}] Expected DIRECT but got {intent.value}. "
            f"Input: '{eval_tc.input}'. Reasoning: '{reasoning}'"
        )

    @pytest.mark.asyncio
    @pytest.mark.parametrize("eval_tc", RESEARCH_CASES, ids=lambda tc: tc.id)
    async def test_research_routing(self, eval_tc: EvalTestCase):
        """Messages that should be routed to RESEARCH."""
        from app.ai.routing import check_intent

        messages = []
        for msg in eval_tc.conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": eval_tc.input})

        intent, reasoning = await check_intent(messages)
        assert intent.value == "RESEARCH", (
            f"[{eval_tc.id}] Expected RESEARCH but got {intent.value}. "
            f"Input: '{eval_tc.input}'. Reasoning: '{reasoning}'"
        )
