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
async def test_followup_node_policy_block_sets_state_without_blocked_text() -> None:
    state = {
        "model_type": "chat-model",
        "detected_language": "",
        "openai_messages": [{"role": "user", "content": "hello"}],
        "assistant_parts": [{"type": "text", "text": "Main answer"}],
        "research_packet": "",
    }

    with (
        patch.object(followup_module, "get_chat_llm", return_value=MagicMock()),
        patch.object(
            followup_module,
            "safe_llm_ainvoke",
            AsyncMock(return_value=(None, "policy")),
        ),
        patch.object(followup_module, "trim_for_node", side_effect=lambda msgs, **_: msgs),
        patch.object(followup_module.trace, "get_current_span") as mock_span_getter,
    ):
        span = MagicMock()
        span.is_recording.return_value = True
        mock_span_getter.return_value = span

        result = await followup_module.followup_node(state)

    assert result["content_policy_blocked"] is True
    assert result["followup_questions"] == []
    assert result["assistant_parts"] == state["assistant_parts"]
    assert not any(
        (p.get("text") or "").strip() == LLM_POLICY_BLOCKED_TEXT
        for p in result["assistant_parts"]
        if isinstance(p, dict)
    )
    span.set_attribute.assert_any_call("chatbot.content_policy_blocked", True)
    span.set_attribute.assert_any_call("chatbot.content_policy_node", "followup")
