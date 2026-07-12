"""Tests verifying that the narrator node strips visualization tools in quick mode.

When response_mode == "quick", the quick_answer_node already programmatically
attaches a viz_url to the QuickAnswerCard. Binding viz tools to the narrator in
this mode would allow it to call data360_get_viz_spec and embed a second chart
URL in its prose — causing a duplicate chart render. This test suite verifies
that no viz tools are bound when quick mode is active.
"""

from unittest.mock import AsyncMock, Mock

import pytest

import app.ai.graph.nodes.narrator as narrator_mod
from app.ai.graph.nodes.narrator import narrator_node
from app.ai.graph.state import ChatPipelineState


@pytest.mark.asyncio
async def test_narrator_quick_mode_strips_viz_tools(monkeypatch) -> None:
    """In quick mode, viz tools must NOT be bound to the narrator LLM."""
    captured_tool_lists: list[list] = []

    mock_response = Mock()
    mock_response.content = "**Sources:** World Development Indicators — Population, total"
    mock_response.tool_calls = []
    mock_response.usage_metadata = None

    mock_llm = Mock()

    def capture_bind_tools(tools):
        captured_tool_lists.append(list(tools))
        return mock_llm

    mock_llm.bind_tools = capture_bind_tools
    mock_llm.ainvoke = AsyncMock(return_value=mock_response)

    monkeypatch.setattr(narrator_mod, "get_chat_llm", lambda *args, **kwargs: mock_llm)
    monkeypatch.setattr(narrator_mod, "trim_for_node", lambda msgs, node: msgs)
    monkeypatch.setattr(narrator_mod, "openai_to_langchain", lambda msgs: [])

    viz_tool = Mock()
    viz_tool.name = "data360_get_viz_spec"
    local_tool = Mock()
    local_tool.name = "createDocument"

    state: ChatPipelineState = {
        "model_type": "chat",
        "detected_language": "English",
        "response_mode": "quick",
        "openai_messages": [],
        "research_packet": "",
        "research_tool_results": [],
        "tool_set": {
            "mcp_viz": {"langchain_tools": [viz_tool]},
            "local": {"langchain_tools": [local_tool]},
        },
        "message_id": "test-msg-1",
        "query_text": "What is Ghana's GDP?",
    }

    await narrator_node(state)

    # bind_tools must have been called exactly once
    assert len(captured_tool_lists) == 1
    bound = captured_tool_lists[0]

    # Viz tool must NOT be present in quick mode
    bound_names = [t.name for t in bound]
    assert "data360_get_viz_spec" not in bound_names, (
        f"Viz tool was unexpectedly bound in quick mode. Bound tools: {bound_names}"
    )
    # Local tools should not be stripped (they do not produce chart URLs)
    assert "createDocument" not in bound_names, (
        "Local tools should also be stripped in quick mode to keep the narrator minimal"
    )
    # Overall: no tools at all in quick mode
    assert len(bound) == 0, f"Expected no tools in quick mode, got: {bound_names}"


@pytest.mark.asyncio
async def test_narrator_full_mode_keeps_viz_tools(monkeypatch) -> None:
    """In full mode, viz tools MUST be available to the narrator LLM."""
    captured_tool_lists: list[list] = []

    mock_response = Mock()
    mock_response.content = "Here is the analysis of the data."
    mock_response.tool_calls = []
    mock_response.usage_metadata = None

    mock_llm = Mock()

    def capture_bind_tools(tools):
        captured_tool_lists.append(list(tools))
        return mock_llm

    mock_llm.bind_tools = capture_bind_tools
    mock_llm.ainvoke = AsyncMock(return_value=mock_response)

    monkeypatch.setattr(narrator_mod, "get_chat_llm", lambda *args, **kwargs: mock_llm)
    monkeypatch.setattr(narrator_mod, "trim_for_node", lambda msgs, node: msgs)
    monkeypatch.setattr(narrator_mod, "openai_to_langchain", lambda msgs: [])

    viz_tool = Mock()
    viz_tool.name = "data360_get_viz_spec"
    local_tool = Mock()
    local_tool.name = "createDocument"

    state: ChatPipelineState = {
        "model_type": "chat",
        "detected_language": "English",
        "response_mode": "full",
        "openai_messages": [],
        "research_packet": "",
        "research_tool_results": [],
        "tool_set": {
            "mcp_viz": {"langchain_tools": [viz_tool]},
            "local": {"langchain_tools": [local_tool]},
        },
        "message_id": "test-msg-2",
        "query_text": "Show unemployment trends in Nigeria since 2010",
    }

    await narrator_node(state)

    assert len(captured_tool_lists) == 1
    bound = captured_tool_lists[0]
    bound_names = [t.name for t in bound]

    # In full mode, viz tools must be accessible to the narrator
    assert "data360_get_viz_spec" in bound_names, (
        f"Viz tool should be bound in full mode. Bound tools: {bound_names}"
    )


@pytest.mark.asyncio
async def test_narrator_default_mode_keeps_viz_tools(monkeypatch) -> None:
    """If response_mode is absent (defaults to 'full'), viz tools must be kept."""
    captured_tool_lists: list[list] = []

    mock_response = Mock()
    mock_response.content = "Analysis complete."
    mock_response.tool_calls = []
    mock_response.usage_metadata = None

    mock_llm = Mock()

    def capture_bind_tools(tools):
        captured_tool_lists.append(list(tools))
        return mock_llm

    mock_llm.bind_tools = capture_bind_tools
    mock_llm.ainvoke = AsyncMock(return_value=mock_response)

    monkeypatch.setattr(narrator_mod, "get_chat_llm", lambda *args, **kwargs: mock_llm)
    monkeypatch.setattr(narrator_mod, "trim_for_node", lambda msgs, node: msgs)
    monkeypatch.setattr(narrator_mod, "openai_to_langchain", lambda msgs: [])

    viz_tool = Mock()
    viz_tool.name = "data360_get_viz_spec"

    state: ChatPipelineState = {
        "model_type": "chat",
        "detected_language": "",
        # response_mode intentionally omitted — should default to "full"
        "openai_messages": [],
        "research_packet": "",
        "research_tool_results": [],
        "tool_set": {
            "mcp_viz": {"langchain_tools": [viz_tool]},
            "local": {"langchain_tools": []},
        },
        "message_id": "test-msg-3",
        "query_text": "Analyze GDP trends",
    }

    await narrator_node(state)

    assert len(captured_tool_lists) == 1
    bound_names = [t.name for t in captured_tool_lists[0]]
    assert "data360_get_viz_spec" in bound_names
