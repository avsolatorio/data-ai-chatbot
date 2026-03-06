"""
Quantifiable evaluation scorecard runner.

Runs test cases through the live pipeline and evaluates with
DeepEval's LLM-as-a-Judge metrics + custom metrics, producing
numerical scores (0.0-1.0) per test case and aggregated stats.

Supports --model flag for cross-model comparison.

Usage:
    MCP_SERVER_URL=http://localhost:8021/sse \
    PYTHONPATH=. .venv/bin/python -m evals.run_scorecard

    # Compare models:
    PYTHONPATH=. .venv/bin/python -m evals.run_scorecard --model gpt-4o-mini
    PYTHONPATH=. .venv/bin/python -m evals.run_scorecard --model gemini/gemini-2.5-flash
"""

from __future__ import annotations

import argparse
import asyncio
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
logger = logging.getLogger("scorecard")

# Use the same model as the chatbot for LLM-judge evaluations
JUDGE_MODEL = os.environ.get("DEEPEVAL_LLM", "gpt-5.1")

RESULTS_DIR = Path(__file__).parent / ".results"

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Edge-case test cases — things ConversationSimulator can't naturally trigger.
# Multi-turn data retrieval, charts, methodology, etc. are tested via
# run_conversation_eval.py using persona-based conversation simulation.
# ---------------------------------------------------------------------------
SCORECARD_CASES = [
    # ── Out of scope (L100, L221: refuse non-development topics) ──────
    {
        "id": "sc_out_of_scope",
        "input": "What is the best recipe for chocolate cake?",
        "expected_output": "A polite refusal explaining that Data360 Chat covers development and economics data only.",
        "expected_tools": [],
        "expected_entities": [],
        "expect_chart": False,
        "expect_claim_tags": False,
        "expect_follow_ups": False,
        "expect_refusal": True,
        "skip_routing": False,
    },
    # ── Greeting (DIRECT route) ───────────────────────────────────────
    {
        "id": "sc_greeting",
        "input": "Hello, how are you?",
        "expected_output": "A friendly greeting without data or tool usage.",
        "expected_tools": [],
        "expected_entities": [],
        "expect_chart": False,
        "expect_claim_tags": False,
        "expect_follow_ups": False,
        "expect_refusal": False,
        "skip_routing": False,
    },
    # ── Ambiguity (L103: ask ONE clarifying question) ─────────────────
    {
        "id": "sc_ambiguity",
        "input": "What is the GDP for 2021?",
        "expected_output": "A clarifying question asking which country the user wants GDP for.",
        "expected_tools": [],
        "expected_entities": ["GDP"],
        "expect_chart": False,
        "expect_claim_tags": False,
        "expect_follow_ups": False,
        "expect_refusal": False,
        "expect_clarification": True,
        "skip_routing": False,
    },
    # ── Codelist ambiguity (L104: resolve ambiguous country) ──────────
    {
        "id": "sc_codelist_ambiguity",
        "input": "What is the GDP of Congo?",
        "expected_output": "A clarifying question or response that distinguishes Republic of Congo vs DRC.",
        "expected_tools": ["data360_search_indicators"],
        "expected_entities": ["Congo"],
        "expect_chart": False,
        "expect_claim_tags": False,
        "expect_follow_ups": False,
        "expect_refusal": False,
        "expect_codelist_usage": True,
        "skip_routing": True,
    },
]


def _build_deepeval_test_cases(
    pipeline_results: list,
) -> list:
    """Convert pipeline results into DeepEval LLMTestCase objects."""
    from deepeval.test_case import LLMTestCase, ToolCall

    test_cases = []
    for pr, sc in zip(pipeline_results, SCORECARD_CASES):
        tools_called = [
            ToolCall(
                name=tc["tool"],
                input_parameters=tc.get("arguments", {}),
                output=str(tc.get("result", ""))[:500],
            )
            for tc in pr.tool_calls
        ]
        expected_tools = [
            ToolCall(name=t, input_parameters={}, output="") for t in sc.get("expected_tools", [])
        ]
        tc = LLMTestCase(
            name=sc["id"],
            input=sc["input"],
            actual_output=pr.final_output or "(no output)",
            expected_output=sc.get("expected_output", ""),
            tools_called=tools_called or None,
            expected_tools=expected_tools or None,
        )
        test_cases.append(tc)
    return test_cases


