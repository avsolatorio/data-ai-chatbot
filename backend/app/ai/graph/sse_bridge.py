"""SSE bridge: maps graph.astream_events(version="v2") → existing SSE byte protocol.

The frontend expects a specific SSE event format (data-thinking, text-start,
text-delta, text-end, finish, …).  This module translates LangGraph's generic
event stream into that protocol so the frontend needs zero changes.

Event → SSE mapping by langgraph_node:
    router    → routing reasoning wrapped in DataThinkingPart (after node ends)
    research  → on_chat_model_stream  → DataThinkingPart(TextDeltaPart)
              → on_tool_start         → DataThinkingPart(ToolInputStart + ToolInputAvailable)
              → on_tool_end           → DataThinkingPart(ToolOutputAvailable)
    narrator  → on_chat_model_stream  → TextStartPart / TextDeltaPart / TextEndPart
              → on_tool_start/end     → plain tool SSE (for document creation visibility)
    direct    → same as narrator
"""

import logging
from typing import AsyncGenerator
from uuid import uuid4

from app.ai.protocols.stream import (
    DataPart,
    DataThinkingPart,
    DoneMarker,
    FinishMessagePart,
    TextDeltaPart,
    TextEndPart,
    TextStartPart,
    ToolInputAvailablePart,
    ToolInputStartPart,
    ToolOutputAvailablePart,
)

logger = logging.getLogger(__name__)

# Nodes whose LLM tokens go into the data-thinking envelope
_THINKING_NODES = {"research"}

# Nodes whose LLM tokens are emitted as plain visible text
_ANSWER_NODES = {"narrator", "direct"}


