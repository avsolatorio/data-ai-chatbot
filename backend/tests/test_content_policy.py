"""Tests for content-policy violation handling (BE-003)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

try:
    from litellm.exceptions import ContentPolicyViolationError
except ImportError:  # pragma: no cover
    ContentPolicyViolationError = Exception  # type: ignore[misc, assignment]

from app.ai.graph.llm_invoke import (
    CONTENT_POLICY_BLOCKED_PART_TYPE,
    CONTENT_POLICY_USER_MESSAGE,
    LLM_POLICY_BLOCKED_TEXT,
    content_policy_blocked_part,
    safe_llm_ainvoke,
)
from app.ai.graph.nodes import followup as followup_module
from app.ai.graph.sse_bridge import _SseBridgeState, _user_visible_stream_error
from app.observability.otel_setup import record_content_policy_on_span


@pytest.mark.asyncio
async def test_safe_llm_ainvoke_returns_policy_outcome() -> None:
    llm = MagicMock()
    llm.ainvoke = AsyncMock(side_effect=ContentPolicyViolationError("blocked", "azure", "gpt-4o"))

    msg, outcome = await safe_llm_ainvoke(llm, [], context="followup")

    assert msg is None
    assert outcome == "policy"


def test_content_policy_blocked_part_shape() -> None:
    part = content_policy_blocked_part(node="followup")
    assert part["type"] == CONTENT_POLICY_BLOCKED_PART_TYPE
    assert part["data"]["node"] == "followup"
    assert part["data"]["message"] == CONTENT_POLICY_USER_MESSAGE


def test_user_visible_stream_error_uses_shared_copy() -> None:
    msg = _user_visible_stream_error(ContentPolicyViolationError("x", "y", "z"), "err-1")
    assert CONTENT_POLICY_USER_MESSAGE in msg
    assert LLM_POLICY_BLOCKED_TEXT not in msg
    assert "Reference: err-1" in msg


def test_finalize_chunks_emits_data_part_not_blocked_text() -> None:
    bridge = _SseBridgeState(
        message_id="msg-1",
        thinking_db_id="think-1",
        input_state={"model_type": "chat-model"},
    )
    bridge._final_graph_state = {"content_policy_blocked": True}

    chunks = bridge.finalize_chunks()
    joined = b"".join(chunks).decode("utf-8")

    assert LLM_POLICY_BLOCKED_TEXT not in joined
    assert CONTENT_POLICY_BLOCKED_PART_TYPE in joined
    assert CONTENT_POLICY_USER_MESSAGE in joined
    assert any(p.get("type") == CONTENT_POLICY_BLOCKED_PART_TYPE for p in bridge._db_parts)


@pytest.mark.asyncio
async def test_followup_node_skips_gracefully_when_no_choices_tool() -> None:
    """followup_node returns empty follow-ups without error when mcp_choices is unavailable."""
    state = {
        "model_type": "chat-model",
        "detected_language": "",
        "openai_messages": [{"role": "user", "content": "hello"}],
        "assistant_parts": [{"type": "text", "text": "Main answer"}],
        "research_packet": "",
        # No mcp_choices in tool_set
        "tool_set": {"mcp_data": {"langchain_tools": []}, "mcp_choices": {"langchain_tools": []}},
    }

    result = await followup_module.followup_node(state)

    assert result["followup_questions"] == []
    assert result["assistant_parts"] == state["assistant_parts"]
    assert result["final_usage"] is None


@pytest.mark.asyncio
async def test_followup_node_calls_run_tool_loop_when_choices_tool_available() -> None:
    """followup_node calls run_tool_loop with data360_interactive_choices when available."""
    from unittest.mock import AsyncMock, MagicMock, patch

    mock_tool = MagicMock()
    mock_tool.name = "data360_interactive_choices"
    mock_llm = MagicMock()
    mock_llm.bind_tools = MagicMock(return_value=mock_llm)

    state = {
        "model_type": "chat-model",
        "detected_language": "",
        "openai_messages": [{"role": "user", "content": "hello"}],
        "assistant_parts": [{"type": "text", "text": "Main answer"}],
        "research_packet": "",
        "tool_set": {"mcp_choices": {"langchain_tools": [mock_tool]}},
    }

    with (
        patch.object(followup_module, "get_chat_llm", return_value=mock_llm),
        patch.object(followup_module, "trim_for_node", side_effect=lambda msgs, **_: msgs),
        patch.object(
            followup_module,
            "run_tool_loop",
            AsyncMock(return_value=("", None, [])),
        ) as mock_loop,
    ):
        result = await followup_module.followup_node(state)

    mock_loop.assert_called_once()
    assert result["followup_questions"] == []


def test_record_content_policy_on_span_sets_attributes() -> None:
    span = MagicMock()
    span.is_recording.return_value = True
    with patch("app.observability.otel_setup._recording_span", return_value=span):
        record_content_policy_on_span("narrator")
    span.set_attribute.assert_any_call("chatbot.content_policy_blocked", True)
    span.set_attribute.assert_any_call("chatbot.content_policy_node", "narrator")
