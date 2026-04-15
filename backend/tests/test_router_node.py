"""Unit tests for router_node — routing logic and @wdr fast-path.

All tests mock check_intent() so no LLM calls or DB connections are made.

check_intent() now returns a 4-tuple: (intent, reasoning, router_usage, missing_slots)
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


def _mock_ci(intent, reasoning="", usage=None, missing_slots=None, language="English"):
    """Return an AsyncMock for check_intent with the new 5-tuple signature."""
    return AsyncMock(return_value=(intent, reasoning, usage, missing_slots or [], language))


@pytest.mark.asyncio
async def test_wdr_token_forces_research_without_llm_call(monkeypatch):
    """@wdr in query must short-circuit to RESEARCH without calling check_intent."""
    mock_ci = AsyncMock()
    monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

    result = await router_node(_state(query_text="@wdr analyze GDP"))

    assert result["intent"] == IntentType.RESEARCH.value
    assert result["missing_slots"] == []
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
        _mock_ci(IntentType.RESEARCH, "WDI data question"),
    )

    result = await router_node(_state(query_text="GDP of Kenya"))

    assert result["intent"] == IntentType.RESEARCH.value
    assert result["routing_reasoning"] == "WDI data question"
    assert result["missing_slots"] == []


@pytest.mark.asyncio
async def test_direct_intent_forwarded(monkeypatch):
    """check_intent returning DIRECT must be forwarded correctly."""
    monkeypatch.setattr(
        "app.ai.graph.nodes.router.check_intent",
        _mock_ci(IntentType.DIRECT, "greeting"),
    )

    result = await router_node(_state(query_text="Hello there"))

    assert result["intent"] == IntentType.DIRECT.value
    assert result["routing_reasoning"] == "greeting"


@pytest.mark.asyncio
async def test_clarify_intent_with_missing_slots(monkeypatch):
    """CLARIFY intent must forward missing_slots from check_intent."""
    monkeypatch.setattr(
        "app.ai.graph.nodes.router.check_intent",
        _mock_ci(IntentType.CLARIFY, "no country specified", missing_slots=["country"]),
    )

    result = await router_node(_state(query_text="show me the data"))

    assert result["intent"] == IntentType.CLARIFY.value
    assert result["missing_slots"] == ["country"]


@pytest.mark.asyncio
async def test_out_of_scope_intent(monkeypatch):
    """OUT_OF_SCOPE intent must be forwarded correctly."""
    monkeypatch.setattr(
        "app.ai.graph.nodes.router.check_intent",
        _mock_ci(IntentType.OUT_OF_SCOPE, "unrelated to development data"),
    )

    result = await router_node(_state(query_text="what's the best pizza recipe"))

    assert result["intent"] == IntentType.OUT_OF_SCOPE.value
    assert result["missing_slots"] == []


@pytest.mark.asyncio
async def test_explain_intent(monkeypatch):
    """EXPLAIN intent must be forwarded correctly."""
    monkeypatch.setattr(
        "app.ai.graph.nodes.router.check_intent",
        _mock_ci(IntentType.EXPLAIN, "asking for definition"),
    )

    result = await router_node(_state(query_text="what is the Human Capital Index?"))

    assert result["intent"] == IntentType.EXPLAIN.value


@pytest.mark.asyncio
async def test_empty_reasoning_allowed(monkeypatch):
    """check_intent can return an empty reasoning string — router must not crash."""
    monkeypatch.setattr(
        "app.ai.graph.nodes.router.check_intent",
        _mock_ci(IntentType.DIRECT, ""),
    )

    result = await router_node(_state(query_text="hi"))

    assert result["intent"] == IntentType.DIRECT.value
    assert result["routing_reasoning"] == ""


@pytest.mark.asyncio
async def test_check_intent_called_once_for_normal_query(monkeypatch):
    """check_intent is called exactly once for a non-@wdr query."""
    mock_ci = _mock_ci(IntentType.RESEARCH, "data")
    monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

    await router_node(_state(query_text="unemployment rate"))

    mock_ci.assert_awaited_once()


@pytest.mark.asyncio
async def test_forced_intent_direct_skips_check_intent(monkeypatch):
    """forced_intent=DIRECT must skip check_intent (v1 chat stream)."""
    mock_ci = AsyncMock()
    monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

    result = await router_node(_state(forced_intent=IntentType.DIRECT.value))

    assert result["intent"] == IntentType.DIRECT.value
    mock_ci.assert_not_called()


@pytest.mark.asyncio
async def test_forced_intent_research_skips_check_intent(monkeypatch):
    mock_ci = AsyncMock()
    monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

    result = await router_node(_state(forced_intent=IntentType.RESEARCH.value))

    assert result["intent"] == IntentType.RESEARCH.value
    mock_ci.assert_not_called()


@pytest.mark.asyncio
async def test_forced_intent_new_intents_accepted(monkeypatch):
    """All five intent types are accepted as forced_intent values."""
    for intent in IntentType:
        mock_ci = AsyncMock()
        monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

        result = await router_node(_state(forced_intent=intent.value))

        assert result["intent"] == intent.value
        mock_ci.assert_not_called()


@pytest.mark.asyncio
async def test_wdr_overrides_forced_intent(monkeypatch):
    """@wdr in query still wins over forced DIRECT."""
    mock_ci = AsyncMock()
    monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

    result = await router_node(_state(query_text="use @wdr", forced_intent=IntentType.DIRECT.value))

    assert result["intent"] == IntentType.RESEARCH.value
    mock_ci.assert_not_called()


@pytest.mark.asyncio
async def test_openai_messages_passed_to_check_intent(monkeypatch):
    """check_intent receives the openai_messages from state."""
    messages = [
        {"role": "user", "content": "What is GDP?"},
        {"role": "assistant", "content": "GDP is ..."},
    ]
    mock_ci = _mock_ci(IntentType.RESEARCH, "data")
    monkeypatch.setattr("app.ai.graph.nodes.router.check_intent", mock_ci)

    await router_node(_state(openai_messages=messages, query_text="follow up"))

    mock_ci.assert_awaited_once_with(messages)


@pytest.mark.asyncio
async def test_router_usage_forwarded_when_present(monkeypatch):
    """When check_intent returns usage, router_node exposes router_usage."""
    usage = {"prompt_tokens": 10, "completion_tokens": 2, "total_tokens": 12}
    monkeypatch.setattr(
        "app.ai.graph.nodes.router.check_intent",
        _mock_ci(IntentType.DIRECT, "ok", usage=usage),
    )
    result = await router_node(_state(query_text="hello"))
    assert result["router_usage"] == usage


@pytest.mark.asyncio
async def test_detected_language_forwarded(monkeypatch):
    """check_intent returning a non-English language must be stored in state."""
    monkeypatch.setattr(
        "app.ai.graph.nodes.router.check_intent",
        _mock_ci(IntentType.RESEARCH, "data question", language="French"),
    )
    result = await router_node(_state(query_text="Quel est le PIB du Kenya?"))
    assert result["detected_language"] == "French"


@pytest.mark.asyncio
async def test_detected_language_defaults_to_english(monkeypatch):
    """When check_intent returns English, detected_language is still forwarded."""
    monkeypatch.setattr(
        "app.ai.graph.nodes.router.check_intent",
        _mock_ci(IntentType.DIRECT, "greeting", language="English"),
    )
    result = await router_node(_state(query_text="Hello!"))
    assert result["detected_language"] == "English"
