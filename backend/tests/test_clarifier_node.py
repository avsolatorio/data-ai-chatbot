from unittest.mock import AsyncMock, MagicMock

import pytest
from langchain_core.messages import AIMessage

from app.ai.graph.nodes.clarifier import clarifier_node


def _state(**overrides) -> dict:
    base = {
        "openai_messages": [{"role": "user", "content": "test"}],
        "model_type": "chat-model",
        "missing_slots": ["country"],
        "routing_reasoning": "Missing country slot",
        "tool_set": {
            "mcp_data": {"langchain_tools": []},
            "mcp_choices": {"langchain_tools": []},
        },
        "assistant_parts": [],
    }
    return {**base, **overrides}


@pytest.mark.asyncio
async def test_clarifier_uses_run_tool_loop_when_choices_tool_available(monkeypatch):
    mock_tool = MagicMock()
    mock_tool.name = "data360_interactive_choices"

    mock_llm = MagicMock()
    mock_llm.bind_tools = MagicMock(return_value=mock_llm)
    monkeypatch.setattr(
        "app.ai.graph.nodes.clarifier.get_chat_llm", lambda *args, **kwargs: mock_llm
    )

    mock_run_loop = AsyncMock(
        return_value=("", None, [{"tool_name": "data360_interactive_choices"}])
    )
    monkeypatch.setattr("app.ai.graph.nodes.clarifier.run_tool_loop", mock_run_loop)

    state = _state()
    # Clarifier now reads from mcp_choices (not mcp_data)
    state["tool_set"]["mcp_choices"]["langchain_tools"] = [mock_tool]

    result = await clarifier_node(state)

    mock_run_loop.assert_called_once()
    assert result["clarification_question"] == ""


@pytest.mark.asyncio
async def test_clarifier_falls_back_to_ainvoke_when_tool_unavailable(monkeypatch):
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(content="Which country?"))
    monkeypatch.setattr(
        "app.ai.graph.nodes.clarifier.get_chat_llm", lambda *args, **kwargs: mock_llm
    )

    state = _state()
    result = await clarifier_node(state)

    mock_llm.ainvoke.assert_called_once()
    assert result["clarification_question"] == "Which country?"
    assert len(result["assistant_parts"]) == 1
    assert result["assistant_parts"][0]["text"] == "Which country?"