# ---------------------------------------------------------------------------
# Prompt instructions for PromptAlignmentMetric (RESEARCH cases only)
# Derived from prompts.py — covers all output-facing instructions.
# ---------------------------------------------------------------------------
RESEARCH_INSTRUCTIONS = [
    # Output formatting (L160, L243, L265, L240, L241, L167, L225, L239)
    "Wrap every numerical data value in <claim> XML tags with a unique id attribute",
    "End the response with a Sources section citing the data provider and database",
    "Suggest 2-3 follow-up questions the user may want to explore",
    "Include units (%, USD, years, per capita, etc.) alongside all data values",
    "Use readable number formats; never use scientific notation like 1.23e+10",
    "Note when data shown is the latest available and mention the reference year",
    "When a chart or visualization is generated, present its URL as a clickable markdown link",
    "When presenting 3 or more comparable data points, use a markdown table",
    # Data integrity (L127, L156, L232-233)
    "Never invent, assume, or fabricate indicator IDs, numeric values, or data points",
    "Never guess or approximate data; if data is unavailable for a country or year, state so explicitly",
    # Content structure (L236, L258-259, L155)
    "Label content sections with types: Data for figures from datasets, Analysis for computed findings, Note for context",
    "If there are caveats, missing coverage, or quality flags from the research, include a Limitations section",
    "Use the exact entity names (countries, regions, indicators) as returned by the data tools, not common aliases",
]


def _build_research_metrics():
    """Build metrics for RESEARCH-routed test cases.

    Includes all LLM-judged metrics:
    - AnswerRelevancy, Data Accuracy, Response Completeness (existing)
    - PromptAlignment (replaces 8 custom regex metrics)
    - Faithfulness (replaces custom No Hallucination)
    - ToolCorrectness (replaces custom Tool Selection F1)
    - ArgumentCorrectness (new — validates tool argument semantics)
    """
    from deepeval.metrics import (
        AnswerRelevancyMetric,
        ArgumentCorrectnessMetric,
        FaithfulnessMetric,
        GEval,
        PromptAlignmentMetric,
        ToolCorrectnessMetric,
    )
    from deepeval.test_case import LLMTestCaseParams

    return [
        AnswerRelevancyMetric(
            threshold=0.5,
            model=JUDGE_MODEL,
        ),
        GEval(
            name="Data Accuracy",
            criteria=(
                "Evaluate whether the response contains accurate, specific data "
                "that answers the user's question. The response should include "
                "concrete numbers, years, or facts rather than vague statements. "
                "If the user asked about data, the response must contain actual data points."
            ),
            evaluation_params=[
                LLMTestCaseParams.INPUT,
                LLMTestCaseParams.ACTUAL_OUTPUT,
                LLMTestCaseParams.EXPECTED_OUTPUT,
            ],
            threshold=0.5,
            model=JUDGE_MODEL,
        ),
        GEval(
            name="Response Completeness",
            criteria=(
                "Evaluate whether the response fully addresses the user's question. "
                "A complete response should cover all aspects of the query, mention "
                "all requested countries/indicators, and provide sufficient context. "
                "Score lower if important parts of the question are ignored."
            ),
            evaluation_params=[
                LLMTestCaseParams.INPUT,
                LLMTestCaseParams.ACTUAL_OUTPUT,
                LLMTestCaseParams.EXPECTED_OUTPUT,
            ],
            threshold=0.5,
            model=JUDGE_MODEL,
        ),
        PromptAlignmentMetric(
            prompt_instructions=RESEARCH_INSTRUCTIONS,
            threshold=0.5,
            model=JUDGE_MODEL,
        ),
        FaithfulnessMetric(
            threshold=0.5,
            model=JUDGE_MODEL,
        ),
        ToolCorrectnessMetric(
            threshold=0.5,
            model=JUDGE_MODEL,
        ),
        ArgumentCorrectnessMetric(
            threshold=0.5,
            model=JUDGE_MODEL,
        ),
    ]


def _build_direct_metrics():
    """Build metrics for DIRECT-routed test cases (greetings, out-of-scope).

    Minimal metrics — no tool or instruction-following checks.
    """
    from deepeval.metrics import AnswerRelevancyMetric

    return [
        AnswerRelevancyMetric(
            threshold=0.5,
            model=JUDGE_MODEL,
        ),
    ]


