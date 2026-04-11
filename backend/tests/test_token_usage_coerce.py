"""Tests for ``coerce_graph_final_usage_to_data_usage`` and usage accumulation."""

from app.ai.observability.token_usage import (
    build_data_usage_event_from_usage_only,
    coerce_graph_final_usage_to_data_usage,
)


def test_coerce_langchain_usage_metadata_shape():
    result = coerce_graph_final_usage_to_data_usage(
        {"input_tokens": 1, "output_tokens": 2, "total_tokens": 3},
        model="chat-model",
    )
    assert result.inputTokens == 1
    assert result.outputTokens == 2
    assert result.totalTokens == 3
    assert result.modelId
    assert result.context.outputMax == 0
    assert result.costUSD.totalUSD == 0.0


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
