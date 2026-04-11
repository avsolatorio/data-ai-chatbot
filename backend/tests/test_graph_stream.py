"""Unit tests for shared LangGraph streaming helpers."""

from uuid import uuid4

from app.api.v1.utils.graph_stream import (
    build_assistant_message_from_graph,
    build_graph_input,
    build_routing_parts,
)


def test_build_routing_parts_includes_static_and_reasoning():
    parts = build_routing_parts("mid-1", "because data")
    assert parts[0]["type"] == "data-thinking"
    assert "Understanding" in parts[0]["data"]["text"]
    assert parts[1]["data"]["text"] == "because data"


def test_build_routing_parts_omits_reasoning_when_empty():
    parts = build_routing_parts("mid-1", "")
    assert len(parts) == 1


def test_build_assistant_message_from_graph_uses_persisted_parts():
    chat_id = uuid4()
    msg = build_assistant_message_from_graph(
        "row-1",
        {
            "routing_reasoning": "r",
            "assistant_parts_for_db": [{"type": "text", "text": "hi"}],
        },
        chat_id=chat_id,
    )
    assert msg["id"] == "row-1"
    assert msg["chatId"] == chat_id
    assert msg["role"] == "assistant"
    assert {"type": "text", "text": "hi"} in msg["parts"]


def test_build_assistant_message_from_graph_fallback_answer_text():
    chat_id = uuid4()
    msg = build_assistant_message_from_graph(
        "row-2",
        {"routing_reasoning": "", "answer_text": "fallback"},
        chat_id=chat_id,
    )
    assert msg["parts"][-1] == {"type": "text", "text": "fallback"}


def test_build_graph_input_forced_intent_key():
    inp = build_graph_input(
        openai_messages=[{"role": "user", "content": "x"}],
        model_type="chat-model",
        query_text="x",
        part_message_id="msg-1",
        tool_set={"local": {"langchain_tools": []}},
        forced_intent="DIRECT",
    )
    assert inp["forced_intent"] == "DIRECT"
    assert "_tool_sse_queue" in inp
