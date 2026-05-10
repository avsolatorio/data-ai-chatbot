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
    # Technical unit codes that are meaningless to end-users. We suppress these
    # rather than show confusing abbreviations like "PS" or "XDC".
    _SUPPRESS_UNITS: set[str] = {"XDC", "XN", "PURE_NUM", "_T"}

    _UNIT_LABELS: dict[str, str] = {
        "YR": "years",
        "PS": "people",
        "PT": "%",
        "PC": "%",
    }

    import re as _re

    _TECHNICAL_UNIT_RE = _re.compile(r"^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$")

    def _readable_unit(code: str | None, indicator_name: str) -> str:
        """Return a display-safe unit string, mapping codes to readable text."""
        if not code:
            return ""
        code = str(code)

        # 1. Direct mapping for known codes
        if code in _UNIT_LABELS:
            return _UNIT_LABELS[code]

        # 2. Suppress bad/internal codes
        if code in _SUPPRESS_UNITS:
            return ""
        if _TECHNICAL_UNIT_RE.match(code):
            return ""

        # 3. If it's still just an uppercase code (e.g. unknown), try to extract from indicator name
        if code.isalpha() and code.isupper():
            m = _re.search(r"\(([^)]{1,20})\)\s*$", indicator_name)
            if m:
                extracted = m.group(1).strip()
                # Don't return long descriptive phrases, just short units
                if len(extracted) <= 15:
                    return extracted
            return ""

        return code

    def _country_name(row: dict) -> str:
        """Return a human-readable country name from a data row."""
        return row.get("REF_AREA_NAME") or row.get("country_name") or row.get("REF_AREA", "")

    def _unit(row: dict, indicator_name: str) -> str:
        """Return a display-safe unit string from a data row."""
        return _readable_unit(row.get("UNIT_MEASURE", ""), indicator_name)

    for result in tool_results:
        tool_name: str = result.get("tool_name", "")
        tool_args: dict = result.get("tool_args", {})
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
            indicator_name: str = (
                output.get("indicator")
                or metadata.get("name")
                or metadata.get("indicator_name")
                or ""
            )
            unit: str = _readable_unit(
                output.get("unit") or output.get("unit_measure", ""), indicator_name
            )

            if not groups:
                continue

            # Helper to extract from either flat or nested structure
            def get_val(g, nested_key, sub_key, flat_key):
                nested = g.get(nested_key)
                if isinstance(nested, dict):
                    return nested.get(sub_key)
                return g.get(flat_key)

            # If all groups share the same ref_area (same country, multiple sex/age
            # disaggregations), collapse to the _T total group so we don't render
            # three identical ZAF rows for Male / Female / Total.
            if len(groups) > 1:
                _DISAGG_DIMS = {
                    "sex",
                    "age",
                    "urbanisation",
                    "comp_breakdown_1",
                    "comp_breakdown_2",
                }
                first_ref_area = (groups[0].get("group") or {}).get("ref_area") or groups[0].get(
                    "ref_area", ""
                )
                all_same_country = all(
                    ((g.get("group") or {}).get("ref_area") or g.get("ref_area", ""))
                    == first_ref_area
                    for g in groups
                )
                if all_same_country:
                    # Find the group whose disaggregation dimensions are all totals (_T / _Z)
                    def _is_total_group(g):
                        g_key = g.get("group") or {}
                        disagg_vals = [v for k, v in g_key.items() if k.lower() in _DISAGG_DIMS]
                        return all(v in ("_T", "_Z", None) for v in disagg_vals)

                    total_groups = [g for g in groups if _is_total_group(g)]
                    if total_groups:
                        groups = [total_groups[0]]  # Single-group rendering

            # Primary group used for the prominent single-group display
            group = groups[0]

            country_name: str = (
                # ref_area_name is injected by the MCP patch (PR #83) — prefer it.
                # Fall back to the ISO code (ref_area) when the name is not yet available.
                get_val(group, "group", "ref_area_name", "ref_area_name")
                or get_val(group, "group", "ref_area", "ref_area")
                or ""
            )

            latest_value = get_val(group, "latest", "value", "latest_value")
            earliest_value = get_val(group, "earliest", "value", "earliest_value")
            latest_year = get_val(group, "latest", "year", "latest_year")
            earliest_year = get_val(group, "earliest", "year", "earliest_year")
            total_change = get_val(group, "change", "abs", "total_change")
            pct_change = get_val(group, "change", "pct", "pct_change")
            trend_direction: str = group.get("trend") or group.get("trend_direction") or ""

            claim_ids = group.get("claim_ids", [])
            # claim_ids[0]  = earliest observation (chronologically first)
            # claim_ids[-1] = latest observation  (chronologically last)
            # This matches the contract documented in summarize_data extractor.
            latest_claim_id: str = group.get("latest_claim_id") or (
                claim_ids[-1] if claim_ids else ""
            )
            earliest_claim_id: str = group.get("earliest_claim_id") or (
                claim_ids[0] if claim_ids else ""
            )

            # If the user grouped by time_period instead of ref_area, each group is a single year.
            # We can reconstruct the trend by looking across the sorted groups array.
            if str(latest_year) == str(earliest_year) and len(groups) > 1:
                # Assuming groups are sorted descending by time_period (newest first)
                first_g = groups[0]
                last_g = groups[-1]

                # If they are ascending, swap them
                y1 = str(get_val(first_g, "latest", "year", "latest_year") or "")
                y2 = str(get_val(last_g, "latest", "year", "latest_year") or "")
                if y1 and y2 and y1 < y2:
                    first_g, last_g = last_g, first_g

                latest_value = get_val(first_g, "latest", "value", "latest_value")
                latest_year = get_val(first_g, "latest", "year", "latest_year")
                latest_claim_id = first_g.get("latest_claim_id") or (
                    first_g.get("claim_ids", [""])[0] if first_g.get("claim_ids") else ""
                )

                earliest_value = get_val(last_g, "earliest", "value", "earliest_value")
                earliest_year = get_val(last_g, "earliest", "year", "earliest_year")
                earliest_claim_id = last_g.get("earliest_claim_id") or (
                    last_g.get("claim_ids", [""])[0] if last_g.get("claim_ids") else ""
                )

                # Re-calculate change
                if latest_value is not None and earliest_value is not None:
                    try:
                        total_change = float(latest_value) - float(earliest_value)
                        pct_change = (
                            (total_change / abs(float(earliest_value))) * 100
                            if float(earliest_value) != 0
                            else 0
                        )
                        trend_direction = (
                            "increasing"
                            if total_change > 0
                            else "decreasing"
                            if total_change < 0
                            else "stable"
                        )
                    except (TypeError, ValueError):
                        pass

                # Clear the groups array so the UI renders the single-group big trend layout,
                # rather than treating each year as a separate country comparison row.
                groups = []

            if latest_value is None:
                continue

            # If it's still a single year after attempted reconstruction, skip trend card.
            if str(latest_year) == str(earliest_year):
                logger.debug(
                    "[synthesize_card] summarize_data returned single year, not a trend. Skipping."
                )
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
                "groups": [
                    {
                        "ref_area": get_val(g, "group", "ref_area", "ref_area") or "",
                        "ref_area_name": get_val(g, "group", "ref_area_name", "ref_area_name")
                        or get_val(g, "group", "ref_area", "ref_area")
                        or "",
                        "latest_value": get_val(g, "latest", "value", "latest_value"),
                        "earliest_value": get_val(g, "earliest", "value", "earliest_value"),
                        "latest_year": get_val(g, "latest", "year", "latest_year"),
                        "earliest_year": get_val(g, "earliest", "year", "earliest_year"),
                        "total_change": get_val(g, "change", "abs", "total_change"),
                        "pct_change": get_val(g, "change", "pct", "pct_change"),
                        "trend_direction": g.get("trend") or g.get("trend_direction") or "",
                        "latest_claim_id": g.get("latest_claim_id")
                        or (g.get("claim_ids", [])[-1] if g.get("claim_ids") else ""),
                        "earliest_claim_id": g.get("earliest_claim_id") or "",
                    }
                    for g in groups
                ],
            }

        if tool_name == "data360_compare_countries":
            snapshot: dict = output.get("snapshot", {}) or {}
            metadata = output.get("metadata", {}) or {}
            indicator_name = (
                output.get("indicator")
                or metadata.get("name")
                or metadata.get("indicator_name")
                or ""
            )
            unit = _readable_unit(
                output.get("unit") or output.get("unit_measure", ""), indicator_name
            )
            rankings: list = snapshot.get("rankings", [])
            year: int | None = snapshot.get("year")

            logger.info("[synthesize_card] compare_countries snapshot: %s", snapshot)

            if len(rankings) == 0:
                logger.info(
                    "[synthesize_card] compare_countries skipped: len(rankings)=%d < 1",
                    len(rankings),
                )
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

            logger.info("[synthesize_card] compare_countries entries: %s", entries)

            if len(entries) == 0 or entries[0].get("value") is None:
                logger.info("[synthesize_card] compare_countries skipped: entries check failed")
                continue

            if len(entries) == 1:
                return {
                    "card_type": "single_fact",
                    "indicator_name": indicator_name,
                    "country_name": entries[0].get("country_name")
                    or entries[0].get("ref_area")
                    or "",
                    "value": entries[0].get("value"),
                    "year": year,
                    "unit": unit,
                    "claim_id": entries[0].get("claim_id", ""),
                }

            # Delta between top and bottom of the comparison set
            top_val = entries[0].get("value")
            bottom_val = entries[-1].get("value")
            delta = None
            if len(entries) > 1 and top_val is not None and bottom_val is not None:
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

        # ── single fact or trend card: data360_get_data ─────────────────────
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

            # Sort all rows by TIME_PERIOD ascending
            sorted_rows = sorted(data_rows, key=lambda r: str(r.get("TIME_PERIOD", "")))

            # Collect unique countries present in the result
            countries = list(dict.fromkeys(r.get("REF_AREA", "") for r in sorted_rows))

            if (
                len(countries) == 1
                and len(sorted_rows) >= 2
                and (tool_args.get("limit") == 20 or len(sorted_rows) > 5)
            ):
                # Single country, explicitly requested trend or long time series → trend card
                earliest_row = sorted_rows[0]
                latest_row = sorted_rows[-1]
                earliest_val = earliest_row.get("OBS_VALUE")
                latest_val = latest_row.get("OBS_VALUE")
                unit = latest_row.get("UNIT_MEASURE", "")
                total_change = None
                pct_change = None
                trend_direction = "stable"
                if earliest_val is not None and latest_val is not None:
                    try:
                        e = float(earliest_val)
                        l = float(latest_val)
                        total_change = l - e
                        pct_change = (total_change / abs(e)) * 100 if e != 0 else 0
                        trend_direction = (
                            "increasing"
                            if total_change > 0
                            else "decreasing"
                            if total_change < 0
                            else "stable"
                        )
                    except (TypeError, ValueError):
                        pass
                country_display = _country_name(latest_row)
                display_unit = _unit(latest_row, indicator_name)
                return {
                    "card_type": "trend",
                    "indicator_name": indicator_name,
                    "country_name": country_display,
                    "unit": display_unit,
                    "latest_value": latest_val,
                    "earliest_value": earliest_val,
                    "latest_year": latest_row.get("TIME_PERIOD"),
                    "earliest_year": earliest_row.get("TIME_PERIOD"),
                    "total_change": total_change,
                    "pct_change": pct_change,
                    "trend_direction": trend_direction,
                    "latest_claim_id": latest_row.get("claim_id", ""),
                    "earliest_claim_id": earliest_row.get("claim_id", ""),
                    "groups": [
                        {
                            "ref_area": countries[0],
                            "ref_area_name": country_display,
                            "latest_value": latest_val,
                            "earliest_value": earliest_val,
                            "latest_year": latest_row.get("TIME_PERIOD"),
                            "earliest_year": earliest_row.get("TIME_PERIOD"),
                            "total_change": total_change,
                            "pct_change": pct_change,
                            "trend_direction": trend_direction,
                            "latest_claim_id": latest_row.get("claim_id", ""),
                            "earliest_claim_id": earliest_row.get("claim_id", ""),
                        }
                    ],
                }

            # Determine target year from tool_args if this is a fallback range fetch
            target_year = None
            if "start_year" in tool_args and "end_year" in tool_args:
                try:
                    sy = int(tool_args["start_year"])
                    ey = int(tool_args["end_year"])
                    target_year = ey if sy == ey else ey - 1
                except (ValueError, TypeError):
                    pass

            target_row = sorted_rows[-1]
            if target_year is not None:

                def year_dist(r):
                    try:
                        return abs(int(r.get("TIME_PERIOD", 0)) - target_year)
                    except (ValueError, TypeError):
                        return 999

                target_row = min(sorted_rows, key=year_dist)

            return {
                "card_type": "single_fact",
                "indicator_name": indicator_name,
                "country_name": _country_name(target_row),
                "unit": _unit(target_row, indicator_name),
                "value": target_row.get("OBS_VALUE"),
                "year": target_row.get("TIME_PERIOD"),
                "claim_id": target_row.get("claim_id", ""),
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
    # Build a separate map for viz tools — not exposed to the LLM loop but used
    # by the synthesizer to programmatically fetch a viz_url for trend cards.
    viz_tools: list = state.get("tool_set", {}).get("mcp_viz", {}).get("langchain_tools", [])
    viz_tool_map = {t.name: t for t in viz_tools}
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

    # Attach viz_url to trend cards by calling data360_get_viz_spec programmatically.
    # This avoids consuming an LLM tool-call iteration and reuses the already-built tool_map.
    if card and card.get("card_type") == "trend":
        viz_tool = viz_tool_map.get("data360_get_viz_spec")
        if viz_tool:
            for tr in tool_results:
                if tr.get("tool_name") in ("data360_summarize_data", "data360_get_data"):
                    ta = tr.get("tool_args", {})
                    if ta.get("database_id") and ta.get("indicator_id"):
                        viz_args: dict = {
                            "database_id": ta["database_id"],
                            "indicator_id": ta["indicator_id"],
                            "chart_type": "line",
                        }
                        if ta.get("country_code"):
                            viz_args["country_code"] = ta["country_code"]
                        if ta.get("start_year"):
                            viz_args["start_year"] = ta["start_year"]
                        if ta.get("end_year"):
                            viz_args["end_year"] = ta["end_year"]
                        try:
                            viz_result = await viz_tool.ainvoke(viz_args)
                            # Normalize: MCP tools may return a list of text blocks or a dict.
                            if isinstance(viz_result, list):
                                import json as _json  # noqa: PLC0415

                                _text = "".join(
                                    b.get("text", "")
                                    for b in viz_result
                                    if isinstance(b, dict) and b.get("type") == "text"
                                )
                                try:
                                    viz_result = _json.loads(_text)
                                except (ValueError, TypeError):
                                    viz_result = {}
                            viz_url = (
                                viz_result.get("url") if isinstance(viz_result, dict) else None
                            )
                            if viz_url:
                                card["viz_url"] = viz_url
                                logger.info("[quick_answer_node] attached viz_url=%s", viz_url)
                            else:
                                logger.debug(
                                    "[quick_answer_node] viz_spec returned no url: %s", viz_result
                                )
                        except Exception as _viz_exc:
                            logger.warning("[quick_answer_node] viz_spec call failed: %s", _viz_exc)
                        break  # Only use the first matching data tool result

    logger.info(
        "[quick_answer_node] research_packet length=%d tool_results=%d card_type=%s viz=%s",
        len(final_content),
        len(tool_results),
        card.get("card_type") if card else "none",
        bool(card.get("viz_url")) if card else False,
    )
    return {
        "research_packet": final_content,
        "research_tool_results": tool_results,
        "response_mode": "quick",
        "quick_answer_card": card,
    }
