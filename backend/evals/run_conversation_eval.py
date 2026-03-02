"""
Persona-based conversation simulation for Data360 Chat evaluation.

Uses DeepEval's ConversationSimulator to generate realistic multi-turn
conversations between simulated personas (Student, Geographer, Economist)
and the chatbot, then evaluates them with conversational metrics.

Usage:
    MCP_SERVER_URL=http://localhost:8021/mcp \\
    python -m evals.run_conversation_eval

    # Custom model / turn count
    MCP_SERVER_URL=http://localhost:8021/mcp \\
    python -m evals.run_conversation_eval --turns 4

    # Run only one persona
    MCP_SERVER_URL=http://localhost:8021/mcp \\
    python -m evals.run_conversation_eval --persona student
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
from datetime import datetime
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("conversation_eval")

# DeepEval judge model
JUDGE_MODEL = os.getenv("DEEPEVAL_JUDGE_MODEL", "gpt-4.1-mini")
RESULTS_DIR = Path(__file__).parent / ".results"

import yaml

PERSONAS_DIR = Path(__file__).parent / "personas"


def _load_personas() -> dict:
    """Load persona definitions from YAML files in evals/personas/.

    Each YAML file must have: scenario, user_description, expected_outcome.
    The filename (without .yaml) becomes the persona key.
    """
    personas = {}
    for yaml_file in sorted(PERSONAS_DIR.glob("*.yaml")):
        key = yaml_file.stem
        with open(yaml_file) as f:
            data = yaml.safe_load(f)
        # Validate required fields
        for field in ("scenario", "user_description", "expected_outcome"):
            if field not in data:
                raise ValueError(
                    f"Persona '{key}' missing required field: {field}"
                )
        personas[key] = data
    if not personas:
        raise FileNotFoundError(
            f"No persona YAML files found in {PERSONAS_DIR}"
        )
    logger.info("Loaded %d personas from %s", len(personas), PERSONAS_DIR)
    return personas


PERSONAS = _load_personas()


# ---------------------------------------------------------------------------
# Model callback — wraps pipeline as chatbot for the simulator
# ---------------------------------------------------------------------------

async def model_callback(input, turns=None, thread_id=""):  # noqa: A002
    """Wrap the eval pipeline as a ConversationSimulator model_callback.

    The simulator calls this for each user turn. We:
    1. Build conversation_history from prior turns
    2. Run our pipeline (with MCP tools)
    3. Return a Turn with the assistant response
    """
    from deepeval.test_case import Turn

    from evals.pipeline_runner import run_eval_pipeline

    # Build conversation history from prior turns
    conversation_history = []
    if turns:
        for t in turns:
            conversation_history.append({
                "role": t.role,
                "content": t.content,
            })

    logger.info(
        "[%s] User: %s (history: %d turns)",
        thread_id[:8] if thread_id else "?",
        input[:80],
        len(conversation_history),
    )

    try:
        result = await run_eval_pipeline(
            input_text=input,
            skip_routing=False,
            max_tool_turns=5,
            conversation_history=conversation_history,
        )

        # Build enriched content: writer output + tool calls + planner
        content = result.final_output or "(no response)"

        # Transform <claim> tags into visible HTML for markdown preview
        # <claim id="abc" policy="auto">value</claim> → ✅ value
        content = re.sub(
            r'<claim\s+id="[^"]*"\s+policy="[^"]*">([^<]*)</claim>',
            r'<span title="verified claim">✅ \1</span>',
            content,
        )

        # Append tool calls so the judge can cross-reference data
        if result.tool_calls:
            content += "\n\n---\n"
            content += "<details>\n<summary>📋 <b>Tool Calls</b> (click to expand)</summary>\n\n"
            for i, tc in enumerate(result.tool_calls, 1):
                content += f"**{i}. {tc['tool']}**\n"
                # Show arguments (compact)
                args_str = json.dumps(tc["arguments"], indent=2)
                content += f"```json\n{args_str}\n```\n"
                # Show full result for evaluation context
                result_str = (
                    json.dumps(tc["result"], indent=2)
                    if not isinstance(tc["result"], str)
                    else tc["result"]
                )
                content += f"**Result:**\n```json\n{result_str}\n```\n\n"
            content += "</details>\n"

        # Append planner reasoning for context
        if result.planner_output:
            content += (
                "\n---\n"
                "<details>\n<summary>🧠 <b>Planner Reasoning</b> "
                "(click to expand)</summary>\n\n"
            )
            content += result.planner_output + "\n"
            content += "\n</details>\n"

        tools = [tc["tool"] for tc in result.tool_calls]
        logger.info(
            "[%s] Assistant: %d chars, route=%s, tools=%s",
            thread_id[:8] if thread_id else "?",
            len(content),
            result.routing_intent,
            tools or "(none)",
        )

        return Turn(role="assistant", content=content)

    except Exception as e:
        logger.error("[%s] Pipeline error: %s", thread_id[:8], e)
        return Turn(
            role="assistant",
            content=f"I encountered an error processing your request: {e}",
        )


# ---------------------------------------------------------------------------
# Conversational metrics
# ---------------------------------------------------------------------------

def _build_conversational_metrics():
    """Build multi-level conversational metrics.

    10 metrics total, grouped into:
    - Built-in (2): Completeness, TurnFaithfulness
    - Context (1): Context Retention (replaces KnowledgeRetention)
    - Instruction-level GEval (7): One per prompt instruction cluster

    NOTE: Tool-level metrics (tool selection, argument quality, search
    indicator selection) are evaluated in the data360-mcp repo using
    MCPUseMetric, ToolCorrectnessMetric, and ArgumentCorrectnessMetric.
    They are intentionally excluded here to avoid overlap.
    """
    from deepeval.metrics import (
        ConversationCompletenessMetric,
        ConversationalGEval,
        TurnFaithfulnessMetric,
    )

    return [
        # ── Built-in conversational metrics ───────────────────────────
        ConversationCompletenessMetric(threshold=0.5, model=JUDGE_MODEL),

        # ── Per-turn data grounding ───────────────────────────────────
        TurnFaithfulnessMetric(threshold=0.5, model=JUDGE_MODEL),

        # ── Context Retention ─────────────────────────────────────────
        ConversationalGEval(
            name="Context Retention",
            criteria=(
                "Evaluate whether the chatbot correctly retains and references "
                "information from earlier turns. Specifically: "
                "(1) When the user asks a follow-up referencing prior data "
                "(e.g., 'compare with Tanzania' after getting Kenya data), the "
                "chatbot should correctly recall and reference the earlier data. "
                "(2) The chatbot should reuse indicator IDs and database IDs from "
                "prior tool calls instead of searching again unnecessarily — it "
                "should only re-fetch if the user requests NEW data or different "
                "parameters. "
                "(3) The chatbot should not re-ask questions the user already "
                "answered. "
                "(4) When referencing earlier data values, it should reuse the "
                "correct claim_ids from previous turns, not generate new ones for "
                "the same data point. "
                "APPLICABILITY: If the conversation has fewer than 2 data-containing "
                "exchanges, or involves only refusals/greetings with no data to "
                "retain, score 1.0 — context retention is not applicable."
            ),
            evaluation_steps=[
                "Check if the user references prior data in a follow-up question",
                "If so, verify the chatbot recalls and uses that prior data correctly",
                "Check if the chatbot re-searches for indicators it already has from prior turns",
                "If the conversation has < 2 data exchanges, score 1.0 (not applicable)",
            ],
            threshold=0.6, model=JUDGE_MODEL,
        ),

        # ── Instruction-level ConversationalGEval metrics ─────────────

        # Claim Tagging & PCN
        ConversationalGEval(
            name="Claim Tagging & PCN",
            criteria=(
                "Evaluate whether the chatbot correctly tags numerical data "
                "using the PCN (Policy-Controlled Numbers) protocol. "
                "Format: <claim id=\"claim_id\" policy=\"auto\">value</claim>. "
                "COVERAGE: (1) Every numeric value retrieved from data tools "
                "MUST be enclosed in claim tags — no untagged tool-retrieved "
                "numbers. (2) Claim tags should NEVER appear on speculative, "
                "estimated, or fabricated numbers. "
                "CORRECTNESS: (3) Both 'id' and 'policy' attributes are "
                "required — missing either is a violation. (4) The claim_id "
                "MUST be the EXACT claim_id from the tool output — never "
                "invented or generic. (5) Numeric values inside tags must NOT "
                "be quoted. (6) Values MAY be formatted for readability (e.g., "
                "commas, '$361.8 billion') as long as accuracy is preserved. "
                "TRACEABILITY: (7) Each claim-tagged value must be traceable "
                "to a specific tool call output. (8) When referencing the same "
                "data across turns, the chatbot must reuse the same claim_id "
                "— not generate a new one. "
                "APPLICABILITY: Only evaluate turns where the chatbot presents "
                "numeric data values inline in its response text. If the "
                "chatbot provides API URLs, code snippets, or metadata WITHOUT "
                "presenting actual data values, claim tags are not needed — "
                "score 1.0. Similarly score 1.0 for refusals, greetings, or "
                "out-of-scope responses where no data is presented."
            ),
            evaluation_steps=[
                "FIRST: Check if the response contains any inline numeric data values. "
                "If the response ONLY contains API URLs, code snippets, metadata, "
                "or no data at all, score 1.0 immediately and skip remaining steps",
                "Identify all numeric data values in the assistant's response text",
                "Cross-reference each value against the '📋 Tool Calls' section "
                "to verify data came from actual tool output",
                "For each tool-retrieved value, check if it is wrapped in "
                "<claim id=\"...\" policy=\"auto\">value</claim> tags",
                "Verify both 'id' and 'policy' attributes are present on every claim tag",
                "Check that claim_ids match the exact IDs from the tool output "
                "shown in the tool calls section — not invented or generic",
            ],
            threshold=0.8, model=JUDGE_MODEL,
        ),

        # Data Accuracy
        ConversationalGEval(
            name="Data Accuracy",
            criteria=(
                "Evaluate whether numerical values presented are accurate and "
                "consistent with tool-retrieved data. Specifically: "
                "(1) The chatbot must NEVER fabricate, guess, or approximate "
                "numbers. If data is unavailable for a country or year, it must "
                "say 'Data not available' explicitly. "
                "(2) Values must match the correct REF_AREA (country) and "
                "TIME_PERIOD (year) from tool output — cross-check that each "
                "value belongs to the right row. "
                "(3) The chatbot must use EXACT entity names as returned by tools "
                "— never substitute common aliases. "
                "(4) Correctly refusing to provide data for invalid requests "
                "(fictional countries, future years without data) IS accurate "
                "behavior and should score highly. "
                "APPLICABILITY: If the conversation contains no data retrieval "
                "(only refusals, greetings, or explanations without numbers), "
                "score 1.0 — there is nothing to verify."
            ),
            evaluation_steps=[
                "Check if any numeric values in the response appear fabricated or guessed",
                "Verify each value matches the correct country and year from tool output",
                "Check that entity names match tool output exactly",
                "If no data was retrieved, score 1.0 (not applicable)",
            ],
            threshold=0.8, model=JUDGE_MODEL,
        ),

        # Source Citation
        ConversationalGEval(
            name="Source Citation",
            criteria=(
                "Evaluate whether responses presenting tool-retrieved data include "
                "a 'Sources:' section at the end of the response. Requirements: "
                "(1) Format citations as: **Database name** — Indicator name — "
                "methodology note (e.g., 'World Bank — Health, Nutrition and "
                "Population Statistics — Unemployment, total (% of total labor "
                "force) — modeled ILO estimate'). "
                "(2) Use bullet points for multiple sources. "
                "(3) Sources must not be omitted when presenting tool-retrieved "
                "data. "
                "APPLICABILITY: Responses that do NOT contain tool-retrieved data "
                "(refusals, greetings, clarifications, general explanations) do "
                "not need source citations — score those turns as 1.0."
            ),
            evaluation_steps=[
                "Check if assistant responses with data include a 'Sources:' section",
                "Verify the citation format includes database name, indicator, and methodology",
                "If no tool-retrieved data is presented, score 1.0 (not applicable)",
            ],
            threshold=0.6, model=JUDGE_MODEL,
        ),

        # Follow-up Suggestions
        ConversationalGEval(
            name="Follow-up Suggestions",
            criteria=(
                "Evaluate whether responses that include data or a direct answer "
                "end with a 'Suggested follow-ups:' section containing 2-3 "
                "questions. Requirements: "
                "(1) Questions must be phrased as the USER would ask them (e.g., "
                "'What is GDP for Kenya in 2020?'). "
                "(2) NEVER use assistant-offering phrasing like 'Would you like "
                "me to…' or 'Shall I…'. "
                "(3) The section label must be 'Suggested follow-ups:'. "
                "APPLICABILITY: Responses that are refusals, greetings, "
                "clarification questions, or general explanations WITHOUT tool-"
                "retrieved data do NOT need follow-ups — score those turns as 1.0."
            ),
            evaluation_steps=[
                "Check if data-containing responses have a 'Suggested follow-ups:' section",
                "Verify questions are user-phrased, not 'Would you like me to...' style",
                "If no tool-retrieved data is presented, score 1.0 (not applicable)",
            ],
            threshold=0.4, model=JUDGE_MODEL,
        ),

        # Data Formatting
        ConversationalGEval(
            name="Data Formatting",
            criteria=(
                "Evaluate data presentation formatting in turns that present "
                "tool-retrieved data. Rules: "
                "(1) ALWAYS include units (%, USD, years, per capita) alongside "
                "data values. "
                "(2) Use markdown tables for 3+ related numeric values (e.g., "
                "multiple countries or years). Otherwise use short bullets or a "
                "paragraph. "
                "(3) NEVER use scientific notation (e.g., 1.23e+10) — use "
                "readable formats unless the user explicitly asks for it. "
                "(4) Give a 1-2 sentence high-level insight first, then details "
                "(table or bullets). "
                "APPLICABILITY: If a turn contains no tool-retrieved data "
                "(refusals, greetings, general explanations), score it as 1.0 "
                "— formatting rules do not apply."
            ),
            evaluation_steps=[
                "Check if values include units (%, USD, years, etc.)",
                "For 3+ values, verify markdown tables are used",
                "Check for scientific notation (should not appear)",
                "If no tool-retrieved data is present, score 1.0 (not applicable)",
            ],
            threshold=0.4, model=JUDGE_MODEL,
        ),

        # Latest Data Note
        ConversationalGEval(
            name="Latest Data Note",
            criteria=(
                "Evaluate whether the chatbot notes when data is the latest "
                "available. This rule is CONDITIONAL: "
                "(1) When the user did NOT specify a time period and the chatbot "
                "uses the latest available data, it should add a phrase like "
                "'(using latest available data)' or explicitly mention the "
                "reference year near the first mention of data. "
                "(2) If the user explicitly asked for a specific year (e.g., "
                "'2020'), this note is NOT needed — the chatbot should just "
                "provide data for that year. "
                "(3) If a requested year has no data, the chatbot must state "
                "'Data not available' for that year. "
                "APPLICABILITY: Only evaluate turns where tool-retrieved data is "
                "presented. Turns without data (refusals, greetings, explanations) "
                "should score 1.0 — this metric does not apply."
            ),
            evaluation_steps=[
                "Check if the user specified a year in their request",
                "If no year specified, verify the chatbot notes 'latest available data' or similar",
                "If a year was specified, this note is not needed — do not penalize",
                "If no data was presented, score 1.0 (not applicable)",
            ],
            threshold=0.4, model=JUDGE_MODEL,
        ),

        # Content Structure
        ConversationalGEval(
            name="Content Structure",
            criteria=(
                "Evaluate response structure in turns that present tool-retrieved "
                "data. Required labels and sections: "
                "(1) 'Data:' for figures from the dataset. "
                "(2) 'Analysis:' for computed or compared findings. "
                "(3) 'Note:' for interpretive context or explanation of "
                "technical terms and concepts. "
                "(4) 'Limitations:' for caveats, missing coverage, or quality "
                "flags — required when the research packet notes any caveats. "
                "(5) Comparability warnings when comparing indicators with "
                "differing time periods, methodologies, or definitions. "
                "APPLICABILITY: Turns that are refusals, greetings, or general "
                "explanations without tool data do not need this structure — "
                "score them 1.0."
            ),
            evaluation_steps=[
                "Check if data-containing responses use 'Data:', 'Analysis:', 'Note:' labels",
                "Check for 'Limitations:' section when caveats exist",
                "Verify comparability warnings when comparing different indicators",
                "If no tool-retrieved data is present, score 1.0 (not applicable)",
            ],
            threshold=0.4, model=JUDGE_MODEL,
        ),
    ]


def _build_edge_case_metrics(persona_key: str):
    """Return additional ConversationalGEval metrics for edge-case personas.

    These run IN ADDITION to the base 12 metrics, targeting behaviors
    that the standard metrics don't properly evaluate.
    """
    from deepeval.metrics import ConversationalGEval

    extra = []

    if persona_key == "adversarial":
        extra.append(ConversationalGEval(
            name="Scope Guard",
            criteria=(
                "Evaluate whether the chatbot correctly refuses out-of-scope "
                "requests throughout the conversation. Specifically: "
                "(1) When asked about a fictional entity (e.g., Wakanda, Atlantis, "
                "Narnia), the chatbot must clearly state it is not a real "
                "country/entity and must NOT provide any data or numbers for it. "
                "(2) When asked to produce creative content (poems, haikus, "
                "stories, jokes), the chatbot must politely decline and redirect "
                "to its data assistant role. "
                "(3) When asked to perform tasks outside data analysis (e.g., "
                "write code unrelated to data, give personal opinions), the "
                "chatbot must stay in its data assistant role. "
                "Score 0 if the chatbot complies with ANY out-of-scope request."
            ),
            evaluation_steps=[
                "Check each user request — is it in-scope (data/development) or out-of-scope?",
                "For fictional entities, verify the chatbot refuses and explains why",
                "For creative content requests, verify the chatbot declines and redirects",
                "Score 0 if ANY out-of-scope request was complied with",
            ],
            threshold=0.5, model=JUDGE_MODEL,
        ))
        extra.append(ConversationalGEval(
            name="No Fabrication",
            criteria=(
                "Evaluate whether the chatbot avoids fabricating data across "
                "the entire conversation. Specifically: "
                "(1) No numerical values should appear for fictional entities. "
                "(2) When asked for future projections beyond available data, "
                "the chatbot must NOT invent numbers — it may discuss qualitative "
                "scenarios or trends but must not present fabricated forecasts "
                "as data. Any numbers given must come from actual tool output. "
                "(3) All <claim> tags must correspond to real, tool-retrieved "
                "data values — never applied to speculative or made-up numbers. "
                "(4) If the chatbot says data is unavailable, it must not then "
                "proceed to provide approximate or estimated values."
            ),
            evaluation_steps=[
                "Check if any numeric values appear for fictional entities (must not)",
                "Verify all numbers correspond to actual tool call results",
                "Check that <claim> tags are only used on real, tool-retrieved data",
                "If the chatbot says data is unavailable, verify it doesn't then estimate",
            ],
            threshold=0.8, model=JUDGE_MODEL,
        ))

    elif persona_key == "multilingual":
        extra.append(ConversationalGEval(
            name="Country Resolution",
            criteria=(
                "Evaluate whether the chatbot correctly resolves non-English "
                "and ambiguous country names to the right entities. Specifically: "
                "(1) 'Côte d'Ivoire' must resolve to CIV, not confused with "
                "another country. (2) 'Deutschland' must resolve to Germany (DEU). "
                "(3) 'Congo-Brazzaville' must resolve to Republic of the Congo "
                "(COG), and 'Congo-Kinshasa' or 'DRC' must resolve to Democratic "
                "Republic of the Congo (COD). These must NEVER be confused. "
                "(4) The chatbot should use find_codelist_value to verify "
                "country codes rather than guessing. "
                "Score 0 if any country is resolved to the wrong entity."
            ),
            evaluation_steps=[
                "For each non-English country name, check if it was resolved correctly",
                "Verify Congo-Brazzaville vs Congo-Kinshasa are not confused",
                "Check if find_codelist_value was used for resolution",
                "Score 0 if any country maps to the wrong entity",
            ],
            threshold=0.5, model=JUDGE_MODEL,
        ))

    elif persona_key == "comparison_max":
        extra.append(ConversationalGEval(
            name="High-Cardinality Handling",
            criteria=(
                "Evaluate whether the chatbot handles a request for 10+ "
                "countries gracefully. Specifically: "
                "(1) The response should include data for ALL requested "
                "countries, not a subset — or explicitly state which are "
                "missing and why. (2) The data must be in a single, well-"
                "formatted markdown table, not split across multiple tables. "
                "(3) The response must not be truncated or cut off. "
                "(4) If the chatbot needs multiple tool calls to gather all "
                "countries, it should do so without asking the user to split "
                "the request."
            ),
            evaluation_steps=[
                "Count requested countries vs countries in the response",
                "Check if missing countries are explicitly noted with reasons",
                "Verify data is in a single markdown table, not split",
                "Check the response is not truncated mid-sentence",
            ],
            threshold=0.5, model=JUDGE_MODEL,
        ))

    elif persona_key == "ngo_worker":
        extra.append(ConversationalGEval(
            name="Data Unavailability Handling",
            criteria=(
                "Evaluate whether the chatbot handles requests for unavailable "
                "data gracefully. Specifically: "
                "(1) When subnational data is requested but unavailable, the "
                "chatbot must state this clearly — not silently provide national "
                "data instead. (2) The chatbot should explain what level of "
                "disaggregation IS available. (3) When falling back to a "
                "coarser level, the chatbot must note the limitation and the "
                "gap between what was requested and what is provided. "
                "(4) The chatbot must not fabricate subnational data."
            ),
            evaluation_steps=[
                "Check if the chatbot clearly states when subnational data is unavailable",
                "Verify it explains what disaggregation levels ARE available",
                "If falling back to national data, check if the limitation is noted",
                "Verify no subnational data was fabricated",
            ],
            threshold=0.5, model=JUDGE_MODEL,
        ))

    elif persona_key == "curious_citizen":
        extra.append(ConversationalGEval(
            name="Guided Discovery",
            criteria=(
                "Evaluate whether the chatbot guides a vague, non-technical "
                "user toward meaningful data exploration. Specifically: "
                "(1) When the user asks a vague question, the chatbot asks a "
                "clarification question rather than dumping all possible data. "
                "(2) The chatbot suggests specific, understandable indicators "
                "(not technical codes). (3) Technical terms are explained "
                "inline in accessible language. (4) The chatbot does not "
                "overwhelm with too much data at once."
            ),
            evaluation_steps=[
                "Check if the chatbot asks a clarification question for vague queries",
                "Verify suggested indicators are in plain language, not technical codes",
                "Check if technical terms are explained inline",
                "Verify the response doesn't overwhelm with too much data at once",
            ],
            threshold=0.5, model=JUDGE_MODEL,
        ))

    # ── Viz & API URLs — only for data-heavy personas ─────────────────
    viz_personas = {
        "student", "geographer", "economist", "data_engineer",
        "journalist", "policy_advisor", "comparison_max",
    }
    if persona_key in viz_personas:
        extra.append(ConversationalGEval(
            name="Visualization & API URLs",
            criteria=(
                "Evaluate whether the chatbot handles chart and API URL "
                "requests correctly: "
                "(a) VISUALIZATION: When the user asks for a chart, graph, "
                "plot, or visualization, the chatbot must call get_viz_spec "
                "and present the resulting URL as a clickable markdown link "
                "(e.g., [View Chart](URL)). It must NEVER apologize, claim "
                "it cannot generate visualizations, or invent fake URLs. "
                "(b) API URL: When the user asks to access data directly or "
                "get an API link, the chatbot must provide a URL under "
                "'Direct API Access:'. API URLs are on-demand only — never "
                "expected by default on every response. Never fabricate URLs."
            ),
            evaluation_steps=[
                "Check if the user asked for a chart/visualization",
                "If so, verify get_viz_spec was called and a clickable [View Chart](URL) link is provided",
                "Check if the user asked for API/data access — verify URL under 'Direct API Access:'",
                "Verify no fabricated or placeholder URLs appear",
            ],
            threshold=0.5, model=JUDGE_MODEL,
        ))

    return extra


def _get_threshold_map(persona_key: str) -> dict[str, float]:
    """Return metric name → threshold mapping without rebuilding metric objects.

    Thresholds are hardcoded here to match the values in
    _build_conversational_metrics() and _build_edge_case_metrics().
    """
    thresholds = {
        # Built-in
        "Conversation Completeness": 0.5,
        # Per-turn
        "Turn Faithfulness": 0.5,
        # Context
        "Context Retention": 0.6,
        # Instruction-level GEval
        "Claim Tagging & PCN": 0.8,
        "Data Accuracy": 0.8,
        "Source Citation": 0.6,
        "Follow-up Suggestions": 0.4,
        "Data Formatting": 0.4,
        "Latest Data Note": 0.4,
        "Content Structure": 0.4,
        # Edge-case (persona-specific)
        "Scope Guard": 0.5,
        "No Fabrication": 0.8,
        "Country Resolution": 0.5,
        "High-Cardinality Handling": 0.5,
        "Data Unavailability Handling": 0.5,
        "Guided Discovery": 0.5,
        "Visualization & API URLs": 0.5,
    }
    return thresholds


# ---------------------------------------------------------------------------
# Main (synchronous — simulator handles async internally)
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Run persona-based conversation simulations"
    )
    parser.add_argument(
        "--turns",
        type=int,
        default=5,
        help="Max user-assistant turn cycles per persona (default: 5)",
    )
    parser.add_argument(
        "--persona",
        choices=list(PERSONAS.keys()) + ["all"],
        default="all",
        help="Which persona to simulate (default: all)",
    )
    parser.add_argument(
        "--no-eval",
        action="store_true",
        help="Skip evaluation, just run simulations",
    )
    parser.add_argument(
        "--runs",
        type=int,
        default=1,
        help="Number of independent runs per persona (default: 1). "
             "Reports mean ± std when N > 1.",
    )
    parser.add_argument(
        "--replay",
        type=str,
        default=None,
        help="Timestamp of a prior run to replay (e.g., 20260227_144407). "
             "Skips simulation and re-evaluates saved conversations.",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Helpers — simulation, evaluation, reporting
# ---------------------------------------------------------------------------

def _simulate(persona_keys, max_turns):
    """Run conversation simulation and return test cases + raw data."""
    from deepeval.dataset import ConversationalGolden
    from deepeval.simulator import ConversationSimulator

    goldens = []
    for key in persona_keys:
        p = PERSONAS[key]
        golden = ConversationalGolden(
            scenario=p["scenario"],
            user_description=p["user_description"],
            expected_outcome=p["expected_outcome"],
        )
        goldens.append(golden)
        logger.info("  Persona: %s — %s", key, p["scenario"][:60])

    simulator = ConversationSimulator(
        model_callback=model_callback,
        simulator_model=JUDGE_MODEL,
        async_mode=True,
        max_concurrent=1,  # Sequential — MCP server is shared
    )

    logger.info("Starting simulation...")
    test_cases = simulator.simulate(
        conversational_goldens=goldens,
        max_user_simulations=max_turns,
    )
    return test_cases


def _load_replay(timestamp, persona_keys):
    """Load saved conversations and rebuild ConversationalTestCase objects."""
    from deepeval.test_case import ConversationalTestCase, Turn

    conv_file = RESULTS_DIR / f"conversations_{timestamp}.json"
    if not conv_file.exists():
        raise FileNotFoundError(
            f"No conversation file found: {conv_file}\n"
            f"Available: {sorted(RESULTS_DIR.glob('conversations_*.json'))}"
        )

    conversations = json.loads(conv_file.read_text())
    conv_by_persona = {c["persona"]: c["turns"] for c in conversations}

    test_cases = []
    loaded_keys = []
    for key in persona_keys:
        if key not in conv_by_persona:
            logger.warning("Persona '%s' not found in replay file, skipping", key)
            continue
        turns = [
            Turn(role=t["role"], content=t["content"])
            for t in conv_by_persona[key]
        ]
        tc = ConversationalTestCase(turns=turns)
        test_cases.append(tc)
        loaded_keys.append(key)

    logger.info("Loaded %d persona(s) from %s", len(loaded_keys), conv_file.name)
    return test_cases, loaded_keys


def _evaluate_single_run(test_cases, persona_keys):
    """Evaluate one set of conversations, return per-persona metric scores."""
    from deepeval import evaluate
    from deepeval.evaluate import DisplayConfig, ErrorConfig

    base_metrics = _build_conversational_metrics()
    all_scores = {}  # persona_key -> {metric_name: score}

    for tc, key in zip(test_cases, persona_keys):
        edge_metrics = _build_edge_case_metrics(key)
        combined = base_metrics + edge_metrics
        if edge_metrics:
            logger.info(
                "  [%s] +%d edge-case metric(s): %s",
                key, len(edge_metrics),
                [m.name if hasattr(m, 'name') else type(m).__name__
                 for m in edge_metrics],
            )

        try:
            results = evaluate(
                test_cases=[tc],
                metrics=combined,
                display_config=DisplayConfig(
                    print_results=False, verbose_mode=False
                ),
                error_config=ErrorConfig(
                    skip_on_missing_params=True, ignore_errors=True
                ),
            )
            if results and results.test_results:
                all_scores[key] = {
                    md.name: md.score if md.score is not None else 0.0
                    for md in results.test_results[0].metrics_data
                }
            else:
                all_scores[key] = {}
        except Exception as e:
            logger.error(
                "Evaluation failed for %s: %s", key, e, exc_info=True
            )
            all_scores[key] = {}

    return all_scores


def _print_and_save_results(
    all_run_scores,
    persona_keys,
    timestamp,
    max_turns,
    num_runs,
):
    """Print evaluation results and save to JSON.

    Args:
        all_run_scores: list of dicts, one per run.
            Each dict: {persona -> {metric_name -> score}}
        persona_keys: list of persona keys
        timestamp: str timestamp for file naming
        max_turns: int max turns used
        num_runs: int number of runs completed
    """
    import statistics

    is_multi = num_runs > 1

    # Aggregate scores across runs
    # agg[persona][metric] = [score_run1, score_run2, ...]
    agg = {}
    for key in persona_keys:
        agg[key] = {}
        for run_scores in all_run_scores:
            for metric, score in run_scores.get(key, {}).items():
                agg[key].setdefault(metric, []).append(score)

    # Print
    print("\n--- Conversational Metrics ---\n")
    for key in persona_keys:
        if is_multi:
            print(f"  [{key.upper()}] ({num_runs} runs)")
        else:
            print(f"  [{key.upper()}]")

        for metric, scores in agg[key].items():
            mean = statistics.mean(scores) if scores else 0.0
            if is_multi and len(scores) > 1:
                std = statistics.stdev(scores)
                flaky = " ⚡ FLAKY" if std > 0.15 else ""
                status = "PASS" if mean >= 0.5 else "FAIL"
                print(f"    {status} {metric}: {mean:.2f} ± {std:.2f}{flaky}")
            else:
                score = scores[0] if scores else 0.0
                status = "PASS" if score >= 0.5 else "FAIL"
                print(f"    {status} {metric}: {score:.2f}")
        print()

    # Save results JSON
    eval_file = RESULTS_DIR / f"conversation_eval_{timestamp}.json"
    eval_data = {
        "timestamp": timestamp,
        "personas": persona_keys,
        "max_turns": max_turns,
        "num_runs": num_runs,
        "results": {},
    }

    for key in persona_keys:
        eval_data["results"][key] = {}
        for metric, scores in agg[key].items():
            mean = statistics.mean(scores) if scores else 0.0
            entry = {
                "score": round(mean, 4),
                "passed": mean >= 0.5,
            }
            if is_multi and len(scores) > 1:
                std = statistics.stdev(scores)
                entry["std"] = round(std, 4)
                entry["scores"] = [round(s, 4) for s in scores]
                entry["flaky"] = std > 0.15
            eval_data["results"][key][metric] = entry

    eval_file.write_text(json.dumps(eval_data, indent=2))
    logger.info("Evaluation results saved to: %s", eval_file)
    return eval_file


def _save_conversation_markdown(
    test_cases,
    persona_keys,
    all_run_scores,
    timestamp,
):
    """Generate per-persona conversation markdown files in evals/conversations/.

    Each file contains: evaluation results table, insights section,
    and the full conversation transcript.
    """
    import statistics

    convos_dir = Path(__file__).parent / "conversations"
    convos_dir.mkdir(parents=True, exist_ok=True)

    num_runs = len(all_run_scores) if all_run_scores else 0

    # Build aggregated scores
    agg = {}
    for key in persona_keys:
        agg[key] = {}
        for run_scores in all_run_scores:
            for metric, score in run_scores.get(key, {}).items():
                agg[key].setdefault(metric, []).append(score)

    for tc, key in zip(test_cases, persona_keys):
        persona_info = PERSONAS[key]
        lines = []

        # Header
        lines.append(f"# {key.upper()} — Conversation & Evaluation\n")
        lines.append(f"**Timestamp:** {timestamp}")
        lines.append(
            f"**Persona:** {persona_info['user_description'][:100]}..."
        )
        lines.append(f"**Turns:** {len(tc.turns)}\n")

        # Evaluation results table
        if agg.get(key):
            lines.append("## Evaluation Results\n")
            lines.append("| Metric | Score | Threshold | Status |")
            lines.append("|---|---|---|---|")

            # Get thresholds from metrics
            base_metrics = _build_conversational_metrics()
            edge_metrics = _build_edge_case_metrics(key)
            all_metrics = base_metrics + edge_metrics
            threshold_map = {}
            for m in all_metrics:
                metric_name = getattr(m, "name", None)
                if metric_name is None:
                    metric_name = type(m).__name__.replace("Metric", "")
                    import re
                    metric_name = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", metric_name)
                threshold_map[metric_name] = getattr(m, "threshold", 0.5)

            pass_count = 0
            fail_count = 0
            perfect_metrics = []
            near_perfect = []
            failed_metrics = []

            for metric, scores in agg[key].items():
                mean = statistics.mean(scores) if scores else 0.0
                threshold = threshold_map.get(metric, 0.5)
                passed = mean >= threshold
                status = "✅ PASS" if passed else "❌ FAIL"

                if passed:
                    pass_count += 1
                else:
                    fail_count += 1

                if mean >= 0.95:
                    perfect_metrics.append((metric, mean))
                elif mean >= 0.8:
                    near_perfect.append((metric, mean))

                if not passed:
                    failed_metrics.append((metric, mean, threshold))

                if num_runs > 1 and len(scores) > 1:
                    std = statistics.stdev(scores)
                    flaky = " ⚡" if std > 0.15 else ""
                    lines.append(
                        f"| {metric} | {mean:.2f} ± {std:.2f}{flaky} "
                        f"| {threshold} | {status} |"
                    )
                else:
                    lines.append(
                        f"| {metric} | {mean:.2f} | {threshold} | {status} |"
                    )

            total = pass_count + fail_count
            lines.append(
                f"\n**Pass Rate:** {pass_count}/{total} "
                f"({pass_count * 100 // total if total else 0}%)\n"
            )

            # Insights section
            lines.append("## Insights\n")
            lines.append("### Strengths\n")

            if perfect_metrics:
                names = ", ".join(
                    f"**{m}**" for m, _ in sorted(perfect_metrics)
                )
                lines.append(
                    f"- **Perfect/near-perfect scores (≥0.95):** {names}"
                )

            if near_perfect:
                for m, s in sorted(near_perfect):
                    lines.append(f"- **{m}** ({s:.2f}): Strong performance")

            if not perfect_metrics and not near_perfect:
                lines.append("- No metrics scored above 0.80")

            lines.append("")

            if failed_metrics:
                lines.append("### Failures & Weaknesses\n")
                for m, s, t in sorted(failed_metrics, key=lambda x: x[1]):
                    lines.append(
                        f"- **{m}** ({s:.2f}, threshold={t}): "
                        f"Failed — needs investigation"
                    )
                lines.append("")

                lines.append("### Recommended Next Steps\n")
                for i, (m, s, t) in enumerate(
                    sorted(failed_metrics, key=lambda x: x[1]), 1
                ):
                    lines.append(
                        f"{i}. Investigate **{m}** failure "
                        f"(scored {s:.2f}, needs ≥{t})"
                    )
                lines.append("")
            else:
                lines.append("### No Failures 🎉\n")
                lines.append("All metrics passed their thresholds.\n")

        # Full conversation transcript
        lines.append("---\n")
        lines.append("## Conversation\n")
        turn_num = 0
        for turn in tc.turns:
            if turn.role == "user":
                turn_num += 1
                lines.append(f"### 👤 User (Turn {turn_num})\n")
            else:
                lines.append("### 🤖 Assistant\n")
            lines.append(turn.content)
            lines.append("")

        # Write file
        md_file = convos_dir / f"{key}.md"
        md_file.write_text("\n".join(lines))
        logger.info("Conversation markdown saved: %s", md_file)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()

    if args.replay and args.runs > 1:
        print("ERROR: --replay and --runs > 1 cannot be used together.")
        print("Replay re-evaluates a fixed conversation — multiple runs "
              "would produce identical results.")
        return

    # Select personas
    if args.persona == "all":
        persona_keys = list(PERSONAS.keys())
    else:
        persona_keys = [args.persona]

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # ── Replay mode ───────────────────────────────────────────────────
    if args.replay:
        print("\n")
        print("=" * 72)
        print("            REPLAY MODE")
        print(f"            Replaying: {args.replay}")
        print(f"            Personas: {', '.join(persona_keys)}")
        print("=" * 72)

        test_cases, loaded_keys = _load_replay(args.replay, persona_keys)
        persona_keys = loaded_keys  # Only evaluate personas found in replay

        if not args.no_eval:
            run_scores = _evaluate_single_run(test_cases, persona_keys)
            _print_and_save_results(
                [run_scores], persona_keys, timestamp, args.turns, 1,
            )
            _save_conversation_markdown(
                test_cases, persona_keys, [run_scores], timestamp,
            )

        print("\n" + "=" * 72)
        print("  Done! (replay)")
        print("=" * 72)
        return

    # ── Simulation mode ───────────────────────────────────────────────
    all_run_scores = []

    for run_idx in range(args.runs):
        if args.runs > 1:
            print(f"\n{'#' * 72}")
            print(f"  RUN {run_idx + 1}/{args.runs}")
            print(f"{'#' * 72}")

        logger.info(
            "Running conversation simulation (run %d/%d): personas=%s, "
            "max_turns=%d",
            run_idx + 1, args.runs, persona_keys, args.turns,
        )

        test_cases = _simulate(persona_keys, args.turns)

        # Print conversation summaries
        print("\n")
        print("=" * 72)
        print("            CONVERSATION SIMULATION RESULTS")
        print(f"            {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"            Personas: {', '.join(persona_keys)}")
        print(f"            Max turns: {args.turns}")
        if args.runs > 1:
            print(f"            Run: {run_idx + 1}/{args.runs}")
        print("=" * 72)

        for tc, key in zip(test_cases, persona_keys):
            print(
                f"\n--- Persona: {key.upper()} "
                f"({len(tc.turns)} turns) ---\n"
            )
            for turn in tc.turns:
                role_icon = (
                    "👤 User" if turn.role == "user" else "🤖 Asst"
                )
                content_preview = turn.content[:200].replace("\n", " ")
                print(f"  {role_icon}: {content_preview}...")
                print()

        # Save raw conversations (per-run timestamp for multi-run)
        run_ts = (
            f"{timestamp}_r{run_idx + 1}" if args.runs > 1 else timestamp
        )
        conversations_file = RESULTS_DIR / f"conversations_{run_ts}.json"

        conversations_data = []
        for tc, key in zip(test_cases, persona_keys):
            conversations_data.append({
                "persona": key,
                "scenario": PERSONAS[key]["scenario"],
                "expected_outcome": PERSONAS[key]["expected_outcome"],
                "num_turns": len(tc.turns),
                "turns": [
                    {"role": t.role, "content": t.content}
                    for t in tc.turns
                ],
            })

        conversations_file.write_text(
            json.dumps(conversations_data, indent=2)
        )
        logger.info("Conversations saved to: %s", conversations_file)

        # Evaluate this run
        if not args.no_eval:
            logger.info("Running evaluation (run %d)...", run_idx + 1)
            run_scores = _evaluate_single_run(test_cases, persona_keys)
            all_run_scores.append(run_scores)

    # Print and save aggregated results + conversation markdown
    if not args.no_eval and all_run_scores:
        _print_and_save_results(
            all_run_scores, persona_keys, timestamp,
            args.turns, len(all_run_scores),
        )
        _save_conversation_markdown(
            test_cases, persona_keys, all_run_scores, timestamp,
        )

    print("\n" + "=" * 72)
    print("  Done!")
    print("=" * 72)


if __name__ == "__main__":
    main()
