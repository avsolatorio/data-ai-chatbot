"""Normalize LangChain tool return values for UI / persisted message parts.

Many tools return JSON text; the frontend expects ``output`` to be an object
(e.g. ``{\"url\": \"...\", \"error\": null}``) for viz and Data360 tool renderers.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import json5

logger = logging.getLogger(__name__)


# TODO: Consider more robust schemas / validation for tool outputs, especially for MCP tools where we have schemas defined on the server. For now we just want to be able to parse common cases of JSON output without enforcing strict schemas or risking parse errors from non-JSON text (e.g. error messages).
def normalize_tool_output_for_ui(output: Any) -> Any:
    """If ``output`` is a JSON object/array string, parse it; otherwise return as-is.

    Plain error or human-readable strings (not starting with ``{`` / ``[``) are
    left unchanged so message text like ``Tool 'x' not available.`` stays a string.
    """
    if output is None:
        return None
    if isinstance(output, (dict, list)):
        return output
    if isinstance(output, bool):
        return output
    if isinstance(output, (int, float)):
        return output
    if not isinstance(output, str):
        return str(output)

    stripped = output.strip()
    if len(stripped) < 2 or stripped[0] not in "{[":
        return output

    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        try:
            return json5.loads(stripped)
        except Exception as exc:
            logger.debug("Tool output JSON parse skipped: %s", exc)
            return output
