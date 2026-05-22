"""Normalize LangChain tool return values for UI / persisted message parts.

Many tools return JSON text; the frontend expects ``output`` to be an object
(e.g. ``{\"url\": \"...\", \"error\": null}``) for viz and Data360 tool renderers.
"""

from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)


# TODO: Consider more robust schemas / validation for tool outputs, especially for MCP tools where we have schemas defined on the server. For now we just want to be able to parse common cases of JSON output without enforcing strict schemas or risking parse errors from non-JSON text (e.g. error messages).
def normalize_tool_output_for_ui(output: Any) -> Any:
    """If ``output`` is a JSON object/array string, parse it; otherwise return as-is."""

    logger.debug("Normalizing tool output: %s", output)

    # TODO: Check how to generalize this given LangChain's tool output structure
    if isinstance(output, list):
        if not output:
            # Empty list — tool returned no content. Return None so the UI can
            # render an output-available state rather than staying stuck.
            return None
        output = output[0]
        if isinstance(output, dict) and "text" in output:
            return json.loads(output["text"])
        else:
            return output
    else:
        return output
