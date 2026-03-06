"""Per-turn evaluation: context building, pre-filtering, and GEval scoring.

Extracted from run_conversation_eval.py. Handles the per-turn evaluation
pipeline: building structured context from each turn, selecting applicable
metrics via pre-filtering flags, and running GEval metrics per turn.
"""

from __future__ import annotations

import json
import logging
import re

logger = logging.getLogger("conversation_eval")


# ---------------------------------------------------------------------------
# Tool data detection
# ---------------------------------------------------------------------------


def _turn_has_tool_data(content: str) -> bool:
    """Check if an assistant turn contains tool-retrieved data.

    Used for pre-filtering: if no tool data, data-dependent metrics
    auto-score 1.0 without calling the LLM judge.
    """
    if not content:
        return False
    markers = [
        "\U0001f4cb Tool Calls",
        "<claim ",
        "tool_output",
        "OBS_VALUE",
        "\U0001f527 Tool Call",
    ]
    return any(marker in content for marker in markers)


# ---------------------------------------------------------------------------
# Context building
# ---------------------------------------------------------------------------


def _build_condensed_context(
    user_input: str,
    assistant_output: str,
    turn_idx: int,
    tool_calls: list[dict] | None = None,
    routing_intent: str = "",
) -> dict:
    """Build a structured context dict for per-turn evaluation.

    Extracts evaluation-relevant signals from a single turn into a dict
    with boolean flags for pre-filtering and structured fields for the
    LLM judge. Replaces the old string-based context with richer signals.

    Args:
        user_input: The user's message for this turn.
        assistant_output: The assistant's rendered response.
        turn_idx: Zero-based index of this turn in the conversation.
        tool_calls: Optional structured tool call data from TurnData.
            Each entry: {"tool": str, "arguments": dict, "result": ...}
            or HTTP mode: {"name": str, "args": dict, "output": ...}
        routing_intent: The routing classification (e.g., "RESEARCH", "DIRECT").
    """
    output = assistant_output or ""
    user = user_input or ""

    # Extract tool call names
    tools_called = re.findall(r"Tool Call #\d+: `([^`]+)`", output)

    # Extract claim IDs and values
    claims_raw = re.findall(
        r'<claim\s+id="([^"]+)"[^>]*>([^<]+)</claim>',
        output,
    )
    claims = {cid: cval.strip() for cid, cval in claims_raw}

    # Extract indicator/database IDs from tool args
    indicators = set(re.findall(r'indicator_id["\s:]+([A-Z0-9_]+)', output))
    databases = set(re.findall(r'database_id["\s:]+([A-Z0-9_]+)', output))

    # Extract ref_areas and time_periods from tool args
    ref_areas = set(re.findall(r'(?:ref_area|country_code|REF_AREA)["\s:]+([A-Z]{3})', output))
    multi_codes = re.findall(
        r'(?:ref_area|country_code|REF_AREA)["\s:]+([A-Z]{3}(?:,[A-Z]{3})+)', output
    )
    for mc in multi_codes:
        ref_areas.update(mc.split(","))
    time_periods = set(re.findall(r'(?:TIME_PERIOD|start_year|end_year)["\s:]+(\d{4})', output))

    # Detect data gaps from response text
    gap_patterns = [
        r"(?:data|information)\s+(?:is\s+)?(?:not|un)\s*available",
        r"no\s+(?:recent\s+)?data\s+(?:was\s+)?(?:found|available)",
        r"could\s+not\s+(?:find|retrieve|locate)\s+(?:any\s+)?data",
        r"does\s+not\s+(?:have|contain)\s+data",
        r"no\s+results?\s+(?:were\s+)?(?:found|returned)",
        r"don'?t\s+have\s+(?:live\s+)?access",
    ]
    data_gaps = []
    for pat in gap_patterns:
        matches = re.findall(pat, output, re.IGNORECASE)
        data_gaps.extend(matches)
    has_data_gap = len(data_gaps) > 0

    # Detect alternatives suggested
    alt_patterns = [
        r"(?:alternative|instead|you\s+(?:could|might|can)\s+(?:try|look|use))",
        r"(?:suggest|recommend)\s+(?:checking|looking|using)",
    ]
    alternatives_found = any(re.search(pat, output, re.IGNORECASE) for pat in alt_patterns)

    # Detect comparisons
    has_comparison = len(ref_areas) > 1 or len(time_periods) > 1

    # Detect technical terms
    tech_patterns = [
        r"\b(?:GDP|GNI|PPP|HDI|WDI|CPI|FDI|ODA)\b",
        r"\b(?:gross|net)\s+(?:enrollment|enrolment)",
        r"\b(?:literacy|mortality|fertility|prevalence)\s+rate\b",
        r"\b(?:disaggregat|methodology|baseline|indicator)\b",
        r"\bper\s+capita\b",
    ]
    has_technical_terms = any(re.search(pat, output, re.IGNORECASE) for pat in tech_patterns)

    has_tool_data = _turn_has_tool_data(output)

    # Fix #1: claim_data -- true only when response contains <claim> tags
    has_claim_data = len(claims) > 0

    # Fix #2: presented_data -- true when response presents numeric data
    # (claim tags OR raw numbers in markdown tables)
    has_presented_data = has_claim_data or bool(re.search(r"\|\s*[\d,.]+\s*\|", output))

    # Fix #3: deliverable detection -- skip structural metrics when user
    # explicitly requests a specific output format
    deliverable_patterns = [
        r"draft\s+(?:me\s+)?(?:a|the)",
        r"write\s+(?:me\s+)?(?:a|the)",
        r"(?:create|compose|prepare)\s+(?:a|the)",
        r"give\s+me\s+(?:a|the)\s+(?:paragraph|summary|section|report|brief)",
    ]
    is_deliverable_request = any(
        re.search(pat, user, re.IGNORECASE) for pat in deliverable_patterns
    )

    # Extract sources cited
    sources_match = re.findall(r"\*\*([^*]+)\*\*\s*[\u2014\u2013-]\s*(.+?)(?:\n|$)", output)
    sources_cited = [f"{s[0]} \u2014 {s[1].strip()}" for s in sources_match]

    # Brief response preview
    clean = re.sub(r"<details.*?</details>", "", output, flags=re.DOTALL)
    clean = clean.strip()[:200]

    # -- Structured tool call data ------------------------------------
    # Normalize tool_calls from both pipeline mode ({tool, arguments, result})
    # and HTTP mode ({name, args, output}) into a consistent format.
    structured_tool_calls = []
    if tool_calls:
        for tc in tool_calls:
            structured_tool_calls.append(
                {
                    "tool": tc.get("tool") or tc.get("name", "unknown"),
                    "arguments": tc.get("arguments") or tc.get("args", {}),
                    "result": tc.get("result") or tc.get("output"),
                }
            )

    tool_sequence = [tc["tool"] for tc in structured_tool_calls]
    has_tool_calls = len(structured_tool_calls) > 0

    # -- Viz URL verification -----------------------------------------
    # Only runs when the user asked for a chart/visualization.
    # Programmatically checks whether get_viz_spec was called and
    # its result URL appears in the response.
    viz_request_patterns = [
        r"\b(?:chart|graph|plot|visualiz|diagram)\b",
        r"\bshow\s+(?:me\s+)?(?:a\s+)?(?:trend|comparison|bar|line|area)\b",
        r"\b(?:can you|could you)\s+(?:create|generate|make|draw)\b",
    ]
    is_viz_request = any(re.search(pat, user, re.IGNORECASE) for pat in viz_request_patterns)

    viz_url_from_tool = None
    viz_url_in_response = False
    viz_spec_called = False

    if is_viz_request:
        for tc in structured_tool_calls:
            if "viz_spec" in tc["tool"]:
                viz_spec_called = True
                result = tc.get("result")
                if isinstance(result, dict) and result.get("url"):
                    viz_url_from_tool = result["url"]
                elif isinstance(result, str):
                    # Result might be a JSON string
                    try:
                        parsed = json.loads(result)
                        if isinstance(parsed, dict) and parsed.get("url"):
                            viz_url_from_tool = parsed["url"]
                    except (json.JSONDecodeError, TypeError):
                        pass

        if viz_url_from_tool:
            viz_url_in_response = viz_url_from_tool in output

    return {
        "turn_idx": turn_idx,
        "user_input": user[:200],
        "tools_called": tools_called,
        "indicators": indicators,
        "databases": databases,
        "ref_areas": ref_areas,
        "time_periods": time_periods,
        "claims": claims,
        "has_tool_data": has_tool_data,
        "has_claim_data": has_claim_data,
        "has_presented_data": has_presented_data,
        "is_deliverable_request": is_deliverable_request,
        "has_data_gap": has_data_gap,
        "has_comparison": has_comparison,
        "has_technical_terms": has_technical_terms,
        "data_gaps": data_gaps,
        "alternatives_suggested": alternatives_found,
        "sources_cited": sources_cited,
        "response_preview": clean,
        # -- Tool-use evaluation fields --
        "structured_tool_calls": structured_tool_calls,
        "tool_sequence": tool_sequence,
        "has_tool_calls": has_tool_calls,
        "routing_intent": routing_intent,
        # -- Viz URL verification --
        "is_viz_request": is_viz_request,
        "viz_spec_called": viz_spec_called,
        "viz_url_from_tool": viz_url_from_tool,
        "viz_url_in_response": viz_url_in_response,
    }


