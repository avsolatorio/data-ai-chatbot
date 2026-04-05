"""Unit tests for StreamEventProcessor — persisted assistant parts and data-thinking wrapping."""

from uuid import uuid4

from app.utils.stream_processor import StreamEventProcessor


def test_unified_thinking_then_plain_narrative_parts():
    """After ^ANSWER^, stream emits plain text-* events; processor must not wrap them as data-thinking."""
    proc = StreamEventProcessor(uuid4(), mode="unified")

    inner = "inner-text"
    proc._process_event_data(
        {
            "type": "data-thinking",
            "id": "thinking-outer",
            "data": {"type": "text-start", "id": inner},
        },
    )
    proc._process_event_data(
        {
            "type": "data-thinking",
            "id": "thinking-outer",
            "data": {"type": "text-delta", "id": inner, "delta": "Planning only. "},
        },
    )
    proc._process_event_data(
        {
            "type": "data-thinking",
            "id": "thinking-outer",
            "data": {"type": "text-end", "id": inner},
        },
    )

    out = "out-text"
    proc._process_event_data({"type": "text-start", "id": out})
    proc._process_event_data({"type": "text-delta", "id": out, "delta": "Summary for the user."})
    proc._process_event_data({"type": "text-end", "id": out})

    proc._process_event_data({"type": "finish", "messageMetadata": {}})

    assert len(proc.assistant_messages) == 1
    parts = proc.assistant_messages[0]["parts"]
    assert parts[0]["type"] == "data-thinking"
    assert parts[0]["data"]["type"] == "text"
    assert "Planning" in parts[0]["data"]["text"]
    assert parts[1]["type"] == "text"
    assert parts[1]["text"] == "Summary for the user."


def test_chat_mode_plain_text_not_wrapped():
    """Chat mode: top-level text parts are stored without data-thinking wrapper."""
    proc = StreamEventProcessor(uuid4(), mode="chat")
    tid = "t-chat"
    proc._process_event_data({"type": "text-start", "id": tid})
    proc._process_event_data({"type": "text-delta", "id": tid, "delta": "Hello chat"})
    proc._process_event_data({"type": "text-end", "id": tid})
    proc._process_event_data({"type": "finish", "messageMetadata": {}})

    parts = proc.assistant_messages[0]["parts"]
    assert len(parts) == 1
    assert parts[0]["type"] == "text"
    assert parts[0]["text"] == "Hello chat"
    assert "data-thinking" not in parts[0]


def test_thinking_mode_wraps_inner_events():
    """Legacy thinking mode: inner events arrive under data-thinking envelope and are wrapped."""
    proc = StreamEventProcessor(uuid4(), mode="thinking")
    tid = "t-think"
    proc._process_event_data(
        {
            "type": "data-thinking",
            "data": {"type": "text-start", "id": tid},
        },
    )
    proc._process_event_data(
        {
            "type": "data-thinking",
            "data": {"type": "text-delta", "id": tid, "delta": "internal"},
        },
    )
    proc._process_event_data(
        {
            "type": "data-thinking",
            "data": {"type": "text-end", "id": tid},
        },
    )
    proc._process_event_data({"type": "finish", "messageMetadata": {}})

    parts = proc.assistant_messages[0]["parts"]
    assert parts[0]["type"] == "data-thinking"
    assert parts[0]["data"]["type"] == "text"
    assert parts[0]["data"]["text"] == "internal"


