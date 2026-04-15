"""Scout node: quickly checks data availability for RESEARCH queries.

Uses a small subset of data tools (search, disaggregation, codelist) to verify
indicator and country coverage before the full research node commits to expensive
data retrieval.  Streaming=True so tool events appear in the data-thinking panel.

Returns ``{"scout_findings": parsed_dict_or_raw_text}``.
"""

import json
import logging
import re

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.ai.prompts import get_scout_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..node_utils import run_tool_loop
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

# Tools the scout node is allowed to call
SCOUT_TOOL_NAMES: frozenset[str] = frozenset(
    {
        "data360_search_indicators",
        "data360_get_disaggregation",
        "data360_find_codelist_value",
    }
)

MAX_TOOL_ITERATIONS = 4  # scout is lightweight; rarely needs more than 3 calls


def _parse_scout_response(text: str) -> dict:
    """Extract the JSON block from the scout response.

    Looks for a ```json ... ``` fenced block.  If found, parses and returns the
    dict.  On any parse failure, falls back to ``{"raw": text}``.
    """
    match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError as exc:
            logger.warning("[scout_node] JSON parse failed: %s", exc)
    return {"raw": text}


async def scout_node(state: ChatPipelineState) -> dict:
    """Verify data availability and return scout_findings.

    Runs a lightweight ReAct tool loop restricted to search, disaggregation, and
    codelist tools.  The final LLM response is expected to contain a JSON block
    describing available indicators and coverage.

    ``streaming=True`` ensures ``graph.astream_events()`` emits token-level events
    tagged with ``langgraph_node="scout"`` — the SSE bridge maps these to the
    data-thinking envelope.

    Returns state updates for ``scout_findings``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    all_data_tools: list = state.get("tool_set", {}).get("mcp_data", {}).get("langchain_tools", [])

    # Filter to scout-allowed tools only
    scout_tools = [t for t in all_data_tools if t.name in SCOUT_TOOL_NAMES]
    if not scout_tools:
        logger.warning("[scout_node] no scout tools available — returning empty findings")
        return {"scout_findings": {"available": False, "gaps": "No scout tools available."}}

    llm = get_chat_llm(model_type, streaming=True).bind_tools(scout_tools)
    system_prompt: str = get_scout_system_prompt()

    history = openai_to_langchain(state.get("openai_messages", []))

    # Prepend session summary if available so scout knows earlier context
    session_summary: str = state.get("session_summary", "") or ""
    if session_summary:
        history = [HumanMessage(content=f"[SESSION SUMMARY]\n{session_summary}")] + history

    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="scout",
    )

    tool_map = {t.name: t for t in scout_tools}
    final_content, _ = await run_tool_loop(
        llm=llm,
        messages=messages,
        tool_map=tool_map,
        max_iterations=MAX_TOOL_ITERATIONS,
        state=state,
        graph_node="scout",
    )

    parsed = _parse_scout_response(final_content)
    logger.info(
        "[scout_node] findings available=%s",
        parsed.get("available", "unknown"),
    )

    return {"scout_findings": parsed}