async def stream_graph_to_sse(
    graph,
    input_state: dict,
    message_id: str,
    out: dict | None = None,
) -> AsyncGenerator[bytes, None]:
    """Stream a compiled LangGraph graph and yield SSE bytes in the existing protocol.

    Args:
        graph:        Compiled LangGraph StateGraph (e.g. chat_graph from pipeline.py).
        input_state:  ChatPipelineState dict to pass as graph input.
        message_id:   The SSE message ID (part_message_id from chat.py).
        out:          Optional mutable dict. After the generator is exhausted it will
                      contain {"routing_reasoning": str, "answer_text": str,
                      "final_usage": dict | None} for the caller to save to the DB.

    Yields:
        SSE-encoded bytes ready to forward to the HTTP response.

    The caller (chat.py) is responsible for:
    - Emitting MessageStartPart before calling this function.
    - Emitting the "Understanding your question…" routing UX text before calling.
    - Storing each chunk via store_stream_chunk() and checking for disconnect.
    """
    text_part_id = f"text-{uuid4().hex}"
    answer_text_started = False

    # State captured for the out dict (DB save)
    _routing_reasoning: str = ""
    _answer_text_parts: list[str] = []
    _final_usage: dict | None = None

    # Track which data-stage we're currently in (avoid duplicate emissions)
    _stages_emitted: set[str] = set()

    def _make_stage_sse(stage: str) -> bytes | None:
        if stage in _stages_emitted:
            return None
        _stages_emitted.add(stage)
        return DataPart(type="data-stage", data={"stage": stage}).to_sse().encode("utf-8")

    async for event in graph.astream_events(input_state, version="v2"):
        evt_type: str = event.get("event", "")
        evt_name: str = event.get("name", "")
        run_id: str = event.get("run_id", "")
        metadata: dict = event.get("metadata", {})
        data: dict = event.get("data", {})

        node: str = metadata.get("langgraph_node", "")

        # ── Stage markers ─────────────────────────────────────────────────────

        if evt_type == "on_chain_start" and evt_name == "research":
            stage_bytes = _make_stage_sse("interpreting")
            if stage_bytes:
                yield stage_bytes

        elif evt_type == "on_chain_start" and evt_name in ("narrator", "direct"):
            stage_bytes = _make_stage_sse("generating")
            if stage_bytes:
                yield stage_bytes

        # ── Router node: emit routing reasoning as data-thinking ──────────────

        elif evt_type == "on_chain_end" and evt_name == "router":
            output: dict = data.get("output", {})
            reasoning: str = output.get("routing_reasoning", "")
            _routing_reasoning = reasoning  # capture for out dict
            if reasoning:
                reason_id = f"routing-reason-{message_id}"
                for part in (
                    TextStartPart(id=reason_id),
                    TextDeltaPart(id=reason_id, delta=reasoning),
                    TextEndPart(id=reason_id),
                ):
                    yield (
                        DataThinkingPart(
                            id=message_id,
                            data=part.model_dump(exclude_none=True),
                        )
                        .to_sse()
                        .encode("utf-8")
                    )

        # ── Research node: LLM token streaming → data-thinking ────────────────

        elif evt_type == "on_chat_model_stream" and node in _THINKING_NODES:
            chunk = data.get("chunk")
            content: str = chunk.content if (chunk and hasattr(chunk, "content")) else ""
            if content:
                inner_id = f"research-{message_id}"
                yield (
                    DataThinkingPart(
                        id=message_id,
                        data=TextDeltaPart(id=inner_id, delta=content).model_dump(
                            exclude_none=True
                        ),
                    )
                    .to_sse()
                    .encode("utf-8")
                )

        # ── Research node: tool call start ────────────────────────────────────

        elif evt_type == "on_tool_start" and node in _THINKING_NODES:
            tool_call_id = run_id
            tool_name = evt_name
            tool_input = data.get("input", {})

            # Emit data-stage "retrieving" on the first tool call in research
            stage_bytes = _make_stage_sse("retrieving")
            if stage_bytes:
                yield stage_bytes

            # tool-input-start
            yield (
                DataThinkingPart(
                    id=message_id,
                    data=ToolInputStartPart(toolCallId=tool_call_id, toolName=tool_name).model_dump(
                        exclude_none=True
                    ),
                )
                .to_sse()
                .encode("utf-8")
            )

            # tool-input-available (input is already known at start)
            yield (
                DataThinkingPart(
                    id=message_id,
                    data=ToolInputAvailablePart(
                        toolCallId=tool_call_id,
                        toolName=tool_name,
                        input=tool_input,
                    ).model_dump(exclude_none=True),
                )
                .to_sse()
                .encode("utf-8")
            )

        # ── Research node: tool call end ──────────────────────────────────────

        elif evt_type == "on_tool_end" and node in _THINKING_NODES:
            tool_call_id = run_id
            output = data.get("output", "")
            # Normalise output to a JSON-serialisable form
            output_value = (
                output if isinstance(output, (dict, list, str, int, float)) else str(output)
            )

            yield (
                DataThinkingPart(
                    id=message_id,
                    data=ToolOutputAvailablePart(
                        toolCallId=tool_call_id,
                        output=output_value,
                    ).model_dump(exclude_none=True),
                )
                .to_sse()
                .encode("utf-8")
            )

        # ── Narrator / Direct node: LLM token streaming → visible text ────────

        elif evt_type == "on_chat_model_stream" and node in _ANSWER_NODES:
            chunk = data.get("chunk")
            content = chunk.content if (chunk and hasattr(chunk, "content")) else ""
            if content:
                _answer_text_parts.append(content)  # capture for out dict
                if not answer_text_started:
                    answer_text_started = True
                    yield TextStartPart(id=text_part_id).to_sse().encode("utf-8")
                yield TextDeltaPart(id=text_part_id, delta=content).to_sse().encode("utf-8")

        # ── Narrator / Direct node: capture token usage ────────────────────────

        elif evt_type == "on_chat_model_end" and node in _ANSWER_NODES:
            output_msg = data.get("output")
            if output_msg is not None and hasattr(output_msg, "usage_metadata"):
                meta = output_msg.usage_metadata
                if meta:
                    _final_usage = dict(meta)

        # ── Narrator / Direct node: tool call events (visible) ────────────────
        # Tool calls from narrator/direct (viz tools, local tools) are emitted
        # as plain SSE events so the frontend can render document panels, etc.

        elif evt_type == "on_tool_start" and node in _ANSWER_NODES:
            tool_call_id = run_id
            tool_name = evt_name
            tool_input = data.get("input", {})

            yield (
                ToolInputStartPart(toolCallId=tool_call_id, toolName=tool_name)
                .to_sse()
                .encode("utf-8")
            )
            yield (
                ToolInputAvailablePart(
                    toolCallId=tool_call_id,
                    toolName=tool_name,
                    input=tool_input,
                )
                .to_sse()
                .encode("utf-8")
            )

        elif evt_type == "on_tool_end" and node in _ANSWER_NODES:
            tool_call_id = run_id
            output = data.get("output", "")
            output_value = (
                output if isinstance(output, (dict, list, str, int, float)) else str(output)
            )

            yield (
                ToolOutputAvailablePart(
                    toolCallId=tool_call_id,
                    output=output_value,
                )
                .to_sse()
                .encode("utf-8")
            )

    # ── Finalise visible text and close the stream ────────────────────────────

    if answer_text_started:
        yield TextEndPart(id=text_part_id).to_sse().encode("utf-8")

    yield FinishMessagePart().to_sse().encode("utf-8")
    yield DoneMarker().to_sse().encode("utf-8")

    # ── Populate out dict for DB save ─────────────────────────────────────────

    if out is not None:
        out["routing_reasoning"] = _routing_reasoning
        out["answer_text"] = "".join(_answer_text_parts)
        out["final_usage"] = _final_usage
