"""
Pytest configuration and shared fixtures for the eval suite.

Configuration is config-driven and server-agnostic.
Data360-specific defaults are loaded from data360_fixtures.py.
"""

from __future__ import annotations

import logging
import os

import pytest

# Default to a cost-efficient judge model
os.environ.setdefault("DEEPEVAL_LLM", "gpt-4.1-mini")

logger = logging.getLogger("evals")


# ---------------------------------------------------------------------------
# Generic fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_executor():
    """Generic MockMCPExecutor with no server-specific defaults."""
    from evals.harness import MockMCPExecutor

    return MockMCPExecutor()


@pytest.fixture
def mock_executor_with_fixtures(tmp_path):
    """MockMCPExecutor with an empty fixture file."""
    import json

    from evals.harness import MockMCPExecutor

    fixture_file = tmp_path / "fixtures.json"
    fixture_file.write_text(json.dumps({}))
    return MockMCPExecutor(fixtures_path=fixture_file)


# ---------------------------------------------------------------------------
# Data360-specific fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def data360_mock_executor():
    """MockMCPExecutor pre-loaded with Data360 default responses."""
    from evals.data360_fixtures import DATA360_DEFAULT_RESPONSES
    from evals.harness import MockMCPExecutor

    return MockMCPExecutor(default_responses=DATA360_DEFAULT_RESPONSES)


@pytest.fixture(scope="session")
def data360_mcp_server():
    """DeepEval MCPServer for Data360, loaded from cache."""
    from evals.mcp_server_def import get_data360_mcp_server

    try:
        return get_data360_mcp_server()
    except FileNotFoundError:
        pytest.skip("No cached Data360 tool definitions. Run cache_data360_tools() first.")