def _serialize_condensed_context(ctx: dict) -> str:
    """Serialize a structured context dict into a string for LLM judge."""
    parts = [f"[Turn {ctx['turn_idx'] + 1}]"]
    parts.append(f"User: {ctx['user_input']}")

    if ctx.get("routing_intent"):
        parts.append(f"Routing: {ctx['routing_intent']}")
    if ctx["tools_called"]:
        parts.append(f"Tools: {', '.join(ctx['tools_called'])}")

    # Structured tool call data (when available from TurnData)
    if ctx.get("tool_sequence"):
        parts.append(f"Tool Sequence: {' -> '.join(ctx['tool_sequence'])}")
    if ctx.get("structured_tool_calls"):
        for i, tc in enumerate(ctx["structured_tool_calls"], 1):
            # Summarize arguments (truncate long values)
            args_parts = []
            for k, v in (tc.get("arguments") or {}).items():
                val = json.dumps(v) if not isinstance(v, str) else v
                if len(val) > 80:
                    val = val[:77] + "..."
                args_parts.append(f"{k}={val}")
            args_str = ", ".join(args_parts) if args_parts else "(no args)"
            parts.append(f"Tool Call {i}: {tc['tool']}({args_str})")

    if ctx["indicators"]:
        parts.append(f"Indicators: {', '.join(ctx['indicators'])}")
    if ctx["databases"]:
        parts.append(f"Databases: {', '.join(ctx['databases'])}")
    if ctx["ref_areas"]:
        parts.append(f"REF_AREA: {', '.join(ctx['ref_areas'])}")
    if ctx["time_periods"]:
        parts.append(f"TIME_PERIOD: {', '.join(ctx['time_periods'])}")
    if ctx["claims"]:
        claim_strs = [f"{cid}={cval}" for cid, cval in ctx["claims"].items()]
        parts.append(f"Claims: {', '.join(claim_strs)}")
    if ctx["has_data_gap"]:
        parts.append("Data Gaps: YES")
    if ctx["has_comparison"]:
        parts.append("Comparison: YES (multiple ref_areas or time_periods)")
    if ctx["sources_cited"]:
        parts.append(f"Sources: {'; '.join(ctx['sources_cited'])}")
    if ctx["response_preview"]:
        parts.append(f"Response: {ctx['response_preview']}")

    # Viz URL verification signals (programmatic, not LLM-judged)
    if ctx.get("is_viz_request"):
        parts.append("Viz Request: YES (user asked for chart/visualization)")
        if ctx.get("viz_spec_called"):
            parts.append("get_viz_spec Called: YES")
            if ctx.get("viz_url_from_tool"):
                parts.append(f"Viz URL From Tool: {ctx['viz_url_from_tool']}")
                status = "VERIFIED" if ctx.get("viz_url_in_response") else "MISSING FROM RESPONSE"
                parts.append(f"Viz URL In Response: {status}")
            else:
                parts.append("Viz URL From Tool: NONE (tool returned no URL)")
        else:
            parts.append("get_viz_spec Called: NO (tool was NOT called)")

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Metric pre-filtering
# ---------------------------------------------------------------------------


