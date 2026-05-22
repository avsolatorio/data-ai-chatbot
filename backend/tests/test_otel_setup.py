"""Tests for OpenTelemetry URL operation mapping (no network)."""

from __future__ import annotations

import pytest

from app.observability.graph_spans import instrument_graph_node
from app.observability.otel_setup import chatbot_operation_from_url


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        (None, "http"),
        ("https://api.example.com/mcp", "mcp"),
        (
            "https://myresource.openai.azure.com/openai/deployments/gpt-4/chat/completions",
            "azure_openai",
        ),
        ("https://api.example.com/api/v1/charts/abc", "charts"),
        ("https://data360api.worldbank.org/searchv2?q=1", "search"),
        ("https://data360api.worldbank.org/metadata/indicators", "metadata"),
        ("https://data360api.worldbank.org/data360/data", "data"),
        ("https://api.example.com/other", "http"),
    ],
)
def test_chatbot_operation_from_url(url: str | None, expected: str) -> None:
    assert chatbot_operation_from_url(url) == expected


@pytest.mark.asyncio
async def test_instrument_graph_node_runs_without_error() -> None:
    async def sample_node(state: dict) -> dict:
        return {"ok": True}

    wrapped = instrument_graph_node(sample_node, node_name="sample")
    result = await wrapped({"message_id": "msg-test", "model_type": "chat-model"})
    assert result == {"ok": True}