def _compute_custom_scores(
    pipeline_results: list,
    setup_results: list | None = None,
) -> dict[str, list[float]]:
    """Compute conditional custom metrics that can't be replaced by built-in DeepEval.

    These are kept because they are test-case-specific (gated by expect_* flags)
    and don't apply universally to every test case. Built-in DeepEval metrics
    (PromptAlignment, Faithfulness, ToolCorrectness, ArgumentCorrectness) now
    handle the universal instruction-following checks.

    Remaining custom metrics (11):
    - Entity Coverage         (L155)
    - Chart Accuracy          (L142)
    - Scope Guard             (L100, L221)
    - Clarification           (L103)
    - Comparability Warning   (L170)
    - Codelist Usage          (L104, L123)
    - Data Unavailable        (L154)
    - API URL Present         (L148, L226)
    - Max One Question        (L173)
    - [P] Research Packet
    - [P] Claim Tags
    """
    if setup_results is None:
        setup_results = [None] * len(pipeline_results)

    metric_names = [
        "Entity Coverage",
        "Chart Accuracy",
        "Scope Guard",
        "Clarification",
        "Comparability Warning",
        "Codelist Usage",
        "Data Unavailable",
        "API URL Present",
        "Max One Question",
        "[P] Research Packet",
        "[P] Claim Tags",
    ]
    custom_scores: dict[str, list[float]] = {m: [] for m in metric_names}

    re_claim = re.compile(r"<claim\s+id=", re.IGNORECASE)
    re_api_url = re.compile(r"https?://[^\s)]+/api/", re.IGNORECASE)
    re_question_marks = re.compile(r"\?")

    refusal_kw = [
        "out of scope",
        "outside",
        "development data",
        "economics data",
        "cannot help with",
        "don't cover",
        "not within",
        "specialize in",
        "data360",
        "scope",
    ]
    clarify_kw = [
        "which country",
        "could you specify",
        "which region",
        "did you mean",
        "could you clarify",
        "please specify",
        "specific country",
        "which specific",
        "particular country",
    ]
    compare_kw = [
        "different method",
        "different definition",
        "comparab",
        "caveat",
        "caution",
        "note that",
        "measured differently",
        "limitations",
        "not directly comparable",
    ]
    unavailable_kw = [
        "not available",
        "no data",
        "data not found",
        "not found",
        "no results",
        "does not exist",
        "no indicator",
        "couldn't find",
        "could not find",
        "no matching",
        "not a recognized",
        "fictional",
        "not yet available",
    ]

    for pr, sc, sr in zip(pipeline_results, SCORECARD_CASES, setup_results):
        tools_called = set(tc["tool"] for tc in pr.tool_calls)
        output = pr.final_output or ""
        output_lower = output.lower()

        # --- Entity Coverage (L155) ---
        entities = sc.get("expected_entities", [])
        if not entities:
            custom_scores["Entity Coverage"].append(1.0)
        else:
            found = sum(1 for e in entities if e.lower() in output_lower)
            custom_scores["Entity Coverage"].append(found / len(entities))

        # --- Chart Accuracy (L142) ---
        chart_called = bool(tools_called & {"data360_get_viz_spec"})
        chart_expected = sc.get("expect_chart", False)
        custom_scores["Chart Accuracy"].append(1.0 if chart_called == chart_expected else 0.0)

        # --- Scope Guard (L100, L221) ---
        if sc.get("expect_refusal", False):
            no_tools = len(tools_called) == 0
            has_refusal = any(p in output_lower for p in refusal_kw)
            custom_scores["Scope Guard"].append(1.0 if (no_tools and has_refusal) else 0.0)
        else:
            custom_scores["Scope Guard"].append(1.0)

        # --- Clarification (L103) ---
        if sc.get("expect_clarification", False):
            has_question = "?" in output
            has_clarify = any(p in output_lower for p in clarify_kw)
            custom_scores["Clarification"].append(1.0 if (has_question or has_clarify) else 0.0)
        else:
            custom_scores["Clarification"].append(1.0)

        # --- Comparability Warning (L170) ---
        if sc.get("expect_comparability", False):
            has_warning = any(p in output_lower for p in compare_kw)
            custom_scores["Comparability Warning"].append(1.0 if has_warning else 0.0)
        else:
            custom_scores["Comparability Warning"].append(1.0)

        # --- Codelist Usage (L104, L123) ---
        if sc.get("expect_codelist_usage", False):
            codelist_called = "data360_find_codelist_value" in tools_called
            custom_scores["Codelist Usage"].append(1.0 if codelist_called else 0.0)
        else:
            custom_scores["Codelist Usage"].append(1.0)

        # --- Data Unavailable (L154) ---
        if sc.get("expect_data_unavailable", False):
            has_unavailable = any(p in output_lower for p in unavailable_kw)
            custom_scores["Data Unavailable"].append(1.0 if has_unavailable else 0.0)
        else:
            custom_scores["Data Unavailable"].append(1.0)

        # --- API URL Present (L148, L226) ---
        if sc.get("expect_api_url", False):
            has_api = (
                bool(re_api_url.search(output))
                or "api url" in output_lower
                or "direct api" in output_lower
                or "api access" in output_lower
                or "data360_get_data_api_url" in (tc["tool"] for tc in pr.tool_calls)
            )
            custom_scores["API URL Present"].append(1.0 if has_api else 0.0)
        else:
            custom_scores["API URL Present"].append(1.0)

        # --- Max One Question (L173) ---
        if sc.get("expect_max_one_question", False):
            num_questions = len(re_question_marks.findall(output))
            custom_scores["Max One Question"].append(1.0 if num_questions <= 2 else 0.0)
        else:
            custom_scores["Max One Question"].append(1.0)

        # ── Planner metrics ──────────────────────────────────────────────
        planner = pr.planner_output or ""
        planner_lower = planner.lower()

        if pr.routing_intent == "RESEARCH" and planner:
            packet_fields = ["intent", "selection logic", "data gap"]
            found = sum(1 for f in packet_fields if f in planner_lower)
            custom_scores["[P] Research Packet"].append(found / len(packet_fields))
        else:
            custom_scores["[P] Research Packet"].append(1.0)

        if sc.get("expect_claim_tags", False) and pr.tool_calls and planner:
            has_claim = bool(re_claim.search(planner))
            custom_scores["[P] Claim Tags"].append(1.0 if has_claim else 0.0)
        else:
            custom_scores["[P] Claim Tags"].append(1.0)

    return custom_scores


