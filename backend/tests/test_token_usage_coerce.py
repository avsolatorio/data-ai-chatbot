"""Tests for ``coerce_graph_final_usage_to_data_usage`` and usage accumulation."""

from types import SimpleNamespace

from app.ai.observability.token_usage import (
    build_data_usage_event_from_usage_only,
    coerce_graph_final_usage_to_data_usage,
    usage_dict_from_langchain_message,
    usage_dict_from_openai_completion_usage,
)

# ---------------------------------------------------------------------------
# DataUsageData.__add__: model ID deduplication (Improvement 5 prereq)
# ---------------------------------------------------------------------------


def test_coerce_langchain_usage_metadata_shape():
    # Model name unlikely to resolve in get_model_info for stable behavior in CI
    result = coerce_graph_final_usage_to_data_usage(
        {"input_tokens": 1, "output_tokens": 2, "total_tokens": 3},
        model="__nonexistent_model_for_tests__",
    )
    assert result.inputTokens == 1
    assert result.outputTokens == 2
    assert result.totalTokens == 3
    assert result.modelId
    assert result.costUSD.totalUSD >= 0.0


def test_usage_dict_from_langchain_message_prefers_usage_metadata():
    msg = SimpleNamespace(
        usage_metadata={"input_tokens": 2, "output_tokens": 1, "total_tokens": 3},
        response_metadata={},
    )
    d = usage_dict_from_langchain_message(msg)
    assert d == {"input_tokens": 2, "output_tokens": 1, "total_tokens": 3}


def test_usage_dict_from_langchain_message_response_metadata_fallback():
    msg = SimpleNamespace(
        usage_metadata={},
        response_metadata={"token_usage": {"prompt_tokens": 4, "completion_tokens": 2}},
    )
    d = usage_dict_from_langchain_message(msg)
    assert d == {"prompt_tokens": 4, "completion_tokens": 2}


def test_usage_dict_from_openai_completion_usage():
    usage = SimpleNamespace(model_dump=lambda **_: {"prompt_tokens": 1, "completion_tokens": 2})
    d = usage_dict_from_openai_completion_usage(usage)
    assert d == {"prompt_tokens": 1, "completion_tokens": 2}


def test_coerce_fast_path_data_usage_dump():
    original = build_data_usage_event_from_usage_only(
        model="chat-model",
        completion_response={
            "usage": {"input_tokens": 5, "output_tokens": 3, "total_tokens": 8},
        },
    ).data
    dumped = original.model_dump()
    again = coerce_graph_final_usage_to_data_usage(dumped, model="unused-on-fast-path")
    assert again.model_dump() == original.model_dump()


def test_data_usage_accumulation_add():
    """Multiple LLM completions for the same model sum via ``DataUsageData.__add__``."""
    a = coerce_graph_final_usage_to_data_usage(
        {"input_tokens": 10, "output_tokens": 1, "total_tokens": 11},
        model="chat-model",
    )
    b = coerce_graph_final_usage_to_data_usage(
        {"input_tokens": 5, "output_tokens": 4, "total_tokens": 9},
        model="chat-model",
    )
    total = a + b
    assert total.inputTokens == 15
    assert total.outputTokens == 5
    assert total.totalTokens == 20
    assert total.modelId == a.modelId == b.modelId


def test_data_usage_add_different_models_combines_ids():
    """Different models must produce a combined model ID (no ValueError)."""
    a = coerce_graph_final_usage_to_data_usage(
        {"input_tokens": 10, "output_tokens": 1, "total_tokens": 11},
        model="router-model",
    )
    b = coerce_graph_final_usage_to_data_usage(
        {"input_tokens": 5, "output_tokens": 4, "total_tokens": 9},
        model="chat-model",
    )
    total = a + b
    assert "router-model" in total.modelId
    assert "chat-model" in total.modelId


def test_data_usage_add_repeated_same_model_does_not_grow_unboundedly():
    """Repeated additions of the same model should not duplicate the model ID string."""
    base = coerce_graph_final_usage_to_data_usage(
        {"input_tokens": 1, "output_tokens": 1, "total_tokens": 2},
        model="gpt-4.1-mini",
    )
    total = base
    for _ in range(10):
        piece = coerce_graph_final_usage_to_data_usage(
            {"input_tokens": 1, "output_tokens": 1, "total_tokens": 2},
            model="gpt-4.1-mini",
        )
        total = total + piece
    # Model ID must contain 'gpt-4.1-mini' exactly once (deduplicated)
    assert total.modelId.count("gpt-4.1-mini") == 1


