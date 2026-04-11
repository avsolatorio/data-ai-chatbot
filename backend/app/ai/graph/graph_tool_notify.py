"""Notify the SSE bridge while tools run inside LangGraph nodes.

Research / narrator / direct nodes call ``llm.ainvoke`` and execute tools in Python
loops. They push start/end payloads to ``ChatPipelineState._tool_sse_queue`` so
:mod:`app.ai.graph.sse_bridge` can emit the same tool SSE shape as the classic
stream.

When this queue is present, the bridge **does not** also handle LangGraph
``on_tool_*`` events for those nodes, so each tool appears once (no duplicate
output in the UI or DB).
"""

from __future__ import annotations

import asyncio
from typing import Any


async def notify_tool_start(
    state: dict,
    *,
    graph_node: str,
    tool_name: str,
    tool_call_id: str,
    tool_input: Any,
) -> None:
    q = state.get("_tool_sse_queue")
    if q is None:
        return
    await q.put(
        {
            "phase": "start",
            "graph_node": graph_node,
            "tool_name": tool_name,
            "tool_call_id": tool_call_id,
            "input": tool_input,
        }
    )


async def notify_tool_end(
    state: dict,
    *,
    graph_node: str,
    tool_name: str,
    tool_call_id: str,
    output: Any,
) -> None:
    q = state.get("_tool_sse_queue")
    if q is None:
        return
    await q.put(
        {
            "phase": "end",
            "graph_node": graph_node,
            "tool_name": tool_name,
            "tool_call_id": tool_call_id,
            "output": output,
        }
    )


def create_tool_sse_queue() -> asyncio.Queue:
    """Queue consumed by :func:`stream_graph_to_sse` (merged with graph events)."""
    return asyncio.Queue()
