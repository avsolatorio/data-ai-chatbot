"""OpenTelemetry spans for LangGraph pipeline nodes."""

from __future__ import annotations

import functools
import inspect
from collections.abc import Callable
from typing import Any, cast

from opentelemetry import trace

_tracer = trace.get_tracer("ai_chatbot.graph")


def _span_attributes_from_state(state: dict[str, Any]) -> dict[str, str]:
    attrs: dict[str, str] = {}
    message_id = state.get("message_id")
    if message_id:
        attrs["chatbot.message_id"] = str(message_id)
    intent = state.get("intent")
    if intent:
        attrs["chatbot.intent"] = str(intent)
    forced = state.get("forced_intent")
    if forced:
        attrs["chatbot.forced_intent"] = str(forced)
    model_type = state.get("model_type")
    if model_type:
        attrs["chatbot.model_type"] = str(model_type)
    return attrs


def instrument_graph_node(fn: Callable[..., Any], *, node_name: str) -> Callable[..., Any]:
    """Wrap a graph node so each invocation runs under ``chatbot.graph.<name>`` span."""
    if inspect.iscoroutinefunction(fn):
        fn_async = cast("Callable[..., Any]", fn)

        @functools.wraps(fn_async)
        async def _async_impl(state: dict[str, Any]) -> Any:
            attrs = {"chatbot.graph.node": node_name, **_span_attributes_from_state(state)}
            with _tracer.start_as_current_span(f"chatbot.graph.{node_name}", attributes=attrs):
                return await fn_async(state)

        return _async_impl

    fn_sync = cast("Callable[..., Any]", fn)

    @functools.wraps(fn_sync)
    def _sync_impl(state: dict[str, Any]) -> Any:
        attrs = {"chatbot.graph.node": node_name, **_span_attributes_from_state(state)}
        with _tracer.start_as_current_span(f"chatbot.graph.{node_name}", attributes=attrs):
            return fn_sync(state)

    return _sync_impl