def test_unified_tool_after_text_wraps_tool_in_data_thinking():
    """Unified: tool events nested in data-thinking are wrapped."""
    proc = StreamEventProcessor(uuid4(), mode="unified")
    tid = "tx"
    proc._process_event_data(
        {
            "type": "data-thinking",
            "id": "out",
            "data": {"type": "text-start", "id": tid},
        },
    )
    proc._process_event_data(
        {
            "type": "data-thinking",
            "id": "out",
            "data": {"type": "text-delta", "id": tid, "delta": "x"},
        },
    )
    proc._process_event_data(
        {
            "type": "data-thinking",
            "id": "out",
            "data": {"type": "text-end", "id": tid},
        },
    )
    proc._process_event_data(
        {
            "type": "data-thinking",
            "id": "out",
            "data": {
                "type": "tool-input-start",
                "toolCallId": "tc1",
                "toolName": "data360_search_indicators",
            },
        },
    )
    proc._process_event_data(
        {
            "type": "data-thinking",
            "id": "out",
            "data": {
                "type": "tool-input-available",
                "toolCallId": "tc1",
                "toolName": "data360_search_indicators",
                "input": {"q": "gdp"},
            },
        },
    )
    proc._process_event_data(
        {
            "type": "data-thinking",
            "id": "out",
            "data": {
                "type": "tool-output-available",
                "toolCallId": "tc1",
                "output": {"results": []},
            },
        },
    )
    proc._process_event_data({"type": "finish", "messageMetadata": {}})

    parts = proc.assistant_messages[0]["parts"]
    assert parts[0]["type"] == "data-thinking"
    assert parts[0]["data"]["type"] == "text"
    assert parts[1]["type"] == "data-thinking"
    assert parts[1]["data"]["type"].startswith("tool-")
    assert parts[1]["data"]["state"] == "output-available"


def test_data_usage_sets_final_usage_not_parts():
    """data-usage updates final_usage and does not append a user-visible part."""
    proc = StreamEventProcessor(uuid4(), mode="chat")
    tid = "u1"
    proc._process_event_data({"type": "text-start", "id": tid})
    proc._process_event_data({"type": "text-delta", "id": tid, "delta": "x"})
    proc._process_event_data({"type": "text-end", "id": tid})
    proc._process_event_data(
        {
            "type": "data-usage",
            "data": {"input_tokens": 10, "output_tokens": 20},
        },
    )
    proc._process_event_data({"type": "finish", "messageMetadata": {}})

    assert proc.final_usage == {"input_tokens": 10, "output_tokens": 20}
    parts = proc.assistant_messages[0]["parts"]
    assert len(parts) == 1
    assert parts[0]["type"] == "text"


def test_finish_metadata_usage_overrides_final_usage():
    """Finish messageMetadata.usage wins for lastContext-style tracking."""
    proc = StreamEventProcessor(uuid4(), mode="chat")
    tid = "u2"
    proc._process_event_data({"type": "text-start", "id": tid})
    proc._process_event_data({"type": "text-delta", "id": tid, "delta": "y"})
    proc._process_event_data({"type": "text-end", "id": tid})
    proc._process_event_data(
        {
            "type": "finish",
            "messageMetadata": {
                "usage": {"data": {"input_tokens": 1, "output_tokens": 2}},
            },
        },
    )

    assert proc.final_usage == {"input_tokens": 1, "output_tokens": 2}


def test_finish_finalizes_pending_text_without_text_end():
    """If text-end was never emitted (e.g. tool_calls edge), finish still persists buffered text."""
    proc = StreamEventProcessor(uuid4(), mode="chat")
    tid = "u3"
    proc._process_event_data({"type": "text-start", "id": tid})
    proc._process_event_data({"type": "text-delta", "id": tid, "delta": "orphan"})
    proc._process_event_data({"type": "finish", "messageMetadata": {}})

    parts = proc.assistant_messages[0]["parts"]
    assert len(parts) == 1
    assert parts[0]["text"] == "orphan"


def test_two_tool_calls_interleaved():
    """Two distinct toolCallId values produce two tool parts in order."""
    proc = StreamEventProcessor(uuid4(), mode="chat")

    def tool_seq(tcid: str, name: str, out: dict):
        proc._process_event_data(
            {
                "type": "tool-input-start",
                "toolCallId": tcid,
                "toolName": name,
            },
        )
        proc._process_event_data(
            {
                "type": "tool-input-available",
                "toolCallId": tcid,
                "toolName": name,
                "input": {},
            },
        )
        proc._process_event_data(
            {
                "type": "tool-output-available",
                "toolCallId": tcid,
                "output": out,
            },
        )

    tool_seq("a", "tool_a", {"v": 1})
    tool_seq("b", "tool_b", {"v": 2})
    proc._process_event_data({"type": "finish", "messageMetadata": {}})

    parts = proc.assistant_messages[0]["parts"]
    assert parts[0]["toolCallId"] == "a"
    assert parts[1]["toolCallId"] == "b"