def _select_metrics_for_turn(ctx: dict, all_metric_defs: list) -> set:
    """Select applicable metrics for a turn based on structured context flags.

    Args:
        ctx: Structured context dict from _build_condensed_context.
        all_metric_defs: List of per-turn metric definitions from config.

    Returns:
        Set of metric names that should be evaluated for this turn.
    """
    requires_map = {
        "tool_data": "has_tool_data",
        "tool_calls": "has_tool_calls",
        "data_gap": "has_data_gap",
        "comparison": "has_comparison",
        "technical_terms": "has_technical_terms",
        "prior_context": None,
        "routing": None,  # always applicable
    }

    applicable = set()
    for metric_def in all_metric_defs:
        name = metric_def["name"]
        requires = metric_def.get("requires")

        if requires is None:
            # Legacy: requires_tool_data field
            if not metric_def.get("requires_tool_data", False):
                applicable.add(name)
            elif ctx["has_tool_data"]:
                applicable.add(name)
            continue

        if requires == "prior_context":
            if ctx["turn_idx"] > 0:
                applicable.add(name)
            continue

        if requires == "routing":
            # Routing correctness applies to every turn
            applicable.add(name)
            continue

        flag_key = requires_map.get(requires)
        if flag_key and ctx.get(flag_key, False):
            applicable.add(name)

    return applicable


