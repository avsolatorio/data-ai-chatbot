"""
Evaluation harness for the Data360 Chatbot.

Core pipeline:
1. Load test cases from YAML files
2. Run user prompts through the chatbot's planner pipeline
3. Capture all tool calls (name, arguments, results)
4. Build DeepEval LLMTestCase objects
5. Return them for metric evaluation

Supports both live LLM execution and mock/replay modes.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger(__name__)

TEST_CASES_DIR = Path(__file__).parent / "test_cases"


# ---------------------------------------------------------------------------
# Test case schema
# ---------------------------------------------------------------------------
@dataclass
class EvalTestCase:
    """A single evaluation test case loaded from YAML."""

    id: str
    input: str
    description: str = ""
    expected_tools: list[dict[str, Any]] = field(default_factory=list)
    unexpected_tools: list[str] = field(default_factory=list)
    expected_entities: list[str] = field(default_factory=list)
    expect_chart: bool | None = None
    expected_routing: str | None = None  # "RESEARCH" or "DIRECT"
    tags: list[str] = field(default_factory=list)
    source: str = "human"
    conversation_history: list[dict[str, str]] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> EvalTestCase:
        return cls(
            id=data["id"],
            description=data.get("description", ""),
            input=data["input"],
            expected_tools=data.get("expected_tools", []),
            unexpected_tools=data.get("unexpected_tools", []),
            expected_entities=data.get("expected_entities", []),
            expect_chart=data.get("expect_chart"),
            expected_routing=data.get("expected_routing"),
            tags=data.get("tags", []),
            source=data.get("source", "human"),
            conversation_history=data.get("conversation_history", []),
        )


# ---------------------------------------------------------------------------
# Tool call recording
# ---------------------------------------------------------------------------
@dataclass
class RecordedToolCall:
    """A captured tool call from the LLM."""

    tool: str
    arguments: dict[str, Any]
    result: Any = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "tool": self.tool,
            "arguments": self.arguments,
            "result": self.result,
        }


# ---------------------------------------------------------------------------
# YAML loading
# ---------------------------------------------------------------------------
def load_test_cases_from_yaml(filename: str) -> list[EvalTestCase]:
    """Load test cases from a YAML file in the test_cases directory."""
    filepath = TEST_CASES_DIR / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Test case file not found: {filepath}")

    with open(filepath) as f:
        data = yaml.safe_load(f)

    if not isinstance(data, list):
        raise ValueError(f"Expected a list in {filename}, got {type(data).__name__}")

    return [EvalTestCase.from_dict(item) for item in data]


def load_all_test_cases(
    tags: list[str] | None = None,
) -> list[EvalTestCase]:
    """Load all test cases from all YAML files, optionally filtering by tags."""
    all_cases: list[EvalTestCase] = []

    for filepath in sorted(TEST_CASES_DIR.glob("*.yaml")):
        cases = load_test_cases_from_yaml(filepath.name)
        all_cases.extend(cases)

    if tags:
        tag_set = set(tags)
        all_cases = [tc for tc in all_cases if tag_set & set(tc.tags)]

    return all_cases


# ---------------------------------------------------------------------------
# Mock MCP tool executor
# ---------------------------------------------------------------------------
class MockMCPExecutor:
    """
    Mock tool executor that returns cached/fixture responses.

    Uses a fixture file to provide realistic tool responses without
    hitting the live Data360 API. Records all calls for evaluation.
    """

    def __init__(self, fixtures_path: str | Path | None = None):
        self.calls: list[RecordedToolCall] = []
        self._fixtures: dict[str, Any] = {}

        if fixtures_path:
            path = Path(fixtures_path)
            if path.exists():
                self._fixtures = json.loads(path.read_text())

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """Execute a mock tool call. Returns fixture data if available."""
        # Build fixture key from tool name + sorted args
        fixture_key = f"{tool_name}:{json.dumps(arguments, sort_keys=True)}"

        result = self._fixtures.get(fixture_key, self._default_response(tool_name))

        call = RecordedToolCall(tool=tool_name, arguments=arguments, result=result)
        self.calls.append(call)

        logger.debug("Mock tool call: %s(%s) -> %s", tool_name, arguments, type(result).__name__)
        return result

    def _default_response(self, tool_name: str) -> dict[str, Any]:
        """Return a minimal valid response for known tools."""
        defaults: dict[str, dict[str, Any]] = {
            "data360_search_indicators": {
                "indicators": [],
                "count": 0,
                "total_count": 0,
                "has_more": False,
            },
            "data360_find_codelist_value": [],
            "data360_get_data": {
                "data": [],
                "count": 0,
                "total_count": 0,
                "has_more": False,
            },
            "data360_get_metadata": {"metadata": {}, "disaggregation": {}},
            "data360_get_disaggregation": {"dimensions": []},
            "data360_get_viz_spec": {"url": "https://example.com/chart/mock", "error": None},
            "data360_get_data_api_url": "https://api.example.com/data/mock",
            "data360_get_supported_chart_types": {"chart_types": []},
            "data360_list_indicators": {"indicators": []},
        }
        return defaults.get(tool_name, {"status": "mock_response"})

    def get_recorded_calls(self) -> list[dict[str, Any]]:
        """Return all recorded tool calls as dicts."""
        return [c.to_dict() for c in self.calls]

    def reset(self):
        """Clear recorded calls."""
        self.calls.clear()


# ---------------------------------------------------------------------------
# Build DeepEval test case from eval test case + recorded calls
# ---------------------------------------------------------------------------
def build_llm_test_case(
    eval_tc: EvalTestCase,
    actual_output: str,
    recorded_calls: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Build the kwargs needed for a DeepEval LLMTestCase.

    Returns a dict that can be passed to LLMTestCase(**result).
    """
    from deepeval.test_case import LLMTestCase

    return LLMTestCase(
        input=eval_tc.input,
        actual_output=actual_output,
        additional_metadata={
            "test_case_id": eval_tc.id,
            "expected_tools": eval_tc.expected_tools,
            "unexpected_tools": eval_tc.unexpected_tools,
            "expected_entities": eval_tc.expected_entities,
            "expect_chart": eval_tc.expect_chart,
            "expected_routing": eval_tc.expected_routing,
            "actual_tool_calls": recorded_calls,
            "tags": eval_tc.tags,
            "source": eval_tc.source,
        },
    )