def _print_scorecard(
    deepeval_results,
    custom_scores: dict[str, list[float]],
    pipeline_results: list,
    model_name: str,
    setup_results: list | None = None,
):
    """Print and save a formatted scorecard."""
    # Aggregate DeepEval metric scores
    metric_scores: dict[str, list[float]] = {}
    if deepeval_results is not None:
        for tc_result in deepeval_results.test_results:
            for metric_data in tc_result.metrics_data:
                name = metric_data.name
                if name not in metric_scores:
                    metric_scores[name] = []
                score = metric_data.score if metric_data.score is not None else 0.0
                metric_scores[name].append(score)
    else:
        logger.warning("DeepEval results not available — showing custom metrics only.")

    # Combine with custom metrics
    all_scores = {**metric_scores, **custom_scores}

    # Print header
    print("\n")
    print("=" * 72)
    print("                    EVALUATION SCORECARD")
    print(f"                    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"                    Model: {model_name}")
    print(f"                    Judge: {JUDGE_MODEL}")
    print(f"                    Test cases: {len(pipeline_results)}")
    print("=" * 72)

    # Print per-test-case details
    print("\n--- Per Test Case ---\n")
    for i, (pr, sc) in enumerate(zip(pipeline_results, SCORECARD_CASES)):
        tools_str = ", ".join(tc["tool"] for tc in pr.tool_calls) or "(none)"
        output_preview = (pr.final_output or "")[:100].replace("\n", " ")
        print(f"  [{sc['id']}] {sc['input']}")
        print(f"    Routing: {pr.routing_intent} | Tools: {tools_str}")
        if pr.planner_output:
            planner_preview = pr.planner_output[:80].replace("\n", " ")
            print(f"    [P] Planner: {planner_preview}...")
        print(f"    Output: {output_preview}...")

        # Show scores for this test case
        scores_parts = []
        for metric_name, scores in all_scores.items():
            scores_parts.append(f"{metric_name}: {scores[i]:.2f}")
        print(f"    Scores: {' | '.join(scores_parts)}")
        print()

    # Print aggregated summary
    print("--- Aggregated Scores ---\n")
    print(f"  {'Metric':<25} {'Mean':>6} {'Pass%':>7} {'Min':>6} {'Max':>6}")
    print(f"  {'─' * 25} {'─' * 6} {'─' * 7} {'─' * 6} {'─' * 6}")

    summary = {}
    for name, scores in all_scores.items():
        if not scores:
            continue
        mean = sum(scores) / len(scores)
        pass_rate = sum(1 for s in scores if s >= 0.5) / len(scores) * 100
        min_s = min(scores)
        max_s = max(scores)
        print(f"  {name:<25} {mean:>6.2f} {pass_rate:>6.0f}% {min_s:>6.2f} {max_s:>6.2f}")
        summary[name] = {
            "mean": round(mean, 4),
            "pass_rate": round(pass_rate, 1),
            "min": round(min_s, 4),
            "max": round(max_s, 4),
            "scores": [round(s, 4) for s in scores],
        }

    print("=" * 72)

    # Save results as JSON with model name in filename
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_slug = model_name.replace("/", "_").replace(" ", "_")
    result_file = RESULTS_DIR / f"scorecard_{model_slug}_{timestamp}.json"

    result_data = {
        "timestamp": datetime.now().isoformat(),
        "model": model_name,
        "judge_model": JUDGE_MODEL,
        "num_test_cases": len(pipeline_results),
        "metrics": summary,
        "test_cases": [
            {
                "id": sc["id"],
                "input": sc["input"],
                "routing": pr.routing_intent,
                "tools_called": [tc["tool"] for tc in pr.tool_calls],
                "expected_tools": sc.get("expected_tools", []),
                "setup_tools_called": ([tc["tool"] for tc in sr.tool_calls] if sr else None),
                "output_length": len(pr.final_output or ""),
                "planner_output_length": len(pr.planner_output or ""),
                "turns_used": pr.turns_used,
                "error": pr.error,
            }
            for pr, sc, sr in zip(pipeline_results, SCORECARD_CASES, setup_results)
        ],
    }
    result_file.write_text(json.dumps(result_data, indent=2))
    print(f"\n  Results saved to: {result_file}\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run quantifiable evaluation scorecard against the live pipeline.",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help=(
            "Model to use for the chatbot pipeline (e.g., gpt-5.1, gpt-4o-mini, "
            "gemini/gemini-2.5-flash). Defaults to CHAT_MODEL from .env."
        ),
    )
    parser.add_argument(
        "--judge",
        type=str,
        default=None,
        help="Model for DeepEval LLM judge (default: DEEPEVAL_LLM env or gpt-5.1).",
    )
    return parser.parse_args()


async def main():
    args = parse_args()

    global JUDGE_MODEL
    if args.judge:
        JUDGE_MODEL = args.judge

    from evals.pipeline_runner import run_eval_pipeline

    # Determine model name
    model_name = args.model  # May be None — pipeline will use default

    # Run all test cases through the live pipeline
    logger.info(
        "Running %d test cases through the pipeline (model=%s)...",
        len(SCORECARD_CASES),
        model_name or "(default from .env)",
    )
    pipeline_results = []
    setup_results = []  # Store setup results for multi-turn validation

    for i, sc in enumerate(SCORECARD_CASES):
        logger.info(
            "[%d/%d] %s: %s",
            i + 1,
            len(SCORECARD_CASES),
            sc["id"],
            sc["input"][:60],
        )

        # Multi-turn support: if test case has a "setup_input", run it first
        # to establish conversation context (e.g., fetch data before asking methodology).
        conversation_history = None
        setup_result = None
        if sc.get("setup_input"):
            logger.info("  [setup] Running setup: %s", sc["setup_input"][:60])
            setup_result = await run_eval_pipeline(
                input_text=sc["setup_input"],
                model=model_name,
                skip_routing=True,
            )
            if setup_result.error:
                logger.error("  [setup] ERROR: %s", setup_result.error)
            else:
                logger.info(
                    "  [setup] Tools=%s, Output=%d chars",
                    [tc["tool"] for tc in setup_result.tool_calls],
                    len(setup_result.final_output),
                )
            # Build conversation history from setup result
            conversation_history = [
                {"role": "user", "content": sc["setup_input"]},
                {"role": "assistant", "content": setup_result.final_output or ""},
            ]

        result = await run_eval_pipeline(
            input_text=sc["input"],
            model=model_name,
            skip_routing=sc.get("skip_routing", True),
            conversation_history=conversation_history,
        )
        if result.error:
            logger.error("  ERROR: %s", result.error)
        else:
            tools = [tc["tool"] for tc in result.tool_calls]
            logger.info(
                "  Route=%s, Tools=%s, Output=%d chars",
                result.routing_intent,
                tools,
                len(result.final_output),
            )
        pipeline_results.append(result)
        setup_results.append(setup_result)  # None if no setup

    # Use actual model name from results
    actual_model = pipeline_results[0].model or model_name or "unknown"

    # ── Two-track evaluation ──────────────────────────────────────────
    # RESEARCH cases get full metrics (PromptAlignment, Faithfulness,
    # ToolCorrectness, ArgumentCorrectness + AnswerRelevancy + 2 GEvals).
    # DIRECT cases get only AnswerRelevancy (no tool/instruction checks).
    # This prevents PromptAlignmentMetric from penalizing greetings for
    # missing claim tags, sources, etc.
    # ──────────────────────────────────────────────────────────────────
    logger.info("Building DeepEval test cases...")
    all_deepeval_tcs = _build_deepeval_test_cases(pipeline_results)

    # Partition indices by routing intent
    research_indices = []
    direct_indices = []
    for i, pr in enumerate(pipeline_results):
        if pr.routing_intent == "DIRECT":
            direct_indices.append(i)
        else:
            research_indices.append(i)

    logger.info(
        "Two-track split: %d RESEARCH, %d DIRECT",
        len(research_indices),
        len(direct_indices),
    )

    from deepeval import evaluate
    from deepeval.evaluate import DisplayConfig, ErrorConfig

    eval_config = dict(
        display_config=DisplayConfig(print_results=False, verbose_mode=False),
        error_config=ErrorConfig(skip_on_missing_params=True, ignore_errors=True),
    )

    # Track per-test-case DeepEval results in order
    per_tc_scores: list[dict[str, float | None]] = [{} for _ in pipeline_results]

    # --- RESEARCH batch ---
    if research_indices:
        research_tcs = [all_deepeval_tcs[i] for i in research_indices]
        research_metrics = _build_research_metrics()
        logger.info(
            "Running RESEARCH evaluate() with %d metrics on %d cases...",
            len(research_metrics),
            len(research_tcs),
        )
        try:
            res = evaluate(test_cases=research_tcs, metrics=research_metrics, **eval_config)
            if res:
                for tc_result, orig_idx in zip(res.test_results, research_indices):
                    for md in tc_result.metrics_data:
                        per_tc_scores[orig_idx][md.name] = md.score if md.score is not None else 0.0
        except SystemExit:
            logger.warning("DeepEval RESEARCH batch called sys.exit — continuing.")
        except Exception as e:
            logger.error("DeepEval RESEARCH evaluate() failed: %s", e)

    # --- DIRECT batch ---
    if direct_indices:
        direct_tcs = [all_deepeval_tcs[i] for i in direct_indices]
        direct_metrics = _build_direct_metrics()
        logger.info(
            "Running DIRECT evaluate() with %d metrics on %d cases...",
            len(direct_metrics),
            len(direct_tcs),
        )
        try:
            res = evaluate(test_cases=direct_tcs, metrics=direct_metrics, **eval_config)
            if res:
                for tc_result, orig_idx in zip(res.test_results, direct_indices):
                    for md in tc_result.metrics_data:
                        per_tc_scores[orig_idx][md.name] = md.score if md.score is not None else 0.0
        except SystemExit:
            logger.warning("DeepEval DIRECT batch called sys.exit — continuing.")
        except Exception as e:
            logger.error("DeepEval DIRECT evaluate() failed: %s", e)

    # Merge DeepEval results into metric_scores (name -> list of scores)
    # For metrics that weren't evaluated on a test case, use None -> 0.0
    all_metric_names = set()
    for scores_dict in per_tc_scores:
        all_metric_names.update(scores_dict.keys())

    deepeval_metric_scores: dict[str, list[float]] = {}
    for name in sorted(all_metric_names):
        deepeval_metric_scores[name] = [tc_scores.get(name, 0.0) for tc_scores in per_tc_scores]

    # Compute custom metric scores
    custom_scores = _compute_custom_scores(pipeline_results, setup_results=setup_results)

    # Print and save the scorecard (pass merged results)
    _print_scorecard(
        deepeval_results=None,  # We pass None since we handle merging ourselves
        custom_scores={**deepeval_metric_scores, **custom_scores},
        pipeline_results=pipeline_results,
        model_name=actual_model,
        setup_results=setup_results,
    )


if __name__ == "__main__":
    asyncio.run(main())