def test_data_usage_add_three_distinct_models():
    """Three distinct models are all present in the combined model ID."""

    def _make(model: str) -> object:
        return coerce_graph_final_usage_to_data_usage(
            {"input_tokens": 1, "output_tokens": 1, "total_tokens": 2},
            model=model,
        )

    total = _make("model-a") + _make("model-b") + _make("model-c")
    for name in ("model-a", "model-b", "model-c"):
        assert name in total.modelId


# ---------------------------------------------------------------------------
# LangChain usage_metadata translation: cache_read / reasoning (Improvement 1 prereq)
# ---------------------------------------------------------------------------


def test_usage_dict_from_langchain_message_translates_cache_read_detail():
    """cache_read in input_token_details must be translated to prompt_tokens_details.cached_tokens."""
    msg = SimpleNamespace(
        usage_metadata={
            "input_tokens": 100,
            "output_tokens": 20,
            "total_tokens": 120,
            "input_token_details": {"cache_read": 40},
        },
        response_metadata={},
    )
    d = usage_dict_from_langchain_message(msg)
    assert d is not None
    assert d.get("prompt_tokens_details", {}).get("cached_tokens") == 40


def test_usage_dict_from_langchain_message_translates_reasoning_detail():
    """reasoning in output_token_details must be translated to completion_tokens_details.reasoning_tokens."""
    msg = SimpleNamespace(
        usage_metadata={
            "input_tokens": 50,
            "output_tokens": 30,
            "total_tokens": 80,
            "output_token_details": {"reasoning": 15},
        },
        response_metadata={},
    )
    d = usage_dict_from_langchain_message(msg)
    assert d is not None
    assert d.get("completion_tokens_details", {}).get("reasoning_tokens") == 15


def test_usage_dict_from_langchain_message_translates_both_details():
    """Both cache_read and reasoning detail can coexist in the same translation."""
    msg = SimpleNamespace(
        usage_metadata={
            "input_tokens": 200,
            "output_tokens": 50,
            "total_tokens": 250,
            "input_token_details": {"cache_read": 80},
            "output_token_details": {"reasoning": 20},
        },
        response_metadata={},
    )
    d = usage_dict_from_langchain_message(msg)
    assert d is not None
    assert d.get("prompt_tokens_details", {}).get("cached_tokens") == 80
    assert d.get("completion_tokens_details", {}).get("reasoning_tokens") == 20


def test_usage_dict_from_langchain_message_zero_cache_read_not_injected():
    """A cache_read of 0 must not be injected (avoids spurious cache hit reporting)."""
    msg = SimpleNamespace(
        usage_metadata={
            "input_tokens": 10,
            "output_tokens": 5,
            "total_tokens": 15,
            "input_token_details": {"cache_read": 0},
        },
        response_metadata={},
    )
    d = usage_dict_from_langchain_message(msg)
    # Either the key is absent or it maps to 0/falsy
    if d is not None:
        cached = d.get("prompt_tokens_details", {}).get("cached_tokens", 0)
        assert cached == 0


# ---------------------------------------------------------------------------
# Router _model key: routing.py must embed response.model (Improvement 5)
# ---------------------------------------------------------------------------


def test_usage_dict_from_openai_completion_usage_round_trips():
    """usage_dict_from_openai_completion_usage must preserve all token fields."""
    usage = SimpleNamespace(
        model_dump=lambda **_: {
            "prompt_tokens": 12,
            "completion_tokens": 3,
            "total_tokens": 15,
            "prompt_tokens_details": {"cached_tokens": 5},
            "completion_tokens_details": {"reasoning_tokens": 2},
        }
    )
    d = usage_dict_from_openai_completion_usage(usage)
    assert d["prompt_tokens"] == 12
    assert d["completion_tokens"] == 3
    assert d["prompt_tokens_details"]["cached_tokens"] == 5
    assert d["completion_tokens_details"]["reasoning_tokens"] == 2
