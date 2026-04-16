"""Opt-in debug logging for the LangGraph chat pipeline.

Enable with ``GRAPH_DEBUG_LOG_LLM=true`` in the environment. Logs may contain
user messages and tool output — use only in trusted dev environments.

**Full flow coverage** (when enabled):

- :func:`log_pipeline_input` — user ``query_text``, recent OpenAI messages, model.
- :func:`log_langgraph_raw_event` — every ``astream_events(v2)`` record: chain
  start/end (state updates per node), LLM stream/completion for **any** node,
  tool start/end, plus other event types (truncated).
- :func:`log_llm_messages_preview` — optional extra snapshots before ``ainvoke``
  in narrator / ``run_tool_loop`` (research, explain, recovery).
- :func:`log_pipeline_output` / :func:`log_pipeline_error` — assembled answer and
  failures.

Records go to the debug file (always when enabled). High-volume token streams
use ``logger.debug`` so default ``LOG_LEVEL=INFO`` stays readable; the file still
contains all stream fragments.
"""

from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Upper bound for serialized ``on_chain_*`` / misc event ``data`` in flow logs.
_FLOW_DATA_REPR_MAX = 10_000

_file_lock = threading.Lock()


def trunc_for_log(text: str, max_len: int = 4000) -> str:
    """Truncate a string for log lines; keeps total log size bounded."""
    if len(text) <= max_len:
        return text
    return f"{text[:max_len]}... [truncated, total_len={len(text)}]"


def graph_llm_log_enabled() -> bool:
    from app.config import settings

    return bool(getattr(settings, "GRAPH_DEBUG_LOG_LLM", False))


def _backend_root() -> Path:
    """Directory containing ``app/`` (the backend package root)."""
    return Path(__file__).resolve().parent.parent.parent.parent


def _resolved_graph_debug_log_path() -> Path | None:
    """Return destination path for graph LLM debug file, or None if disabled."""
    if not graph_llm_log_enabled():
        return None
    from app.config import settings

    raw = (getattr(settings, "GRAPH_DEBUG_LOG_LLM_FILE", "") or "").strip()
    if raw:
        p = Path(raw)
        return p if p.is_absolute() else Path.cwd() / p
    return _backend_root() / "logs" / "graph_llm_debug.log"


def _append_graph_debug_file(category: str, content: str) -> None:
    """Append one debug record to the graph LLM debug file (stream-friendly flush)."""
    path = _resolved_graph_debug_log_path()
    if path is None:
        return
    ts = datetime.now(timezone.utc).isoformat()
    sep = "=" * 72
    block = f"{sep}\n{ts} [{category}]\n{content.rstrip()}\n"
    with _file_lock:
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open("a", encoding="utf-8") as f:
                f.write(block)
                f.flush()
        except OSError as exc:
            logger.warning("GRAPH_DEBUG_LOG_LLM file write failed (%s): %s", path, exc)


def log_llm_messages_preview(
    *,
    message_id: str,
    graph_node: str,
    messages: list[Any],
    iteration: int | None = None,
    per_message_max: int = 2500,
) -> None:
    """Log each LangChain message (type + truncated content) before an LLM call."""
    if not graph_llm_log_enabled():
        return
    lines: list[str] = []
    for i, m in enumerate(messages):
        cls = type(m).__name__
        raw = getattr(m, "content", "")
        if isinstance(raw, str):
            body = trunc_for_log(raw, max_len=per_message_max)
        else:
            body = trunc_for_log(repr(raw), max_len=per_message_max)
        lines.append(f"  [{i}] {cls}: {body}")
    iter_part = f" iteration={iteration}" if iteration is not None else ""
    joined = "\n".join(lines)
    body = (
        f"message_id={message_id} node={graph_node}{iter_part} "
        f"message_count={len(messages)}\n{joined}"
    )
    logger.info(
        "[graph_llm_prompt] message_id=%s node=%s%s message_count=%d\n%s",
        message_id,
        graph_node,
        iter_part,
        len(messages),
        "\n".join(lines),
    )
    _append_graph_debug_file("graph_llm_prompt", body)


def log_llm_stream_delta(*, message_id: str, graph_node: str, delta: str) -> None:
    """Log one streamed token fragment as seen by the SSE bridge."""
    if not graph_llm_log_enabled() or not delta:
        return
    frag = trunc_for_log(delta, max_len=1500)
    body = f"message_id={message_id} node={graph_node} chars={len(delta)} fragment={frag!r}"
    logger.debug(
        "[graph_llm_stream] message_id=%s node=%s chars=%d fragment=%r",
        message_id,
        graph_node,
        len(delta),
        frag,
    )
    _append_graph_debug_file("graph_llm_stream", body)


def log_llm_completion_preview(*, message_id: str, graph_node: str, text: str) -> None:
    """Log full assistant text from ``on_chat_model_end`` (when present)."""
    if not graph_llm_log_enabled() or not text:
        return
    preview = trunc_for_log(text, max_len=4000)
    body = f"message_id={message_id} node={graph_node} chars={len(text)} text={preview!r}"
    logger.info(
        "[graph_llm_completion] message_id=%s node=%s chars=%d text=%r",
        message_id,
        graph_node,
        len(text),
        preview,
    )
    _append_graph_debug_file("graph_llm_completion", body)


