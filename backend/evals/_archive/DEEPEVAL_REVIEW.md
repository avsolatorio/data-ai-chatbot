# DeepEval Implementation Review

**Date:** 2026-02-27  
**Scope:** Full review of `backend/evals/` — architecture, metric design, test coverage, and production readiness.

---

## Overall Assessment

> **Verdict: Solid foundation, genuinely above-average for a custom eval suite.**

This is not a toy eval setup. The persona-based conversation simulation + prompt-accurate metrics + context-aware applicability guards is a well-thought-out architecture. Most teams stop at "run 5 prompts and eyeball the output." You've built something with real signal.

That said, there are structural issues that will bite as this scales.

---

## What's Working Well

### 1. Architecture is Sound
- **Three-layer evaluation**: Unit tests (`test_mcp_evals.py`) → Scorecard (`run_scorecard.py`) → Conversation simulation (`run_conversation_eval.py`). This covers isolated metric testing, single-turn fidelity, and multi-turn behavioral evaluation. Good layering.

### 2. Persona Design is Strong
- 11 personas with clear behavioral archetypes spanning standard (student, economist), high-value (journalist, policy advisor, data engineer), and edge-case (adversarial, multilingual, comparison_max) categories.
- Each persona has well-defined `scenario`, `user_description`, and `expected_outcome` with 5+ sub-goals. The sub-goals prevent early simulator stopping — this is a subtle but important design choice.

### 3. Context-Aware Applicability Guards
- Every `ConversationalGEval` metric includes an `APPLICABILITY:` section that tells the judge *when to skip* (e.g., "if no data was retrieved, score 1.0"). This prevents false negatives on greeting/refusal turns and is the single most important design decision in the entire suite.

### 4. Edge-Case Metrics are Targeted
- `_build_edge_case_metrics()` adds persona-specific metrics only where they're relevant (Scope Guard for adversarial, Country Resolution for multilingual, etc.). This avoids the "every metric on every persona" anti-pattern.

### 5. Pipeline Runner is Faithful
- `pipeline_runner.py` mirrors the real chatbot pipeline (routing → tool calling loop → `^ANSWER^` split). Evaluations test the *actual* system prompt and tool calling behavior, not a simplified proxy.

### 6. JSON Persistence
- Results are timestamped and saved as JSON, enabling historical comparison. The `dump_conversations.py` script for generating per-persona markdown reports is a nice operational tool.

---

## Honest Criticisms & What Should Be Better

### 🔴 Critical Issues

#### 1. The 1045-Line God File
`run_conversation_eval.py` contains **everything**: 11 persona definitions, 13 base metrics, edge-case metric builder, conversation callback, CLI parsing, simulation runner, evaluation loop, and result persistence.

**Impact:** Extremely hard to maintain. Adding a persona, changing a metric criteria, or modifying the evaluation loop means editing one massive file. Merge conflicts are guaranteed.

**Fix:** Split into:
```
evals/
  personas/           # One YAML per persona
    student.yaml
    adversarial.yaml
    ...
  metrics/
    base.py           # 13 base ConversationalGEval definitions
    edge_cases.py     # Edge-case metric builder
  conversation_eval/
    callback.py       # model_callback function
    runner.py         # main(), parse_args(), simulation loop
    reporter.py       # Result printing and JSON saving
```

#### 2. No Determinism Controls
The entire eval suite runs through a live LLM (gpt-5.1) and a live MCP server. There is:
- **No seed/temperature pinning** for the chatbot model (temperature=0.7 in `pipeline_runner.py`)
- **No seed for the simulator model** (gpt-4.1-mini)
- **No caching of conversation simulations** — re-running produces different conversations every time

**Impact:** Results are non-reproducible. The economist persona failing 4 metrics might be a genuine issue OR a bad roll of the dice. You can't distinguish flaky from broken.

**Fix:**
- Set `temperature=0` (or at least 0.1) for eval runs
- Add a `--seed` flag to pin randomness where the API supports it
- Cache conversations: if `conversations_<timestamp>.json` exists, allow `--replay <timestamp>` to skip simulation and just re-run evaluation on saved conversations

#### 3. No Statistical Significance
You run each persona **once**. A single run with 5 turns tells you almost nothing about consistency.

**Impact:** A score of 0.48 on Guided Discovery could be 0.85 next time. You don't know if failures are systematic or stochastic.

**Fix:**
- Add a `--runs N` flag to run each persona N times (e.g., 3-5)
- Report **mean ± std** for each metric
- Flag metrics as "flaky" if std > 0.15
- The economist persona's 4 failures *screams* for this — is it always failing or just unlucky?

---

### 🟡 Moderate Issues

#### 4. Metrics Criteria Are Opaque to the Judge
Each `ConversationalGEval` metric has a long criteria string (100-300 words). The judge LLM (gpt-4.1-mini) must interpret this correctly to score. But:
- There are **no evaluation_steps** specified — DeepEval supports breaking criteria into explicit steps that improve judge accuracy
- Criteria reference specific line numbers (e.g., "Planner L159-164, Writer L249-255") which the judge model has no access to
- Some criteria have 8+ numbered rules. The judge may miss some.

**Fix:**
- Add `evaluation_steps` to each ConversationalGEval to guide the judge through structured reasoning
- Remove line number references from criteria (keep them as code comments only)
- Consider splitting compound metrics: "Tool Call Appropriateness" has 8 rules — could be 2-3 focused metrics

#### 5. No Ground Truth Validation
The metrics are judge-based (LLM-as-judge). There's no way to know if the judge's scores are *correct*.