# ---------------------------------------------------------------------------
# Per-turn metric building
# ---------------------------------------------------------------------------


def _build_per_turn_metrics(config, only_names=None):
    """Build per-turn GEval metrics from config.

    These use standard (non-conversational) GEval on LLMTestCase objects.

    Args:
        config: Loaded eval config dict.
        only_names: Optional set of metric names to build. If None, builds all.

    Returns:
        List of GEval metric objects.
    """
    from deepeval.metrics import GEval
    from deepeval.metrics.g_eval.utils import Rubric
    from deepeval.test_case import LLMTestCaseParams

    judge_model = config.get("judge_model", "gpt-4.1-mini")
    per_turn_defs = config.get("per_turn_metrics", [])

    if not per_turn_defs:
        return []

    metrics = []
    for metric_def in per_turn_defs:
        if only_names and metric_def["name"] not in only_names:
            continue
        try:
            rubric = None
            if metric_def.get("rubric"):
                rubric = [
                    Rubric(
                        score_range=tuple(r["score_range"]),
                        expected_outcome=r["expected_outcome"],
                    )
                    for r in metric_def["rubric"]
                ]

            metric = GEval(
                name=metric_def["name"],
                criteria=metric_def["criteria"],
                evaluation_steps=metric_def.get("evaluation_steps", []),
                evaluation_params=[
                    LLMTestCaseParams.INPUT,
                    LLMTestCaseParams.ACTUAL_OUTPUT,
                    LLMTestCaseParams.CONTEXT,
                ],
                threshold=metric_def.get("threshold", 0.5),
                model=judge_model,
                rubric=rubric,
            )
            metrics.append(metric)
        except Exception as e:
            logger.error(
                "Failed to build per-turn metric '%s': %s",
                metric_def.get("name"),
                e,
            )
            raise

    logger.info("Built %d per-turn metrics from config", len(metrics))
    return metrics


# ---------------------------------------------------------------------------
# Per-turn evaluation orchestration
# ---------------------------------------------------------------------------


