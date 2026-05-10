"""SSE bridge: maps graph.astream_events(version="v2") → existing SSE byte protocol.

The frontend expects a specific SSE event format (data-thinking, text-start,
text-delta, text-end, finish, …).  This module translates LangGraph's generic
event stream into that protocol so the frontend needs zero changes.

**Manual tool streaming:** Research / narrator / direct nodes execute tools with
``tool.ainvoke`` inside Python loops. They call :mod:`graph_tool_notify` to push
tool lifecycle messages to ``input_state["_tool_sse_queue"]``; the bridge merges
that queue with ``astream_events``.

LangGraph may *also* emit ``on_tool_start`` / ``on_tool_end`` for the same
invocations (traced tool runs). When ``_tool_sse_queue`` is set, those graph
tool events are **ignored** so each tool is emitted exactly once — matching the
classic stream (single source of truth).

Event → SSE mapping by langgraph_node (when LangGraph emits them):
    router    → routing reasoning wrapped in DataThinkingPart (after node ends)
    research  → on_chat_model_stream  → DataThinkingPart(TextDeltaPart)
    narrator  → on_chat_model_stream  → TextStartPart / TextDeltaPart / TextEndPart
                (+ on_chat_model_end fallback when the provider omits token streams)
    direct    → same as narrator

DB persistence (``assistant_parts_for_db``): mirrors :class:`StreamEventProcessor`
shapes — research tools wrapped in ``data-thinking``; narrator/direct tools and
text segments stored as top-level parts so reload shows tools in order.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, AsyncGenerator
from uuid import uuid4

from app.ai.graph.graph_debug_log import (
    graph_llm_log_enabled,
    log_langgraph_raw_event,
    log_llm_tool_manual,
    log_pipeline_error,
    log_pipeline_input,
    log_pipeline_output,
)
from app.ai.graph.tool_output_normalize import normalize_tool_output_for_ui
from app.ai.observability.token_usage import (
    DataUsageData,
    DataUsageEvent,
    coerce_graph_final_usage_to_data_usage,
    usage_dict_from_langchain_message,
    usage_dict_is_nonzero,
)
from app.ai.protocols.stream import (
    TEXT_STATE_DONE,
    TOOL_STATE_INPUT_AVAILABLE,
    TOOL_STATE_OUTPUT_AVAILABLE,
    DataPart,
    DataThinkingPart,
    DoneMarker,
    ErrorPart,
    FinishMessagePart,
    TextDeltaPart,
    TextEndPart,
    TextStartPart,
    ToolInputAvailablePart,
    ToolInputStartPart,
    ToolOutputAvailablePart,
)
from app.utils.error_id import USER_MESSAGE_GENERIC, new_error_id

from .llm_invoke import LLM_POLICY_BLOCKED_TEXT, LLM_STEP_FAILED_TEXT
from .message_utils import plain_text_from_ai_message_content

try:
    from litellm.exceptions import ContentPolicyViolationError
except ImportError:  # pragma: no cover

    class ContentPolicyViolationError(Exception):  # type: ignore[misc, no-redef]
        """Fallback if litellm is not installed."""

        pass


logger = logging.getLogger(__name__)

_GRAPH_DONE = object()


def _root_cause(exc: BaseException) -> BaseException:
    """Unwrap ExceptionGroup (e.g. LangGraph task groups) to a leaf exception."""
    if isinstance(exc, BaseExceptionGroup):

        def find_content_policy(e: BaseException) -> BaseException | None:
            if isinstance(e, ContentPolicyViolationError):
                return e
            if isinstance(e, BaseExceptionGroup):
                for sub in e.exceptions:
                    found = find_content_policy(sub)
                    if found is not None:
                        return found
            return None

        preferred = find_content_policy(exc)
        if preferred is not None:
            return preferred
        if len(exc.exceptions) == 1:
            return _root_cause(exc.exceptions[0])
        return exc.exceptions[0]
    return exc


def _user_visible_stream_error(root: BaseException, error_id: str) -> str:
    ref = f" Reference: {error_id}."
    if isinstance(root, ContentPolicyViolationError):
        return (
            "The model provider blocked this reply under its content safety rules. "
            "Try rephrasing your question or narrowing the topic."
        ) + ref
    return USER_MESSAGE_GENERIC + ref


def _terminal_error_chunks(br: _SseBridgeState, root: BaseException, error_id: str) -> list[bytes]:
    """SSE chunks to finish the stream after a graph/model failure (no ASGI crash)."""
    chunks: list[bytes] = []
    br.flush_research_text_to_db()
    br.flush_narrator_segment_to_db()
    if br.answer_text_started:
        chunks.append(TextEndPart(id=br.text_part_id).to_sse().encode("utf-8"))
    msg = _user_visible_stream_error(root, error_id)
    chunks.append(ErrorPart(errorText=msg).to_sse().encode("utf-8"))
    chunks.append(FinishMessagePart(messageMetadata=None).to_sse().encode("utf-8"))
    chunks.append(DoneMarker().to_sse().encode("utf-8"))
    return chunks


# Nodes whose LLM tokens go into the data-thinking envelope (hidden in collapsible panel)
# summarizer, planner, scout, transformer are non-streaming → LLM text not emitted;
# scout tool events still appear via the manual notify queue
_THINKING_NODES = frozenset({"research", "explain", "recovery", "quick_answer"})

# Nodes whose LLM tokens are emitted as plain visible text
_ANSWER_NODES = frozenset({"narrator", "direct", "clarifier", "suggester", "followup"})

# Non-streaming background nodes (no SSE text emitted, but tokens must be counted).
# "router" uses ChatLiteLLM via check_intent() so its on_chat_model_end fires here;
# "summarizer" compresses history in the background.
_BACKGROUND_NODES: frozenset[str] = frozenset({"router", "summarizer"})

# Non-streaming pre-research nodes — transformer/scout/planner removed in refactor
_PREPROCESSING_NODES: frozenset[str] = frozenset()  # transformer/scout/planner removed
_PREPROCESSING_STATUS: dict[str, str] = {}

_LLM_NODES = _THINKING_NODES | _ANSWER_NODES | _BACKGROUND_NODES


def _unwrap_chat_model_end_output(output: Any) -> Any:
    """LangGraph ``on_chat_model_end`` may pass a ``ChatGeneration`` with ``.message``."""
    if output is None:
        return None
    msg = getattr(output, "message", None)
    if msg is not None:
        return msg
    return output


def _text_from_chat_model_end_message(msg: Any) -> str:
    """Plain text from an ``AIMessage``-like object at ``on_chat_model_end`` (no tool JSON)."""
    if msg is None:
        return ""
    return plain_text_from_ai_message_content(getattr(msg, "content", None))


def _extract_model_id_from_message(msg: Any) -> str | None:
    """Try to read the real deployed model name from an AIMessage's response_metadata.

    LangChain stores the model name returned by the API in ``response_metadata``
    under ``model_name`` (OpenAI) or ``model`` (Anthropic / Azure).  Using this
    avoids storing the internal enum value (e.g. ``"chat-model-reasoning"``) as
    the model ID in usage records.
    """
    if msg is None:
        return None
    rm = getattr(msg, "response_metadata", None)
    if not isinstance(rm, dict):
        return None
    for key in ("model_name", "model", "model_id"):
        value = rm.get(key)
        if value and isinstance(value, str):
            return value
    return None


class _SseBridgeState:
    """Mutable streaming state shared between LangGraph events and manual tool queue."""

    __slots__ = (
        "message_id",
        "thinking_db_id",
        "input_state",
        "text_part_id",
        "answer_text_started",
        "_routing_reasoning",
        "_answer_text_parts",
        "_usage_accum",
        "_usage_by_node",
        "_db_parts",
        "_research_text_buf",
        "_research_tool_parts",
        "_narrator_segment",
        "_answer_tool_parts",
        "_stages_emitted",
        "_manual_tool_sse",
        "_stream_failed",
        "_final_graph_state",
        "_preprocessing_run_ids",
        "_answer_run_stream_acc",
        "_prepend_sep_before_next_answer_delta",
    )

    def __init__(
        self,
        *,
        message_id: str,
        thinking_db_id: str,
        input_state: dict,
    ) -> None:
        self.message_id = message_id
        self.thinking_db_id = thinking_db_id
        self.input_state = input_state
        # Single source: notify_tool_* queue; avoid duplicating traced on_tool_* events
        self._manual_tool_sse = input_state.get("_tool_sse_queue") is not None
        # Assumption: There is only one continuous visible answer stream (e.g., from
        # the narrator or direct node) per message turn. Thus, a single text_part_id
        # is generated and reused for the entire sequence of answer text deltas.
        self.text_part_id = f"text-{uuid4().hex}"
        self.answer_text_started = False
        self._routing_reasoning: str = ""
        self._answer_text_parts: list[str] = []
        self._usage_accum: DataUsageData | None = None
        self._usage_by_node: dict[str, DataUsageData] = {}
        self._db_parts: list[dict] = []
        self._research_text_buf: list[str] = []
        self._research_tool_parts: dict[str, dict] = {}
        self._narrator_segment: list[str] = []
        self._answer_tool_parts: dict[str, dict] = {}
        self._stages_emitted: set[str] = set()
        self._stream_failed = False
        self._final_graph_state: dict = {}
        # Stable run-id per preprocessing node — shared between start and end events
        # so the frontend can match them and animate running → done in place.
        self._preprocessing_run_ids: dict[str, str] = {}
        # Per LangGraph LLM ``run_id``: streamed text for that invocation only (narrator
        # may call the model multiple times in one node — prefix match must be local).
        self._answer_run_stream_acc: dict[str, str] = {}
        # After narrator (or any visible answer), the next answer node (e.g. followup)
        # must not concatenate flush against the prior character (e.g. "estimate---").
        self._prepend_sep_before_next_answer_delta: bool = False

    def _node_progress_chunks(
        self,
        node: str,
        status: str,
        message: str,
    ) -> list[bytes]:
        """Emit a node-progress event into the data-thinking panel.

        status="running" → frontend shows animated spinner + message text.
        status="done"    → frontend replaces spinner with checkmark + result text.

        Both events share the same stable ``id`` keyed by node name so the
        frontend Map entry is overwritten in-place (running → done transition).
        """
        if status == "running":
            run_id = f"np-{node}-{uuid4().hex[:8]}"
            self._preprocessing_run_ids[node] = run_id
        else:
            run_id = self._preprocessing_run_ids.get(node, f"np-{node}-{uuid4().hex[:8]}")

        return [
            DataThinkingPart(
                id=self.message_id,
                data={
                    "type": "node-progress",
                    "id": run_id,
                    "node": node,
                    "status": status,
                    "message": message,
                },
            )
            .to_sse()
            .encode("utf-8")
        ]

    def flush_research_text_to_db(self) -> None:
        if not self._research_text_buf:
            return
        merged = "".join(self._research_text_buf)
        self._research_text_buf.clear()
        if not merged:
            return
        inner = {
            "type": "text",
            "text": merged,
            "state": TEXT_STATE_DONE,
            "providerMetadata": {"openai": {"itemId": f"research-{uuid4().hex}"}},
        }
        self._db_parts.append({"type": "data-thinking", "id": self.thinking_db_id, "data": inner})

    def flush_narrator_segment_to_db(self) -> None:
        if not self._narrator_segment:
            return
        merged = "".join(self._narrator_segment)
        self._narrator_segment.clear()
        if not merged:
            return
        inner = {
            "type": "text",
            "text": merged,
            "state": TEXT_STATE_DONE,
            "providerMetadata": {"openai": {"itemId": f"narrator-{uuid4().hex}"}},
        }
        self._db_parts.append(inner)

    def _emit_answer_text_delta(self, text: str, chunks: list[bytes]) -> None:
        if not text:
            return
        if self._prepend_sep_before_next_answer_delta:
            if not text.startswith(("\n", "\r")):
                text = "\n\n" + text
            self._prepend_sep_before_next_answer_delta = False
        self._answer_text_parts.append(text)
        self._narrator_segment.append(text)
        if not self.answer_text_started:
            self.answer_text_started = True
            chunks.append(TextStartPart(id=self.text_part_id).to_sse().encode("utf-8"))
        chunks.append(TextDeltaPart(id=self.text_part_id, delta=text).to_sse().encode("utf-8"))

    def _chunks_answer_text_fallback_from_end(self, *, run_id: str, output: Any) -> list[bytes]:
        """Emit answer text from ``on_chat_model_end`` when token stream events were absent.

        Narrator/direct/clarifier use ``llm.ainvoke`` with ``streaming=True``. LangGraph
        usually forwards ``on_chat_model_stream``, but some LiteLLM/provider paths only
        surface the assembled message on ``on_chat_model_end``, which produced empty UI
        and empty ``assistant_parts_for_db`` text before this fallback.
        """
        chunks: list[bytes] = []
        full_text = _text_from_chat_model_end_message(_unwrap_chat_model_end_output(output))
        if not full_text.strip():
            self._answer_run_stream_acc.pop(run_id, None)
            return chunks
        if not run_id:
            # Avoid cross-run collisions when providers omit run_id. In this case we
            # cannot safely correlate stream/end events for prefix-diff fallback.
            return chunks
        streamed = self._answer_run_stream_acc.pop(run_id, "")
        if full_text.startswith(streamed):
            gap = full_text[len(streamed) :]
        elif not streamed:
            # Guard against run_id mismatches: if streaming is already underway
            # (answer_text_started=True), an empty accumulator means the stream
            # events were tracked under a different run_id — not that the provider
            # skipped streaming. In that case, the narrator has already emitted the
            # full text via on_chat_model_stream; re-emitting here would duplicate
            # the response. Only fall back to full_text for genuine non-streaming
            # providers (where answer_text_started is still False).
            gap = full_text if not self.answer_text_started else ""
            if gap == "" and self.answer_text_started:
                logger.debug(
                    "[sse_bridge] answer fallback skipped (run_id mismatch, streaming already active) "
                    "message_id=%s run_id=%s full_len=%d",
                    self.message_id,
                    run_id,
                    len(full_text),
                )
        else:
            gap = ""
            logger.debug(
                "[sse_bridge] answer fallback skipped (stream prefix mismatch) "
                "message_id=%s run_id=%s streamed_len=%d full_len=%d",
                self.message_id,
                run_id,
                len(streamed),
                len(full_text),
            )
        if gap:
            self._emit_answer_text_delta(gap, chunks)
        return chunks

    def _accumulate_node_usage(self, node: str, piece: DataUsageData) -> None:
        """Add piece to both the total accumulator and the per-node accumulator."""
        if self._usage_accum is None:
            self._usage_accum = piece
        else:
            self._usage_accum = self._usage_accum + piece
        if node:
            if node not in self._usage_by_node:
                self._usage_by_node[node] = piece
            else:
                self._usage_by_node[node] = self._usage_by_node[node] + piece

    def add_usage_from_usage_fragment(
        self, raw: dict[str, Any], *, model_key: str, node: str = ""
    ) -> None:
        """Merge one usage blob (OpenAI or LangChain-shaped) into the accumulator."""
        if not raw or not usage_dict_is_nonzero(raw):
            return
        mk = model_key or str(self.input_state.get("model_type") or "")
        piece = coerce_graph_final_usage_to_data_usage(raw, model=mk)
        self._accumulate_node_usage(node, piece)

    def add_usage_from_message(self, output_msg: Any, *, node: str = "") -> None:
        unwrapped = _unwrap_chat_model_end_output(output_msg)
        raw = usage_dict_from_langchain_message(unwrapped)
        if not raw:
            return
        # Prefer the actual model name from the API response over the internal
        # enum value stored in model_type (e.g. "chat-model-reasoning").
        model_key = _extract_model_id_from_message(unwrapped) or str(
            self.input_state.get("model_type") or ""
        )
        self.add_usage_from_usage_fragment(raw, model_key=model_key, node=node)

    def make_stage_sse(self, stage: str) -> bytes | None:
        if stage in self._stages_emitted:
            return None
        self._stages_emitted.add(stage)
        return DataPart(type="data-stage", data={"stage": stage}).to_sse().encode("utf-8")

    def graph_event_to_chunks(self, event: dict) -> list[bytes]:
        chunks: list[bytes] = []
        evt_type: str = event.get("event", "")
        evt_name: str = event.get("name", "")
        run_id: str = event.get("run_id", "")
        metadata: dict = event.get("metadata", {})
        data: dict = event.get("data", {})
        node: str = metadata.get("langgraph_node", "")

        if evt_type == "on_chain_start" and evt_name in _THINKING_NODES:
            stage_bytes = self.make_stage_sse("interpreting")
            if stage_bytes:
                chunks.append(stage_bytes)

        elif evt_type == "on_chain_start" and evt_name in _ANSWER_NODES:
            self.flush_research_text_to_db()
            # New answer subgraph after we already streamed user-visible text — insert a
            # paragraph break before the next delta (narrator → followup, etc.).
            if self._answer_text_parts and "".join(self._answer_text_parts).strip():
                self._prepend_sep_before_next_answer_delta = True
            stage_bytes = self.make_stage_sse("generating")
            if stage_bytes:
                chunks.append(stage_bytes)

        elif (
            evt_type == "on_chain_end"
            and not metadata.get("langgraph_node")
            and isinstance(data.get("output"), dict)
        ):
            # Top-level graph on_chain_end — capture final state for persistence
            self._final_graph_state = data["output"]

        elif evt_type == "on_chain_end" and evt_name == "router":
            # Usage is now tracked automatically via on_chat_model_end (router is in
            # _BACKGROUND_NODES) — no manual router_usage extraction needed here.
            output: dict = data.get("output", {}) or {}
            reasoning: str = output.get("routing_reasoning", "")
            self._routing_reasoning = reasoning
            if reasoning:
                reason_id = f"routing-reason-{self.message_id}"
                for part in (
                    TextStartPart(id=reason_id),
                    TextDeltaPart(id=reason_id, delta=reasoning),
                    TextEndPart(id=reason_id),
                ):
                    chunks.append(
                        DataThinkingPart(
                            id=self.message_id,
                            data=part.model_dump(exclude_none=True),
                        )
                        .to_sse()
                        .encode("utf-8")
                    )

        elif evt_type == "on_chat_model_stream" and node in _THINKING_NODES:
            chunk = data.get("chunk")
            content = plain_text_from_ai_message_content(
                chunk.content if (chunk and hasattr(chunk, "content")) else None
            )
            if content:
                self._research_text_buf.append(content)
                inner_id = f"research-{self.message_id}"
                chunks.append(
                    DataThinkingPart(
                        id=self.message_id,
                        data=TextDeltaPart(id=inner_id, delta=content).model_dump(
                            exclude_none=True
                        ),
                    )
                    .to_sse()
                    .encode("utf-8")
                )

        elif evt_type == "on_chat_model_end" and node in _LLM_NODES:
            self.add_usage_from_message(data.get("output"), node=node)
            if node in _ANSWER_NODES:
                chunks.extend(
                    self._chunks_answer_text_fallback_from_end(
                        run_id=str(run_id or ""),
                        output=data.get("output"),
                    )
                )

        elif not self._manual_tool_sse and evt_type == "on_tool_start" and node in _THINKING_NODES:
            chunks.extend(
                self._chunks_research_tool_start(
                    tool_call_id=run_id,
                    tool_name=evt_name
                    or (data.get("name") if isinstance(data.get("name"), str) else "")
                    or "tool",
                    tool_input_raw=data.get("input", {}),
                )
            )

        elif not self._manual_tool_sse and evt_type == "on_tool_end" and node in _THINKING_NODES:
            chunks.extend(
                self._chunks_research_tool_end(
                    tool_call_id=run_id,
                    output=data.get("output", ""),
                )
            )

        elif evt_type == "on_chat_model_stream" and node in _ANSWER_NODES:
            chunk = data.get("chunk")
            content = plain_text_from_ai_message_content(
                chunk.content if (chunk and hasattr(chunk, "content")) else None
            )
            if content:
                run_key = str(run_id or "")
                if run_key:
                    self._answer_run_stream_acc[run_key] = (
                        self._answer_run_stream_acc.get(run_key, "") + content
                    )
                self._emit_answer_text_delta(content, chunks)

        elif not self._manual_tool_sse and evt_type == "on_tool_start" and node in _ANSWER_NODES:
            chunks.extend(
                self._chunks_answer_tool_start(
                    tool_call_id=run_id,
                    tool_name=evt_name
                    or (data.get("name") if isinstance(data.get("name"), str) else "")
                    or "tool",
                    tool_input_raw=data.get("input", {}),
                )
            )

        elif not self._manual_tool_sse and evt_type == "on_tool_end" and node in _ANSWER_NODES:
            chunks.extend(
                self._chunks_answer_tool_end(
                    tool_call_id=run_id,
                    output=data.get("output", ""),
                )
            )

        return chunks

    def manual_tool_to_chunks(self, payload: dict) -> list[bytes]:
        phase = payload.get("phase")
        graph_node = payload.get("graph_node", "")
        tool_name = str(payload.get("tool_name") or "tool")
        tool_call_id = str(payload.get("tool_call_id") or tool_name)
        if graph_llm_log_enabled():
            if phase == "start":
                log_llm_tool_manual(
                    message_id=self.message_id,
                    graph_node=str(graph_node),
                    tool_name=tool_name,
                    phase="start",
                    payload_summary=f"input={payload.get('input', {})!r}",
                )
            elif phase == "end":
                log_llm_tool_manual(
                    message_id=self.message_id,
                    graph_node=str(graph_node),
                    tool_name=tool_name,
                    phase="end",
                    payload_summary=f"output={payload.get('output', '')!r}",
                )
        if phase == "start":
            if graph_node in _THINKING_NODES:
                return self._chunks_research_tool_start(
                    tool_call_id=tool_call_id,
                    tool_name=tool_name,
                    tool_input_raw=payload.get("input", {}),
                )
            if graph_node in _ANSWER_NODES:
                return self._chunks_answer_tool_start(
                    tool_call_id=tool_call_id,
                    tool_name=tool_name,
                    tool_input_raw=payload.get("input", {}),
                )
        elif phase == "end":
            raw_out = payload.get("output", "")
            if graph_node in _THINKING_NODES:
                return self._chunks_research_tool_end(tool_call_id=tool_call_id, output=raw_out)
            if graph_node in _ANSWER_NODES:
                return self._chunks_answer_tool_end(tool_call_id=tool_call_id, output=raw_out)
        return []

    def _normalize_tool_input(self, tool_input_raw: Any) -> tuple[dict, Any]:
        if isinstance(tool_input_raw, dict):
            return tool_input_raw, tool_input_raw
        wrapped = {"value": tool_input_raw}
        return wrapped, tool_input_raw

    def _chunks_research_tool_start(
        self,
        *,
        tool_call_id: str,
        tool_name: str,
        tool_input_raw: Any,
    ) -> list[bytes]:
        chunks: list[bytes] = []
        tool_input, raw_for_available = self._normalize_tool_input(tool_input_raw)
        self.flush_research_text_to_db()
        stage_bytes = self.make_stage_sse("retrieving")
        if stage_bytes:
            chunks.append(stage_bytes)
        self._research_tool_parts[tool_call_id] = {
            "type": f"tool-{tool_name}",
            "toolCallId": tool_call_id,
            "state": TOOL_STATE_INPUT_AVAILABLE,
            "input": tool_input,
            "output": {},
            "callProviderMetadata": {"openai": {"itemId": tool_call_id}},
        }
        chunks.append(
            DataThinkingPart(
                id=self.message_id,
                data=ToolInputStartPart(toolCallId=tool_call_id, toolName=tool_name).model_dump(
                    exclude_none=True
                ),
            )
            .to_sse()
            .encode("utf-8")
        )
        chunks.append(
            DataThinkingPart(
                id=self.message_id,
                data=ToolInputAvailablePart(
                    toolCallId=tool_call_id,
                    toolName=tool_name,
                    input=raw_for_available,
                ).model_dump(exclude_none=True),
            )
            .to_sse()
            .encode("utf-8")
        )
        return chunks

    def _chunks_research_tool_end(self, *, tool_call_id: str, output: Any) -> list[bytes]:
        if isinstance(output, (dict, list, str, bool, int, float)) or output is None:
            coerced = output
        else:
            coerced = str(output)
        output_value = normalize_tool_output_for_ui(coerced)
        part = self._research_tool_parts.pop(tool_call_id, None)
        if part:
            part["output"] = output_value
            part["state"] = TOOL_STATE_OUTPUT_AVAILABLE
            self._db_parts.append(
                {"type": "data-thinking", "id": self.thinking_db_id, "data": part}
            )
        return [
            DataThinkingPart(
                id=self.message_id,
                data=ToolOutputAvailablePart(
                    toolCallId=tool_call_id,
                    output=output_value,
                ).model_dump(exclude_none=True),
            )
            .to_sse()
            .encode("utf-8")
        ]

    def _chunks_answer_tool_start(
        self,
        *,
        tool_call_id: str,
        tool_name: str,
        tool_input_raw: Any,
    ) -> list[bytes]:
        chunks: list[bytes] = []
        tool_input, raw_for_available = self._normalize_tool_input(tool_input_raw)
        self.flush_narrator_segment_to_db()
        self._answer_tool_parts[tool_call_id] = {
            "type": f"tool-{tool_name}",
            "toolCallId": tool_call_id,
            "state": TOOL_STATE_INPUT_AVAILABLE,
            "input": tool_input,
            "output": {},
            "callProviderMetadata": {"openai": {"itemId": tool_call_id}},
        }
        chunks.append(
            ToolInputStartPart(toolCallId=tool_call_id, toolName=tool_name).to_sse().encode("utf-8")
        )
        chunks.append(
            ToolInputAvailablePart(
                toolCallId=tool_call_id,
                toolName=tool_name,
                input=raw_for_available,
            )
            .to_sse()
            .encode("utf-8")
        )
        return chunks

    def _chunks_answer_tool_end(self, *, tool_call_id: str, output: Any) -> list[bytes]:
        if isinstance(output, (dict, list, str, bool, int, float)) or output is None:
            coerced = output
        else:
            coerced = str(output)
        output_value = normalize_tool_output_for_ui(coerced)
        part = self._answer_tool_parts.pop(tool_call_id, None)
        if part:
            part["output"] = output_value
            part["state"] = TOOL_STATE_OUTPUT_AVAILABLE
            self._db_parts.append(part)
        return [
            ToolOutputAvailablePart(
                toolCallId=tool_call_id,
                output=output_value,
            )
            .to_sse()
            .encode("utf-8")
        ]

    def finalize_chunks(self) -> list[bytes]:
        chunks: list[bytes] = []
        self.flush_research_text_to_db()
        self.flush_narrator_segment_to_db()
        if self.answer_text_started:
            chunks.append(TextEndPart(id=self.text_part_id).to_sse().encode("utf-8"))
        if isinstance(self._final_graph_state, dict) and self._final_graph_state.get(
            "content_policy_blocked"
        ):
            blocked_id = f"followup-blocked-{self.message_id}"
            for part in (
                TextStartPart(id=blocked_id),
                TextDeltaPart(id=blocked_id, delta=LLM_POLICY_BLOCKED_TEXT),
                TextEndPart(id=blocked_id),
            ):
                chunks.append(part.to_sse().encode("utf-8"))
        # Emit data-quickAnswerCard payload for the frontend card renderer.
        # Type matches the CustomUIDataTypes key 'quickAnswerCard' with the 'data-' prefix
        # that the AI SDK uses to map DataParts to message.parts — enabling persistence.
        if isinstance(self._final_graph_state, dict):
            card = self._final_graph_state.get("quick_answer_card")
            if card and isinstance(card, dict):
                chunks.append(
                    DataPart(type="data-quickAnswerCard", data=card).to_sse().encode("utf-8")
                )
        finish_metadata: dict = {}
        if self._usage_accum:
            finish_metadata["usage"] = DataUsageEvent(data=self._usage_accum).model_dump()
            usage_sse_payload = self._usage_accum.model_dump()
            if self._usage_by_node:
                by_node_dump = {k: v.model_dump() for k, v in self._usage_by_node.items()}
                usage_sse_payload["byNode"] = by_node_dump
                # Also surface byNode in finish_metadata so the non-streaming path
                # (chat.py / chat_stream.py) can pick it up from the SSE finish event.
                finish_metadata["usageByNode"] = by_node_dump
            chunks.append(
                DataPart(type="data-usage", data=usage_sse_payload).to_sse().encode("utf-8")
            )
        chunks.append(
            FinishMessagePart(
                messageMetadata=finish_metadata if finish_metadata else None,
            )
            .to_sse()
            .encode("utf-8")
        )
        chunks.append(DoneMarker().to_sse().encode("utf-8"))
        return chunks

    def fill_out_dict(self, out: dict) -> None:
        out["routing_reasoning"] = self._routing_reasoning
        out["answer_text"] = "".join(self._answer_text_parts)
        if self._usage_accum is None:
            bucket = self.input_state.get("_usage_fallback_bucket")
            fallback_parts: list = (
                list(bucket.parts) if bucket is not None and hasattr(bucket, "parts") else []
            )
            model_key = str(self.input_state.get("model_type") or "")
            for entry in fallback_parts:
                # New format: {"node": str, "raw": dict}
                if isinstance(entry, dict) and "raw" in entry:
                    raw = entry["raw"]
                    entry_node = entry.get("node") or ""
                else:
                    # Legacy bare dict fallback
                    raw = entry
                    entry_node = ""
                if not isinstance(raw, dict) or not usage_dict_is_nonzero(raw):
                    continue
                try:
                    piece = coerce_graph_final_usage_to_data_usage(raw, model=model_key)
                except TypeError as exc:
                    logger.debug("LLM usage fallback piece skipped: %s", exc)
                    continue
                self._accumulate_node_usage(entry_node, piece)
        usage_dict = self._usage_accum.model_dump() if self._usage_accum else None
        if usage_dict and self._usage_by_node:
            usage_dict["byNode"] = {k: v.model_dump() for k, v in self._usage_by_node.items()}
        out["final_usage"] = usage_dict
        out["assistant_parts_for_db"] = self._db_parts
        out["stream_failed"] = self._stream_failed
        # Expose session summary for persistence by chat.py
        if self._final_graph_state:
            out["session_summary"] = self._final_graph_state.get("session_summary") or ""
            out["summarized_message_count"] = (
                self._final_graph_state.get("summarized_message_count") or 0
            )
            out["quick_answer_card"] = self._final_graph_state.get("quick_answer_card")
            # Merge agent trace parts into db_parts for persistence
            trace_parts = self._final_graph_state.get("agent_trace_parts") or []
            if trace_parts:
                self._db_parts.extend(trace_parts)
            # Non-streaming follow-up may only exist on graph state — persist short markers
            assistant_tail = self._final_graph_state.get("assistant_parts") or []
            for p in assistant_tail:
                if not isinstance(p, dict) or p.get("type") != "text":
                    continue
                tx = (p.get("text") or "").strip()
                if tx not in (LLM_POLICY_BLOCKED_TEXT, LLM_STEP_FAILED_TEXT):
                    continue
                if any(
                    isinstance(x, dict)
                    and x.get("type") == "text"
                    and (x.get("text") or "").strip() == tx
                    for x in self._db_parts
                ):
                    continue
                self._db_parts.append(dict(p))


async def stream_graph_to_sse(
    graph,
    input_state: dict,
    message_id: str,
    out: dict | None = None,
    *,
    assistant_row_id: str | None = None,
) -> AsyncGenerator[bytes, None]:
    """Stream a compiled LangGraph graph and yield SSE bytes in the existing protocol."""
    thinking_db_id = assistant_row_id or message_id
    br = _SseBridgeState(
        message_id=message_id, thinking_db_id=thinking_db_id, input_state=input_state
    )
    log_pipeline_input(message_id=message_id, input_state=input_state)
    tool_q: asyncio.Queue | None = input_state.get("_tool_sse_queue")

    aiter = graph.astream_events(input_state, version="v2").__aiter__()

    async def _graph_next() -> Any:
        try:
            return await aiter.__anext__()
        except StopAsyncIteration:
            return _GRAPH_DONE

    next_graph: asyncio.Task | None = asyncio.create_task(_graph_next())
    next_tool: asyncio.Task | None = (
        asyncio.create_task(tool_q.get()) if tool_q is not None else None
    )

    try:
        graph_ended = False
        while not graph_ended and (next_graph is not None or next_tool is not None):
            wait_on = [t for t in (next_graph, next_tool) if t is not None]
            if not wait_on:
                break
            done, _ = await asyncio.wait(wait_on, return_when=asyncio.FIRST_COMPLETED)
            for finished in done:
                if next_graph is not None and finished is next_graph:
                    try:
                        ev = finished.result()
                    except BaseException as graph_exc:
                        root = _root_cause(graph_exc)
                        err_id = new_error_id()
                        log_pipeline_error(message_id=message_id, error_id=err_id, exc=root)
                        logger.warning(
                            "Graph SSE stream failed [%s]: %s",
                            err_id,
                            root,
                            exc_info=True,
                        )
                        if next_tool is not None:
                            next_tool.cancel()
                            try:
                                await next_tool
                            except asyncio.CancelledError:
                                pass
                            next_tool = None
                        if tool_q is not None:
                            while True:
                                try:
                                    payload = tool_q.get_nowait()
                                except asyncio.QueueEmpty:
                                    break
                                for chunk in br.manual_tool_to_chunks(payload):
                                    yield chunk
                        next_graph = None
                        graph_ended = True
                        br._stream_failed = True
                        for chunk in _terminal_error_chunks(br, root, err_id):
                            yield chunk
                        break
                    if ev is _GRAPH_DONE:
                        if next_tool is not None:
                            next_tool.cancel()
                            try:
                                await next_tool
                            except asyncio.CancelledError:
                                pass
                            next_tool = None
                        if tool_q is not None:
                            while True:
                                try:
                                    payload = tool_q.get_nowait()
                                except asyncio.QueueEmpty:
                                    break
                                for chunk in br.manual_tool_to_chunks(payload):
                                    yield chunk
                        next_graph = None
                        graph_ended = True
                        break
                    log_langgraph_raw_event(message_id=message_id, event=ev)
                    for chunk in br.graph_event_to_chunks(ev):
                        yield chunk
                    next_graph = asyncio.create_task(_graph_next())

                elif next_tool is not None and finished is next_tool:
                    payload = finished.result()
                    next_tool = asyncio.create_task(tool_q.get()) if tool_q is not None else None
                    for chunk in br.manual_tool_to_chunks(payload):
                        yield chunk
    finally:
        for pending in (next_graph, next_tool):
            if pending is not None:
                pending.cancel()
                try:
                    await pending
                except asyncio.CancelledError:
                    pass
                except BaseException:
                    pass

    if not br._stream_failed:
        for chunk in br.finalize_chunks():
            yield chunk

    if out is not None:
        br.fill_out_dict(out)
        if not br._stream_failed:
            log_pipeline_output(
                message_id=message_id,
                out=out,
                final_state=br._final_graph_state
                if isinstance(br._final_graph_state, dict)
                else None,
            )
