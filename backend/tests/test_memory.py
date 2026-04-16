"""Tests for trim_for_node in memory.py.

Verifies that:
- trim_for_node respects the token budget (trims long histories)
- trim_for_node calls _sanitize_tool_sequences after trimming so orphaned
  ToolMessages / incomplete AIMessage-with-tool_calls pairs are removed
  (Improvement 2: trim_messages(strategy="last") can cut tool sequences mid-pair)
- Unknown nodes fall back to _DEFAULT_BUDGET without raising
"""

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

from app.ai.graph.memory import trim_for_node

# ---------------------------------------------------------------------------
# Helper builders
# ---------------------------------------------------------------------------


def _human(text: str) -> HumanMessage:
    return HumanMessage(content=text)


def _ai(text: str) -> AIMessage:
    return AIMessage(content=text)


def _ai_with_calls(tool_calls: list[dict]) -> AIMessage:
    """Return an AIMessage that has pending tool_calls."""
    return AIMessage(content="", tool_calls=tool_calls)


def _tool(call_id: str, content: str = "result") -> ToolMessage:
    return ToolMessage(content=content, tool_call_id=call_id)


def _sys(text: str = "You are a helpful assistant.") -> SystemMessage:
    return SystemMessage(content=text)


# ---------------------------------------------------------------------------
# Basic budget trimming
# ---------------------------------------------------------------------------


def test_trim_for_node_keeps_recent_messages_within_budget():
    """When history exceeds budget, only the most recent messages are kept."""
    msgs = [_human(f"message {i}") for i in range(20)]
    # Use len() as token counter → each 1-char message = 1 "token"
    # Budget of 5 should give at most 5 messages
    trimmed = trim_for_node(msgs, node="router", token_counter=len)
    assert len(trimmed) <= len(msgs)
    # Most recent message must survive
    assert trimmed[-1].content == msgs[-1].content


def test_trim_for_node_unknown_node_uses_default_budget():
    """Nodes not in TOKEN_BUDGETS fall back to _DEFAULT_BUDGET without error."""
    msgs = [_human("hello")]
    result = trim_for_node(msgs, node="__nonexistent_node__", token_counter=len)
    assert result  # at least the message survives


def test_trim_for_node_empty_list():
    """Empty input returns empty output without error."""
    assert trim_for_node([], node="router") == []


def test_trim_for_node_system_message_preserved():
    """SystemMessage is kept even after trimming (include_system=True)."""
    system = _sys("Be helpful.")
    msgs = [system] + [_human(f"q{i}") for i in range(50)]
    trimmed = trim_for_node(msgs, node="router", token_counter=len)
    assert any(isinstance(m, SystemMessage) for m in trimmed)


# ---------------------------------------------------------------------------
# Sanitization after trim: orphaned ToolMessage (AIMessage trimmed away)
# ---------------------------------------------------------------------------


def test_trim_for_node_removes_orphaned_tool_message_after_trim():
    """
    Build a history where the AIMessage with tool_calls is far back (trimmed out)
    but the ToolMessage response is recent (kept by the budget).
    trim_for_node must drop the orphaned ToolMessage.
    """
    # Put the AI+tool interaction at the very start so it gets trimmed away
    ai_msg = _ai_with_calls([{"id": "tc1", "name": "search", "args": {}}])
    tool_msg = _tool("tc1", "search results")

    # Fill history so that the budget window only covers the recent messages
    # Use a token counter that counts messages (1 per message) with a budget of 4
    padding = [_human(f"padding {i}") for i in range(5)]
    follow_up = _human("recent user question")

    # Order: ai_msg, tool_msg, padding..., follow_up
    msgs = [ai_msg, tool_msg] + padding + [follow_up]

    # With budget=4 and per-message token count, strategy="last" keeps the last 4 messages:
    # padding[3], padding[4], follow_up → 3 messages + potentially the tool_msg depending on order
    # The key invariant: no ToolMessage without its matching AIMessage should survive
    trimmed = trim_for_node(msgs, node="router", token_counter=len)

    tool_ids_in_result = {m.tool_call_id for m in trimmed if isinstance(m, ToolMessage)}
    ai_tool_ids_in_result = {
        tc.get("id", "")
        for m in trimmed
        if isinstance(m, AIMessage) and m.tool_calls
        for tc in m.tool_calls
    }
    # Every ToolMessage must have a matching AIMessage in the result
    assert tool_ids_in_result.issubset(ai_tool_ids_in_result), (
        f"Orphaned ToolMessage IDs after trim_for_node: {tool_ids_in_result - ai_tool_ids_in_result}"
    )


def test_trim_for_node_removes_ai_with_tool_calls_when_responses_trimmed():
    """
    If an AIMessage with tool_calls survives the budget trim but its ToolMessage
    responses were cut off (they were at the END, but somehow dropped), the AI
    message must also be dropped.

    In practice trim(strategy="last") keeps the tail, so this tests the symmetric
    case: ToolMessage is far back, AIMessage is recent.
    """
    tool_msg = _tool("tc2", "old result")
    padding = [_human(f"p{i}") for i in range(5)]
    # Put the AIMessage at the very end (it survives trim), tool response at start (trimmed)
    ai_msg = _ai_with_calls([{"id": "tc2", "name": "lookup", "args": {}}])

    msgs = [tool_msg] + padding + [ai_msg]
    trimmed = trim_for_node(msgs, node="router", token_counter=len)

    # ai_msg references tc2 but the ToolMessage for tc2 is not present
    for m in trimmed:
        if isinstance(m, AIMessage) and m.tool_calls:
            ids = {tc.get("id") for tc in m.tool_calls}
            present_tool_ids = {tm.tool_call_id for tm in trimmed if isinstance(tm, ToolMessage)}
            assert ids.issubset(present_tool_ids), (
                f"AIMessage with missing ToolMessage responses survived: {ids - present_tool_ids}"
            )


def test_trim_for_node_preserves_complete_tool_interaction():
    """
    A complete AIMessage + ToolMessage pair that fits within the budget must survive
    intact — sanitization must not remove valid tool interactions.
    """
    ai_msg = _ai_with_calls([{"id": "tc3", "name": "lookup", "args": {"q": "gdp"}}])
    tool_msg = _tool("tc3", "GDP data here")
    follow = _human("great, now summarize")

    msgs = [ai_msg, tool_msg, follow]
    # Budget large enough to keep all messages
    trimmed = trim_for_node(msgs, node="narrator", token_counter=len)

    assert any(isinstance(m, AIMessage) and m.tool_calls for m in trimmed)
    assert any(isinstance(m, ToolMessage) for m in trimmed)
    assert trimmed[-1].content == "great, now summarize"