def completion_text_from_model_output(msg: Any) -> str:
    """Best-effort plain text from a ChatGeneration / AIMessage ``output``."""
    if msg is None:
        return ""
    c = getattr(msg, "content", "")
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        parts: list[str] = []
        for block in c:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(str(block.get("text", "")))
            else:
                parts.append(str(block))
        return "".join(parts)
    return str(c)


def _unwrap_chat_generation(output: Any) -> Any:
    """Match LangGraph ``on_chat_model_end`` payload (generation vs message)."""
    if output is None:
        return None
    msg = getattr(output, "message", None)
    if msg is not None:
        return msg
    return output


def _summarize_chain_output_dict(out: dict[str, Any]) -> str:
    """Multi-line summary of a node ``output`` state dict (truncated per field)."""
    lines: list[str] = []
    for key, val in sorted(out.items(), key=lambda kv: kv[0]):
        if key.startswith("_"):
            continue
        if isinstance(val, str):
            lines.append(f"{key}={trunc_for_log(val, 2000)!r}")
        elif isinstance(val, list):
            lines.append(
                f"{key}=<list len={len(val)}> preview={trunc_for_log(repr(val[:3]), 800)!r}"
            )
        elif isinstance(val, dict):
            subk = list(val.keys())[:20]
            lines.append(f"{key}=<dict keys={subk}>")
        else:
            lines.append(f"{key}={trunc_for_log(repr(val), 800)!r}")
    return "\n".join(lines) if lines else "(empty output dict)"


def log_pipeline_input(*, message_id: str, input_state: dict[str, Any]) -> None:
    """Log the graph run input: query and recent messages (start of full flow)."""
    if not graph_llm_log_enabled():
        return
    qt = str(input_state.get("query_text") or "")
    mt = str(input_state.get("model_type") or "")
    forced = input_state.get("forced_intent")
    ss = str(input_state.get("session_summary") or "")
    msgs = input_state.get("openai_messages") or []
    recent = msgs[-6:] if isinstance(msgs, list) and len(msgs) > 6 else msgs
    lines = [
        f"message_id={message_id}",
        f"query_text={trunc_for_log(qt, 6000)!r}",
        f"model_type={mt!r}",
        f"forced_intent={forced!r}",
        f"session_summary={trunc_for_log(ss, 2000)!r}",
        "openai_messages (last up to 6):",
    ]
    if isinstance(recent, list):
        for i, m in enumerate(recent):
            if isinstance(m, dict):
                role = m.get("role", "?")
                content = m.get("content", "")
                if isinstance(content, list):
                    content = repr(content)
                lines.append(f"  [{i}] role={role!r} content={trunc_for_log(str(content), 3500)!r}")
            else:
                lines.append(f"  [{i}] {trunc_for_log(repr(m), 800)}")
    else:
        lines.append(f"  (not a list): {trunc_for_log(repr(msgs), 1500)}")
    body = "\n".join(lines)
    logger.info("[graph_flow_input]\n%s", body)
    _append_graph_debug_file("graph_flow_input", body)


def log_pipeline_output(
    *,
    message_id: str,
    out: dict[str, Any],
    final_state: dict[str, Any] | None = None,
) -> None:
    """Log assembled client-visible outcome after a successful graph run."""
    if not graph_llm_log_enabled():
        return
    failed = out.get("stream_failed")
    ans = str(out.get("answer_text") or "")
    rr = str(out.get("routing_reasoning") or "")
    intent = str(out.get("intent") or "")
    sess = str(out.get("session_summary") or "")
    smc = out.get("summarized_message_count", "")
    parts = out.get("assistant_parts_for_db") or []
    n_parts = len(parts) if isinstance(parts, list) else "?"
    fs = final_state if isinstance(final_state, dict) else {}
    if fs:
        intent = intent or str(fs.get("intent") or "")
    rp = str(fs.get("research_packet") or "") if fs else ""
    fq = fs.get("followup_questions") if fs else None
    lines = [
        f"message_id={message_id}",
        f"stream_failed={failed!r}",
        f"intent={intent!r}",
        f"routing_reasoning={trunc_for_log(rr, 2500)!r}",
        f"answer_text={trunc_for_log(ans, 12000)!r}",
        f"session_summary={trunc_for_log(sess, 2000)!r}",
        f"summarized_message_count={smc!r}",
        f"assistant_parts_for_db count={n_parts}",
    ]
    if rp:
        lines.append(f"research_packet={trunc_for_log(rp, 6000)!r}")
    if fq:
        lines.append(f"followup_questions={trunc_for_log(repr(fq), 2000)!r}")
    body = "\n".join(lines)
    logger.info("[graph_flow_output]\n%s", body)
    _append_graph_debug_file("graph_flow_output", body)


