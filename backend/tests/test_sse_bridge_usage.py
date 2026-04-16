"""Unit tests for usage-tracking logic in _SseBridgeState.

Covers the improvements introduced in the per-node usage disaggregation work:

- _accumulate_node_usage updates both the total accumulator and per-node map (IMP 4 prereq)
- add_usage_from_usage_fragment with node= correctly disaggregates (IMP 4 prereq)
- finalize_chunks includes usageByNode in finish_metadata (Improvement 4)
- router _model key is popped from ru before processing so it doesn't corrupt
  token counts, and the actual model name is used (Improvement 5)
- fill_out_dict includes byNode in final_usage dict (IMP 4)
"""

import json

from app.ai.graph.sse_bridge import _SseBridgeState

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_bridge(model_type: str = "chat-model") -> _SseBridgeState:
    """Return a minimal _SseBridgeState with no live graph required."""
    return _SseBridgeState(
        message_id="msg-test",
        thinking_db_id="thinking-test",
        input_state={
            "model_type": model_type,
            "_tool_sse_queue": None,  # no manual tool SSE
        },
    )


def _usage_fragment(prompt: int, completion: int, total: int | None = None) -> dict:
    return {
        "prompt_tokens": prompt,
        "completion_tokens": completion,
        "total_tokens": total if total is not None else prompt + completion,
    }


# ---------------------------------------------------------------------------
# _accumulate_node_usage
# ---------------------------------------------------------------------------


def test_accumulate_node_usage_initialises_total():
    br = _make_bridge()
    assert br._usage_accum is None
    br.add_usage_from_usage_fragment(
        _usage_fragment(10, 5), model_key="gpt-4.1-mini", node="router"
    )
    assert br._usage_accum is not None
    assert br._usage_accum.inputTokens == 10
    assert br._usage_accum.outputTokens == 5


def test_accumulate_node_usage_sums_total_across_calls():
    br = _make_bridge()
    br.add_usage_from_usage_fragment(
        _usage_fragment(10, 5), model_key="gpt-4.1-mini", node="router"
    )
    br.add_usage_from_usage_fragment(_usage_fragment(20, 8), model_key="gpt-4.1", node="narrator")
    assert br._usage_accum.inputTokens == 30
    assert br._usage_accum.outputTokens == 13


def test_accumulate_node_usage_disaggregates_by_node():
    br = _make_bridge()
    br.add_usage_from_usage_fragment(
        _usage_fragment(10, 5), model_key="gpt-4.1-mini", node="router"
    )
    br.add_usage_from_usage_fragment(_usage_fragment(20, 8), model_key="gpt-4.1", node="narrator")
    br.add_usage_from_usage_fragment(_usage_fragment(5, 2), model_key="gpt-4.1-mini", node="router")

    assert "router" in br._usage_by_node
    assert "narrator" in br._usage_by_node
    assert br._usage_by_node["router"].inputTokens == 15  # 10 + 5
    assert br._usage_by_node["narrator"].inputTokens == 20


def test_accumulate_node_usage_empty_node_not_added_to_by_node():
    br = _make_bridge()
    br.add_usage_from_usage_fragment(_usage_fragment(10, 5), model_key="gpt-4.1-mini", node="")
    # No named node → not added to _usage_by_node, but total is updated
    assert br._usage_by_node == {}
    assert br._usage_accum.inputTokens == 10


# ---------------------------------------------------------------------------
# Improvement 4: finalize_chunks includes usageByNode in finish_metadata
# ---------------------------------------------------------------------------


def _parse_sse_chunks(chunks: list[bytes]) -> list[dict]:
    """Parse raw SSE bytes into event dicts."""
    parsed = []
    for chunk in chunks:
        text = chunk.decode("utf-8")
        for line in text.splitlines():
            if line.startswith("data: "):
                try:
                    parsed.append(json.loads(line[6:]))
                except json.JSONDecodeError:
                    pass
    return parsed


def test_finalize_chunks_includes_usage_by_node_in_finish_metadata():
    """finalize_chunks must put usageByNode in the finish event's messageMetadata."""
    br = _make_bridge()
    br.add_usage_from_usage_fragment(
        _usage_fragment(10, 5), model_key="gpt-4.1-mini", node="router"
    )
    br.add_usage_from_usage_fragment(_usage_fragment(20, 8), model_key="gpt-4.1", node="narrator")

    chunks = br.finalize_chunks()
    events = _parse_sse_chunks(chunks)

    finish_events = [e for e in events if e.get("type") == "finish"]
    assert finish_events, "Expected a finish SSE event"
    finish = finish_events[0]

    metadata = finish.get("messageMetadata") or {}
    assert "usageByNode" in metadata, "finish_metadata must include usageByNode"
    by_node = metadata["usageByNode"]
    assert "router" in by_node
    assert "narrator" in by_node
    assert by_node["router"]["inputTokens"] == 10
    assert by_node["narrator"]["inputTokens"] == 20


