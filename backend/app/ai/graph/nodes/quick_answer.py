"""Quick Answer node: streamlined data retrieval for simple, well-specified questions.

Handles PATH A (point lookup), simple PATH B (two-country/two-year comparison), and
simple PATH C (single-indicator trend) questions where the answer can be obtained with
1–3 tool calls and no analytical decomposition is needed.

Differences from research_node:
  - Uses a shorter prompt (get_quick_answer_system_prompt) with no CONCEPT VOCABULARY.
  - Hard cap of 3 tool call iterations (vs 10 for research).
  - Sets response_mode="quick" in state so the narrator produces minimal prose.
  - Synthesizes a quick_answer_card payload from tool results for the frontend card renderer.
  - Preferred tools: data360_summarize_data, data360_compare_countries,
    data360_rank_countries, data360_get_data — whichever covers the question in fewest calls.
"""

import logging
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.ai.prompts import get_quick_answer_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..node_utils import run_tool_loop
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 3  # quick path: 1-3 tool calls only


# ---------------------------------------------------------------------------
# Card synthesizer — programmatic, no LLM call
# ---------------------------------------------------------------------------


def _synthesize_card(tool_results: list[dict]) -> dict | None:
    """Extract a structured card payload from quick_answer tool results.

    Inspects the list of tool results produced by the quick_answer tool loop
    and returns one of three card types:

    - ``single_fact``: from data360_get_data — latest data point for one country.
    - ``comparison``: from data360_compare_countries — snapshot ranking of 2 countries.
    - ``trend``: from data360_summarize_data — single-group time trend.

    Returns None when no recognised aggregation tool was called or when the
    output does not contain the minimum fields needed to render a card.  The
    frontend falls through to the standard narrator prose in that case.
    """
    for result in tool_results:
        tool_name: str = result.get("tool_name", "")
        output: Any = result.get("output")

        # LangChain wraps MCP tool outputs in a list of content blocks:
        #   [{"type": "text", "text": "{...json...}"}]
        # Unwrap to the text payload before any further normalisation.
        if isinstance(output, list):
            text_blocks = [
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in output
                if (isinstance(block, dict) and block.get("type") == "text")
                or isinstance(block, str)
            ]
            output = "".join(text_blocks).strip() or None

        if output is None:
            continue

        # The MCP compact serializer may return a JSON string rather than a
        # pre-parsed dict. Normalise to dict before further processing.
        if isinstance(output, str):
            try:
                import json

                output = json.loads(output)
            except (ValueError, TypeError):
                logger.debug(
                    "[synthesize_card] tool=%s output is non-JSON string, skipping", tool_name
                )
                continue

        if not isinstance(output, dict):
            logger.debug(
                "[synthesize_card] tool=%s output type=%s, skipping", tool_name, type(output)
            )
            continue

        logger.info("[synthesize_card] tool=%s output_keys=%s", tool_name, list(output.keys())[:8])

        # ── trend card: data360_summarize_data ──────────────────────────────
        if tool_name == "data360_summarize_data":
            groups: list = output.get("groups", [])
            metadata: dict = output.get("metadata", {}) or {}
            unit: str = output.get("unit_measure", "")
            indicator_name: str = metadata.get("name") or metadata.get("indicator_name") or ""

            if not groups:
                continue

            # Prefer a single-group result (one country) for trend; fall back
            # to multi-group comparison if that's what the model called.
            group = groups[0]
            country_name: str = group.get("ref_area_name") or group.get("ref_area", "")
            latest_value = group.get("latest_value")
            earliest_value = group.get("earliest_value")
            latest_year = group.get("latest_year")
            earliest_year = group.get("earliest_year")
            total_change = group.get("total_change")
            pct_change = group.get("pct_change")
            trend_direction: str = group.get("trend_direction", "")
            latest_claim_id: str = (
                group.get("latest_claim_id") or group.get("claim_ids", [None])[0] or ""
            )
            earliest_claim_id: str = group.get("earliest_claim_id") or ""

            if latest_value is None:
                continue

            return {
                "card_type": "trend",
                "indicator_name": indicator_name,
                "country_name": country_name,
                "unit": unit,
                "latest_value": latest_value,
                "earliest_value": earliest_value,
                "latest_year": latest_year,
                "earliest_year": earliest_year,
                "total_change": total_change,
                "pct_change": pct_change,
                "trend_direction": trend_direction,
                "latest_claim_id": latest_claim_id,
                "earliest_claim_id": earliest_claim_id,
                # Pass all groups so the frontend can show multi-country comparison
                # as a trend card when two countries were requested.
                "groups": [
                    {
                        "ref_area": g.get("ref_area", ""),
                        "ref_area_name": g.get("ref_area_name") or g.get("ref_area", ""),
                        "latest_value": g.get("latest_value"),
                        "earliest_value": g.get("earliest_value"),
                        "latest_year": g.get("latest_year"),
                        "earliest_year": g.get("earliest_year"),
                        "total_change": g.get("total_change"),
                        "pct_change": g.get("pct_change"),
                        "trend_direction": g.get("trend_direction", ""),
                        "latest_claim_id": g.get("latest_claim_id") or "",
                        "earliest_claim_id": g.get("earliest_claim_id") or "",
                    }
                    for g in groups
                ],
            }

        # ── comparison card: data360_compare_countries ───────────────────────
        if tool_name == "data360_compare_countries":
            snapshot: dict = output.get("snapshot", {}) or {}
            metadata = output.get("metadata", {}) or {}
            unit = output.get("unit") or output.get("unit_measure", "")
            indicator_name = (
                output.get("indicator")
                or metadata.get("name")
                or metadata.get("indicator_name")
                or ""
            )
            rankings: list = snapshot.get("rankings", [])
            year: int | None = snapshot.get("year")

            if len(rankings) < 2:
                continue

            # Build a simple list: [{country, value, claim_id}]
            entries = []
            for r in rankings:
                val = r.get("value") if r.get("value") is not None else r.get("obs_value")
                entries.append(
                    {
                        "ref_area": r.get("code") or r.get("ref_area", ""),
                        "country_name": r.get("country")
                        or r.get("country_name")
                        or r.get("code", ""),
                        "value": val,
                        "claim_id": r.get("claim_id", ""),
                        "rank": r.get("rank"),
                    }
                )

            if len(entries) < 2 or entries[0].get("value") is None:
                continue

            # Delta between top and bottom of the comparison set
            top_val = entries[0].get("value")
            bottom_val = entries[-1].get("value")
            delta = None
            if top_val is not None and bottom_val is not None:
                try:
                    delta = float(top_val) - float(bottom_val)
                except (TypeError, ValueError):
                    delta = None

            return {
                "card_type": "comparison",
                "indicator_name": indicator_name,
                "unit": unit,
                "year": year,
                "entries": entries,
                "delta": delta,
            }

        # ── single fact card: data360_get_data ──────────────────────────────
        if tool_name == "data360_get_data":
            data_rows: list = output.get("data", [])
            metadata = output.get("metadata", {}) or {}
            indicator_name = (
                metadata.get("name")
                or metadata.get("indicator_name")
                or (data_rows[0].get("INDICATOR_NAME") if data_rows else "")
                or ""
            )

            if not data_rows:
                continue

            # Pick the most-recent row (highest TIME_PERIOD)
            latest_row = max(
                data_rows,
                key=lambda r: str(r.get("TIME_PERIOD", "")),
                default=None,
            )
            if latest_row is None:
                continue

            return {
                "card_type": "single_fact",
                "indicator_name": indicator_name,
                "country_name": latest_row.get("REF_AREA", ""),
                "unit": latest_row.get("UNIT_MEASURE", ""),
                "value": latest_row.get("OBS_VALUE"),
                "year": latest_row.get("TIME_PERIOD"),
                "claim_id": latest_row.get("claim_id", ""),
            }

    # No recognised tool output — return None (fallback to prose)
    return None


