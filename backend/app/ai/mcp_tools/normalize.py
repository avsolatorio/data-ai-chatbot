"""Normalize LLM tool-call payloads before sending to Data360 MCP (FastMCP validation)."""

from __future__ import annotations

import json5


def normalize_mcp_tool_arguments(arguments: dict) -> dict:
    """Coerce LangChain / LLM tool-call payloads to shapes the MCP server validates.

    - ``disaggregation_filters`` is often emitted as a JSON string; the MCP schema expects ``dict``.
    - ``start_year``, ``end_year``, ``limit``, ``offset`` may arrive as numeric strings.
    """
    out = {k: v for k, v in arguments.items() if v is not None}
    df_key = "disaggregation_filters"
    if df_key in out:
        df_val = out[df_key]
        if isinstance(df_val, str):
            stripped = df_val.strip()
            if not stripped:
                del out[df_key]
            else:
                try:
                    parsed = json5.loads(stripped)
                except Exception as e:
                    raise ValueError(
                        f"{df_key} must be JSON object or dict; could not parse: {df_val!r}"
                    ) from e
                if not isinstance(parsed, dict):
                    raise ValueError(
                        f"{df_key} must decode to a JSON object, got {type(parsed).__name__}"
                    )
                out[df_key] = parsed
    for ik in ("start_year", "end_year", "limit", "offset"):
        if ik not in out:
            continue
        val = out[ik]
        if isinstance(val, str):
            s = val.strip()
            if not s:
                del out[ik]
                continue
            try:
                out[ik] = int(s)
            except ValueError:
                pass
    return out
