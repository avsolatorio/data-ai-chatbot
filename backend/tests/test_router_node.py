"""Unit tests for router_node — routing logic and @wdr fast-path.

All tests mock check_intent() so no LLM calls or DB connections are made.
"""

from unittest.mock import AsyncMock

import pytest

from app.ai.graph.nodes.router import router_node
from app.config import IntentType


def _state(**overrides) -> dict:
    """Return a minimal ChatPipelineState dict for testing."""
    base = {
        "openai_messages": [{"role": "user", "content": "test"}],
        "model_type": "chat-model",
        "query_text": "test",
        "message_id": "msg-test",
        "tool_set": {},
        "intent": "",
        "routing_reasoning": "",
        "research_packet": "",
        "assistant_parts": [],
        "final_usage": None,
    }
    return {**base, **overrides}


@pytest.mark.asyncio
async def test_wdr_token_forces_research_without_llm_call(monkeypatch):
    """@wdr in query must short-circuit to RESEARCH without calling check_intent."""
    mock_ci = AsyncMock()
    monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

    result = await router_node(_state(query_text="@wdr analyze GDP"))

    assert result["intent"] == IntentType.RESEARCH.value
    mock_ci.assert_not_called()


@pytest.mark.asyncio
async def test_wdr_case_insensitive(monkeypatch):
    """@WDR (uppercase) must also trigger the fast-path."""
    mock_ci = AsyncMock()
    monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

    result = await router_node(_state(query_text="Show me @WDR data"))

    assert result["intent"] == IntentType.RESEARCH.value
    mock_ci.assert_not_called()


@pytest.mark.asyncio
async def test_wdr_embedded_in_sentence(monkeypatch):
    """@wdr anywhere in the query must trigger the fast-path."""
    mock_ci = AsyncMock()
    monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

    result = await router_node(_state(query_text="Tell me about education trends @wdr 2024"))

    assert result["intent"] == IntentType.RESEARCH.value
    mock_ci.assert_not_called()


@pytest.mark.asyncio
async def test_research_intent_forwarded(monkeypatch):
    """check_intent returning RESEARCH must be forwarded with its reasoning."""
    monkeypatch.setattr(
        "app.ai.graph.nodes.router.check_intent",
        AsyncMock(return_value=(IntentType.RESEARCH, "WDI data question")),
    )

    result = await router_node(_state(query_text="GDP of Kenya"))

    assert result["intent"] == IntentType.RESEARCH.value
    assert result["routing_reasoning"] == "WDI data question"


@pytest.mark.asyncio
async def test_direct_intent_forwarded(monkeypatch):
    """check_intent returning DIRECT must be forwarded correctly."""
    monkeypatch.setattr(
        "app.ai.graph.nodes.router.check_intent",
        AsyncMock(return_value=(IntentType.DIRECT, "greeting")),
    )

    result = await router_node(_state(query_text="Hello there"))

    assert result["intent"] == IntentType.DIRECT.value
    assert result["routing_reasoning"] == "greeting"


@pytest.mark.asyncio
async def test_empty_reasoning_allowed(monkeypatch):
    """check_intent can return an empty reasoning string — router must not crash."""
    monkeypatch.setattr(
        "app.ai.graph.nodes.router.check_intent",
        AsyncMock(return_value=(IntentType.DIRECT, "")),
    )

    result = await router_node(_state(query_text="hi"))

    assert result["intent"] == IntentType.DIRECT.value
    assert result["routing_reasoning"] == ""


@pytest.mark.asyncio
async def test_check_intent_called_once_for_normal_query(monkeypatch):
    """check_intent is called exactly once for a non-@wdr query."""
    mock_ci = AsyncMock(return_value=(IntentType.RESEARCH, "data"))
    monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

    await router_node(_state(query_text="unemployment rate"))

    mock_ci.assert_awaited_once()


@pytest.mark.asyncio
async def test_openai_messages_passed_to_check_intent(monkeypatch):
    """check_intent receives the openai_messages from state."""
    messages = [
        {"role": "user", "content": "What is GDP?"},
        {"role": "assistant", "content": "GDP is ..."},
    ]
    mock_ci = AsyncMock(return_value=(IntentType.RESEARCH, "data"))
    monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

    await router_node(_state(openai_messages=messages, query_text="follow up"))

    mock_ci.assert_awaited_once_with(messages)