def log_pipeline_error(*, message_id: str, error_id: str, exc: BaseException) -> None:
    """Log terminal graph/model failure (file + short INFO; traceback stays on outer WARNING)."""
    if not graph_llm_log_enabled():
        return
    body = (
        f"message_id={message_id} error_id={error_id} "
        f"type={type(exc).__name__!r} message={trunc_for_log(str(exc), 4000)!r}"
    )
    logger.info("[graph_flow_error] %s", body)
    _append_graph_debug_file("graph_flow_error", body)


def log_langgraph_raw_event(*, message_id: str, event: dict[str, Any]) -> None:
    """Log one LangGraph ``astream_events`` v2 payload (covers all nodes in the graph)."""
    if not graph_llm_log_enabled():
        return
    if not isinstance(event, dict):
        _append_graph_debug_file(
            "graph_flow_misc", f"message_id={message_id} non_dict_event={event!r}"
        )
        return
    evt_type = str(event.get("event") or "")
    evt_name = str(event.get("name") or "")
    meta = event.get("metadata") if isinstance(event.get("metadata"), dict) else {}
    node = str(meta.get("langgraph_node") or "")
    run_id = str(event.get("run_id") or "")
    data = event.get("data") if isinstance(event.get("data"), dict) else {}

    if evt_type == "on_chat_model_stream":
        chunk = data.get("chunk")
        content = chunk.content if (chunk and hasattr(chunk, "content")) else ""
        if not content:
            return
        graph_node = node or evt_name or "unknown"
        log_llm_stream_delta(message_id=message_id, graph_node=graph_node, delta=content)
        return

    if evt_type == "on_chat_model_end":
        out_raw = data.get("output")
        out_msg = _unwrap_chat_generation(out_raw)
        end_text = completion_text_from_model_output(out_msg)
        graph_node = node or evt_name or "unknown"
        if end_text:
            log_llm_completion_preview(message_id=message_id, graph_node=graph_node, text=end_text)
        else:
            body = (
                f"message_id={message_id} langgraph_node={graph_node!r} "
                f"(no text content) payload_type={type(out_msg).__name__!r}"
            )
            logger.info("[graph_flow_llm_end] %s", body)
            _append_graph_debug_file("graph_flow_llm_end", body)
        return

    if evt_type in ("on_tool_start", "on_tool_end"):
        tool_name = (
            evt_name or (data.get("name") if isinstance(data.get("name"), str) else "") or "tool"
        )
        detail_key = "input" if evt_type == "on_tool_start" else "output"
        raw_detail = data.get(detail_key, "")
        summary = trunc_for_log(repr(raw_detail), 3500)
        body = (
            f"message_id={message_id} langgraph_node={node!r} tool={tool_name!r} "
            f"event={evt_type!r} run_id={run_id!r} {detail_key}={summary}"
        )
        logger.info("[graph_flow_tool_event] %s", trunc_for_log(body, 5000))
        _append_graph_debug_file("graph_flow_tool_event", body)
        return

    if evt_type in ("on_chain_start", "on_chain_end"):
        blocks: list[str] = []
        if "input" in data:
            blocks.append(f"input={trunc_for_log(repr(data.get('input')), 4000)}")
        out = data.get("output")
        if isinstance(out, dict):
            blocks.append("output:\n" + _summarize_chain_output_dict(out))
        elif out is not None:
            blocks.append(f"output={trunc_for_log(repr(out), _FLOW_DATA_REPR_MAX)}")
        if not blocks:
            blocks.append(trunc_for_log(repr(data), _FLOW_DATA_REPR_MAX))
        summary = "\n".join(blocks)
        body = (
            f"message_id={message_id} event={evt_type!r} name={evt_name!r} "
            f"langgraph_node={node!r} run_id={run_id!r}\n{summary}"
        )
        logger.info("[graph_flow_chain] %s", trunc_for_log(body.replace("\n", " | "), 4000))
        _append_graph_debug_file("graph_flow_chain", body)
        return

    # Other events (on_chat_model_start, on_parser_* , …) — compact
    body = (
        f"message_id={message_id} event={evt_type!r} name={evt_name!r} "
        f"langgraph_node={node!r} run_id={run_id!r}\n"
        f"data={trunc_for_log(repr(data), _FLOW_DATA_REPR_MAX)}"
    )
    logger.debug("[graph_flow_misc] %s", trunc_for_log(body.replace("\n", " | "), 3000))
    _append_graph_debug_file("graph_flow_misc", body)


def log_llm_tool_manual(
    *,
    message_id: str,
    graph_node: str,
    tool_name: str,
    phase: str,
    payload_summary: str,
) -> None:
    """Log manual tool notify payloads (truncated summary string)."""
    if not graph_llm_log_enabled():
        return
    detail = trunc_for_log(payload_summary, max_len=2000)
    body = (
        f"message_id={message_id} node={graph_node} tool={tool_name} "
        f"phase={phase} detail={detail!r}"
    )
    logger.info(
        "[graph_llm_tool] message_id=%s node=%s tool=%s phase=%s detail=%r",
        message_id,
        graph_node,
        tool_name,
        phase,
        detail,
    )
    _append_graph_debug_file("graph_llm_tool", body)
