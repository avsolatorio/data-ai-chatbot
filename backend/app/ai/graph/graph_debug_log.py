"""Opt-in debug logging for LangGraph LLM prompts and streamed tokens.

Enable with ``GRAPH_DEBUG_LOG_LLM=true`` in the environment. Logs may contain
user messages and tool output — use only in trusted dev environments.

When enabled, records are emitted to the application logger and appended to
``GRAPH_DEBUG_LOG_LLM_FILE`` when set, or to ``backend/logs/graph_llm_debug.log``
by default (see :func:`_append_graph_debug_file`).
"""

from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

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
    logger.info(
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