def test_finalize_chunks_no_usage_by_node_when_no_named_nodes():
    """If no named nodes were accumulated, usageByNode must not appear in metadata."""
    br = _make_bridge()
    br.add_usage_from_usage_fragment(_usage_fragment(10, 5), model_key="gpt-4.1-mini", node="")

    chunks = br.finalize_chunks()
    events = _parse_sse_chunks(chunks)

    finish_events = [e for e in events if e.get("type") == "finish"]
    finish = finish_events[0]
    metadata = finish.get("messageMetadata") or {}
    # No named nodes → usageByNode should be absent
    assert "usageByNode" not in metadata


def test_finalize_chunks_includes_data_usage_sse_event():
    """A data-usage SSE event with byNode must also be emitted."""
    br = _make_bridge()
    br.add_usage_from_usage_fragment(
        _usage_fragment(10, 5), model_key="gpt-4.1-mini", node="router"
    )

    chunks = br.finalize_chunks()
    events = _parse_sse_chunks(chunks)

    usage_events = [e for e in events if e.get("type") == "data-usage"]
    assert usage_events, "Expected a data-usage SSE event"
    data = usage_events[0].get("data") or {}
    assert "byNode" in data
    assert "router" in data["byNode"]


# ---------------------------------------------------------------------------
# Improvement 5: router _model key is extracted and used as model_key
# ---------------------------------------------------------------------------


def test_router_model_key_extracted_from_underscore_model():
    """
    When router_usage contains the special '_model' key (set by routing.py from
    response.model), the SSE bridge must pop it and use it as the model identifier
    — not leaving it in the token-count dict where it would confuse extract_usage.
    """
    br = _make_bridge(model_type="routing-model-alias")

    # Simulate what routing.py sends: usage dict with _model embedded
    ru = {
        "prompt_tokens": 15,
        "completion_tokens": 3,
        "total_tokens": 18,
        "_model": "gpt-4.1-mini-2025-04-14",  # actual deployed model name
    }
    ru_copy = dict(ru)  # copy: sse_bridge pops _model in-place on its copy

    # Simulate on_chain_end router handling (the same code path in graph_event_to_chunks)
    ru_local = dict(ru_copy)
    routing_model = ru_local.pop("_model", None) or "fallback-model"
    br.add_usage_from_usage_fragment(ru_local, model_key=routing_model, node="router")

    assert br._usage_accum is not None
    assert br._usage_accum.inputTokens == 15
    # Model ID must reflect the actual deployed name, not the alias
    assert "gpt-4.1-mini-2025-04-14" in br._usage_accum.modelId


def test_router_model_key_falls_back_to_settings_when_no_underscore_model():
    """Without _model key, the code must fall back gracefully to the settings value."""
    br = _make_bridge(model_type="fallback-routing-model")

    ru = {"prompt_tokens": 5, "completion_tokens": 1, "total_tokens": 6}
    ru_local = dict(ru)
    routing_model = ru_local.pop("_model", None) or "fallback-routing-model"

    br.add_usage_from_usage_fragment(ru_local, model_key=routing_model, node="router")

    assert br._usage_accum.inputTokens == 5
    assert "fallback-routing-model" in br._usage_accum.modelId


# ---------------------------------------------------------------------------
# Improvement 5: _model key must not corrupt token count parsing
# ---------------------------------------------------------------------------


def test_underscore_model_not_present_in_fragment_passed_to_accumulator():
    """
    After popping _model, the fragment passed to add_usage_from_usage_fragment
    must contain only numeric token fields — no stray _model string.
    This prevents extract_usage from misreading non-numeric values.
    """
    ru = {
        "prompt_tokens": 7,
        "completion_tokens": 2,
        "total_tokens": 9,
        "_model": "some-real-model",
    }
    ru_local = dict(ru)
    routing_model = ru_local.pop("_model", None) or "default"

    assert "_model" not in ru_local, "_model must be removed before passing to accumulator"
    assert ru_local == {"prompt_tokens": 7, "completion_tokens": 2, "total_tokens": 9}
    assert routing_model == "some-real-model"


# ---------------------------------------------------------------------------
# fill_out_dict includes byNode
# ---------------------------------------------------------------------------


def test_fill_out_dict_includes_by_node_in_final_usage():
    """fill_out_dict must attach byNode to the final_usage dict."""
    br = _make_bridge()
    br.add_usage_from_usage_fragment(_usage_fragment(10, 5), model_key="gpt-4.1", node="research")
    br.add_usage_from_usage_fragment(_usage_fragment(8, 3), model_key="gpt-4.1", node="narrator")

    out: dict = {}
    br.fill_out_dict(out)

    final_usage = out.get("final_usage")
    assert final_usage is not None
    assert "byNode" in final_usage
    assert "research" in final_usage["byNode"]
    assert "narrator" in final_usage["byNode"]


def test_fill_out_dict_no_by_node_key_when_no_named_nodes():
    """When only anonymous usage was accumulated, byNode must not appear in final_usage."""
    br = _make_bridge()
    br.add_usage_from_usage_fragment(_usage_fragment(5, 2), model_key="gpt-4.1", node="")

    out: dict = {}
    br.fill_out_dict(out)

    final_usage = out.get("final_usage")
    assert final_usage is not None
    assert "byNode" not in final_usage