async def quick_answer_node(state: ChatPipelineState) -> dict:
    """Run a minimal tool loop for simple data questions.

    Uses the same ReAct-style tool loop as research_node but with a much
    shorter prompt and a hard cap of 3 iterations.  Sets response_mode="quick"
    so the narrator produces only a brief bridging sentence rather than full
    analytical prose — the visual weight is carried by the aggregation renderers
    (SummarizeData, CompareCountries, RankCountries) already present in the UI.

    After the tool loop, synthesises a quick_answer_card payload from the raw
    tool results so the frontend can render a styled card (single_fact /
    comparison / trend) without any additional round-trips.

    streaming=True so graph.astream_events() receives token-level events tagged
    with langgraph_node="quick_answer" — the SSE bridge routes these to the
    data-thinking panel (same as "research").

    Returns state updates for research_packet, research_tool_results,
    response_mode, and quick_answer_card.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    data_tools: list = state.get("tool_set", {}).get("mcp_data", {}).get("langchain_tools", [])

    if not data_tools:
        logger.warning(
            "[quick_answer_node] no MCP data tools available — falling back to empty packet."
        )
        return {
            "research_packet": (
                "### NO_DATA:\n"
                "MCP data tools are currently unavailable. No data could be retrieved."
            ),
            "research_tool_results": [],
            "response_mode": "quick",
            "quick_answer_card": None,
        }

    llm = get_chat_llm(model_type, streaming=True).bind_tools(data_tools)
    system_prompt: str = get_quick_answer_system_prompt()

    history = openai_to_langchain(state.get("openai_messages", []))

    # Inject session summary for context (country/indicator carry-forward).
    session_summary: str = state.get("session_summary", "") or ""
    if session_summary:
        history = [HumanMessage(content=f"[CONVERSATION SUMMARY]\n{session_summary}")] + history

    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="research",  # use research budget — same token window
    )

    tool_map = {t.name: t for t in data_tools}
    final_content, _, tool_results = await run_tool_loop(
        llm=llm,
        messages=messages,
        tool_map=tool_map,
        max_iterations=MAX_TOOL_ITERATIONS,
        state=state,
        graph_node="quick_answer",
        collect_tool_results=True,
    )

    card = _synthesize_card(tool_results)

    logger.info(
        "[quick_answer_node] research_packet length=%d tool_results=%d card_type=%s",
        len(final_content),
        len(tool_results),
        card.get("card_type") if card else "none",
    )
    return {
        "research_packet": final_content,
        "research_tool_results": tool_results,
        "response_mode": "quick",
        "quick_answer_card": card,
    }