**Impact:** If gpt-4.1-mini consistently misjudges a particular pattern (e.g., it can't reliably detect whether `<claim>` tags are present), all scores for that metric are unreliable.

**Fix:**
- Create a "calibration set" of 10-15 hand-scored conversation snippets with known scores
- Run the judge against this set periodically to measure judge accuracy
- Track inter-rater reliability: have a second judge model (e.g., gpt-4.1) score the same conversations and compare

#### 6. The Threshold Problem
Every metric uses `threshold=0.5`. This is the same for critical (Data Accuracy, No Fabrication) and soft (Follow-up Suggestions, Content Structure) metrics.

**Impact:** A chatbot that fabricates data but gets a 0.51 score passes the Data Accuracy metric. Meanwhile, a chatbot that forgets one "Note:" label fails Content Structure at 0.49.

**Fix:**
- Define metric tiers:
  - **Critical** (Data Accuracy, Claim Tagging, No Fabrication): threshold=0.8
  - **Important** (Tool Call, Source Citation): threshold=0.6
  - **Nice-to-have** (Follow-up Suggestions, Content Structure): threshold=0.4

#### 7. Conversation History Not Passed to Judge
The `model_callback` maintains conversation history for the chatbot, but the `ConversationalGEval` metrics only see the `turns` list (user/assistant messages). **Tool call details are lost** — the judge can't see what tools were called or what data was returned.

**Impact:** Metrics like "Tool Argument Quality" and "Data Accuracy" (which should verify outputs against tool results) are judging *only* from the assistant's text, not the actual tool interaction. The judge is guessing whether claim_ids are correct.

**Fix:**
- Include tool call summaries in the conversation turns (e.g., append `[Tool: get_data(KEN, WB_WDI_...) → {data: [...]}]` to assistant turns)
- Or use DeepEval's `additional_metadata` field to pass tool call logs alongside the conversation

#### 8. Missing `RoleAdherence` in Reporting
`_build_conversational_metrics()` returns `RoleAdherenceMetric` as a built-in metric, but it never appears in the EVALUATION_REPORT.md or conversation dumps. It's evaluated but silently ignored in reporting.

**Fix:** Either include it in reports or remove it. Dead metrics create confusion.

---

### 🟢 Minor / Nice-to-Have

#### 9. No CI/CD Integration
The eval suite is run manually. There's no GitHub Actions workflow, no regression gate, no alerting.

**Fix:**
- Add a `.github/workflows/evals.yml` that runs scorecard + 2-3 key personas on PR
- Block merges if any critical metric regresses > 0.1 from baseline
- Store baseline scores in a `.evals_baseline.json` file

#### 10. Test Cases Are Sparse
The `test_cases/` directory has ~6 YAML files with small sets. The scorecard (`run_scorecard.py`) has only 3 hardcoded cases. This is a thin coverage net for a production chatbot.

**Fix:**
- Expand to 20-30 scorecard cases covering more edge cases
- Add "golden response" test cases where you know the exact expected output
- Generate synthetic test cases from conversation logs

#### 11. The Mock Executor is Unused
`harness.py` has a fully built `MockMCPExecutor` with fixture support, but the conversation eval runs against the **live** MCP server. The mock is only used in `test_mcp_evals.py` unit tests.

**Impact:** This means you can't run conversation evals without a live MCP server running, making it impossible to run in CI.

**Fix:**
- Add a `--mock` flag to `run_conversation_eval.py` that uses recorded tool responses
- Build a "conversation replay" mode that loads cached conversations and only re-runs the judge

#### 12. `dump_conversations.py` — Persona Context is Hardcoded
The `PERSONA_CONTEXT` dict in `dump_conversations.py` duplicates information from `PERSONAS` in `run_conversation_eval.py`. If a persona is renamed or added, the dump script silently falls behind.

**Fix:** Import persona definitions from a shared source or extract them from the results JSON.

---

## Prioritized Improvement Roadmap

| Priority | Item | Effort | Impact |
|---|---|---|---|
| 🔴 P0 | Split the god file into modules | 2 hours | Maintainability |
| 🔴 P0 | Add `--runs N` for statistical significance | 1 hour | Trustworthy scores |
| 🔴 P0 | Pin temperature=0 for eval runs | 5 min | Reproducibility |
| 🟡 P1 | Add `evaluation_steps` to GEval metrics | 1 hour | Judge accuracy |
| 🟡 P1 | Tiered thresholds (critical vs soft metrics) | 30 min | Meaningful pass/fail |
| 🟡 P1 | Include tool call logs in judge context | 1 hour | Metric correctness |
| 🟡 P1 | Conversation replay mode (`--replay`) | 1 hour | Reproducibility |
| 🟢 P2 | Calibration set for judge validation | 2 hours | Trust in scores |
| 🟢 P2 | CI/CD integration | 2 hours | Automation |
| 🟢 P2 | Expand scorecard test cases to 20+ | 1 hour | Coverage |

---

## Summary

**What you've built is genuinely good** — the persona design, context-aware guards, edge-case targeting, and prompt-faithful criteria are all above what I've seen in most eval implementations. The core architecture is sound.

The biggest gaps are around **reproducibility** (non-deterministic runs), **statistical confidence** (single runs per persona), and **maintainability** (monolithic file). These are all fixable without rethinking the design — they're engineering improvements on a solid foundation.

The most impactful single change would be adding **`--runs N` with mean±std reporting**. Until you can distinguish "flaky" from "broken," the economist persona's failures are noise, not signal.