def _evaluate_per_turn(test_cases, persona_keys, config, turn_data_store):
    """Run per-turn GEval on each assistant turn individually.

    Optimizations applied:
    1. Intent-based pre-filtering: _select_metrics_for_turn uses structured
       context flags (has_tool_data, has_data_gap, has_comparison, etc.) to
       select only applicable metrics per turn -- inapplicable metrics get
       auto-scored 1.0 with zero judge calls.
    2. Context compression: prior context is a structured dict with only
       evaluation-relevant signals, serialized to string for the LLM judge.
    3. Aggregation: metrics with aggregates_to are rolled up into
       conversation-level scores using min or mean (configurable per metric).

    Args:
        test_cases: List of ConversationalTestCase objects.
        persona_keys: List of persona key strings.
        config: Loaded eval config dict.
        turn_data_store: Dict of thread_id -> list[TurnData] for structured data.

    Returns:
        Tuple of (per_turn_scores, aggregated_scores):
        - per_turn_scores: persona_key -> {turn_idx -> {metric_name -> {score, reason, passed}}}
        - aggregated_scores: persona_key -> {aggregated_name -> {score, threshold, passed, reason}}
    """
    from deepeval import evaluate
    from deepeval.evaluate import DisplayConfig, ErrorConfig
    from deepeval.test_case import LLMTestCase

    per_turn_defs = config.get("per_turn_metrics", [])
    if not per_turn_defs:
        return {}, {}

    all_metric_names = {d["name"] for d in per_turn_defs}

    # Build aggregation map: per_turn_name -> (aggregated_name, threshold, method)
    agg_map = {}
    for d in per_turn_defs:
        if d.get("aggregates_to"):
            agg_map[d["name"]] = (
                d["aggregates_to"],
                d.get("threshold", 0.5),
                d.get("aggregation", "min"),
            )

    all_per_turn = {}
    all_aggregated = {}

    for tc, key in zip(test_cases, persona_keys):
        logger.info("  [%s] Running per-turn evaluation...", key)
        per_turn_scores = {}
        condensed_context_dicts = []  # list of structured dicts

        # Resolve stored TurnData for this test case to get structured
        # tool_calls and routing_intent.
        stored_assistant_turns = []
        for thread_id, turns_list in turn_data_store.items():
            if tc.turns and turns_list:
                first_user = next((t for t in tc.turns if t.role == "user"), None)
                first_stored = next((t for t in turns_list if t.role == "user"), None)
                if first_user and first_stored and first_user.content == first_stored.content:
                    stored_assistant_turns = [t for t in turns_list if t.role == "assistant"]
                    break

        turn_pairs = []  # (user_content, assistant_content, TurnData|None) triples
        current_user = None
        assistant_idx = 0

        for turn in tc.turns:
            if turn.role == "user":
                current_user = turn.content
            else:
                td = (
                    stored_assistant_turns[assistant_idx]
                    if assistant_idx < len(stored_assistant_turns)
                    else None
                )
                turn_pairs.append((current_user, turn.content, td))
                assistant_idx += 1

        skipped_count = 0
        judged_count = 0

        for turn_idx, (user_input, assistant_output, turn_data) in enumerate(turn_pairs):
            per_turn_scores[turn_idx] = {}

            # Build structured context for this turn, including tool_calls
            # and routing_intent from stored TurnData when available.
            ctx = _build_condensed_context(
                user_input,
                assistant_output,
                turn_idx,
                tool_calls=turn_data.tool_calls if turn_data else None,
                routing_intent=turn_data.routing_intent if turn_data else "",
            )

            # Determine which metrics apply to this turn
            metrics_to_run = _select_metrics_for_turn(ctx, per_turn_defs)

            # Auto-score all non-applicable metrics as 1.0
            skipped_names = all_metric_names - metrics_to_run
            for name in skipped_names:
                per_turn_scores[turn_idx][name] = {
                    "score": 1.0,
                    "reason": "N/A -- pre-filtered (metric not applicable to this turn).",
                    "passed": True,
                }
            skipped_count += len(skipped_names)

            if not metrics_to_run:
                condensed_context_dicts.append(ctx)
                continue

            # Build serialized context strings for LLM judge
            context_strings = [_serialize_condensed_context(c) for c in condensed_context_dicts]

            llm_tc = LLMTestCase(
                input=user_input or "",
                actual_output=assistant_output or "",
                context=context_strings,
            )

            try:
                fresh_metrics = _build_per_turn_metrics(config, only_names=metrics_to_run)
                judged_count += len(fresh_metrics)

                results = evaluate(
                    test_cases=[llm_tc],
                    metrics=fresh_metrics,
                    display_config=DisplayConfig(print_results=False, verbose_mode=False),
                    error_config=ErrorConfig(skip_on_missing_params=True, ignore_errors=True),
                )

                if results and results.test_results:
                    for md in results.test_results[0].metrics_data:
                        # Strip DeepEval's [GEval] / [Conversational GEval] suffix
                        clean_name = re.sub(r"\s*\[(?:Conversational )?GEval\]$", "", md.name)
                        per_turn_scores[turn_idx][clean_name] = {
                            "score": md.score if md.score is not None else 0.0,
                            "reason": md.reason if hasattr(md, "reason") else "",
                            "passed": (
                                md.success if hasattr(md, "success") else (md.score or 0) >= 0.5
                            ),
                            "prefiltered": False,
                        }
            except Exception as e:
                logger.error(
                    "Per-turn eval failed for %s turn %d: %s",
                    key,
                    turn_idx,
                    e,
                )
                for name in metrics_to_run:
                    per_turn_scores[turn_idx][name] = {
                        "score": 0.0,
                        "reason": f"Evaluation error: {e}",
                        "passed": False,
                    }

            # Add structured context for next iteration
            condensed_context_dicts.append(ctx)

        # -- Aggregate per-turn scores to conversation-level --
        aggregated = {}
        for pt_name, (conv_name, threshold, agg_method) in agg_map.items():
            turn_scores = []
            turn_reasons = []
            for tidx, scores in per_turn_scores.items():
                if pt_name in scores:
                    s = scores[pt_name]
                    # Skip pre-filtered scores -- they are N/A, not real 1.0
                    if s.get("prefiltered", False):
                        continue
                    turn_scores.append(s["score"])
                    if s["score"] < 1.0:
                        turn_reasons.append(f"Turn {tidx + 1}: {s['reason']}")
            if turn_scores:
                if agg_method == "mean":
                    agg_score = sum(turn_scores) / len(turn_scores)
                else:  # default to min
                    agg_score = min(turn_scores)
                aggregated[conv_name] = {
                    "score": agg_score,
                    "threshold": threshold,
                    "passed": agg_score >= threshold,
                    "reason": (
                        f"Aggregated from {len(turn_scores)} turns ({agg_method}={agg_score:.2f}). "
                        + (" | ".join(turn_reasons) if turn_reasons else "All turns passed.")
                    ),
                    "evaluation_model": config.get("judge_model", "gpt-4.1-mini"),
                }

        all_per_turn[key] = per_turn_scores
        all_aggregated[key] = aggregated

        # Log summary
        logger.info(
            "  [%s] Per-turn eval: %d judge calls, %d pre-filtered (saved)",
            key,
            judged_count,
            skipped_count,
        )
        for tidx, scores in per_turn_scores.items():
            for mname, mdata in scores.items():
                status = "PASS" if mdata["passed"] else "FAIL"
                logger.info(
                    "    Turn %d | %s: %.2f [%s]",
                    tidx + 1,
                    mname,
                    mdata["score"],
                    status,
                )
        # Log aggregated
        if aggregated:
            logger.info("  [%s] Aggregated conversation-level scores:", key)
            for aname, adata in aggregated.items():
                status = "PASS" if adata["passed"] else "FAIL"
                logger.info(
                    "    %s: %.2f [%s]",
                    aname,
                    adata["score"],
                    status,
                )

    return all_per_turn, all_aggregated
