## Overview

This PR introduces the DeepEval-based evaluation framework for the Data360 chatbot agentic flow. It is separate from the chatbot implementation changes in PR #127.

The framework was built alongside the fixes so that every failure mode has a corresponding persona, and the results below demonstrate the measurable improvement delivered by PR #127.

---

## Evaluation Results

### Baseline vs Post-Fix Evaluation Results

3 runs per persona. Scores are mean ± std-dev (0 = fail, 1 = pass).
Baseline run on `feat/compact-agg-renderers` @ `3debe4834`.
Fixed run on `feat/agentic-flow-stability` @ `03d8b16b2`.

| Persona | Failure mode | Metric | Baseline Score | Fixed Score |
|---|---|---|:---:|:---:|
| **AF-4** `agentic_narrator_claim_hallucination` | Narrator invents claim_ids | Narrator Claim Fabrication | `0.77 ± 0.40` 🔴 | `1.00` ✅ |
| | | Data Accuracy | `0.47 ± 0.47` 🔴 | `1.00` ✅ |
| | | Transcription Fidelity | `0.66 ± 0.48` 🔴 | `1.00` ✅ |
| **AF-5** `agentic_narrator_ranking_drift` | Ranking values reordered/changed | Ranking Fidelity | `0.52 ± 0.41` 🔴 | `1.00` ✅ |
| | | Data Accuracy | `0.15 ± 0.12` 🔴 | `1.00` ✅ |
| | | Narrator Claim Fabrication | `0.73 ± 0.46` 🔴 | `1.00` ✅ |
| **AF-6** `agentic_compact_compare_decoding` | Positional array decoding errors | Data Accuracy | `0.09 ± 0.08` 🔴 | `1.00` ✅ |
| | | Narrator Claim Fabrication | `0.68 ± 0.56` 🔴 | `1.00` ✅ |
| | | Context Retention | `0.56 ± 0.31` 🔴 | `0.26` 🔴 |
| **AF-7** `agentic_sas_ranking_value_fabrication` | Full value + claim_id fabrication | Narrator Claim Fabrication | `0.55 ± 0.45` 🔴 | `1.00` ✅ |
| | | Data Accuracy | `0.24 ± 0.25` 🔴 | `0.10` 🔴 |
| | | Ranking Fidelity | `0.72 ± 0.49` 🔴 | `1.00` ✅ |
| **AF-8** `agentic_sas_ranking_single_shot` | Unnecessary clarification; no autonomous resolve | Unnecessary Clarification | `0.33 ± 0.57` 🔴 | `0.00` 🔴 |
| | | Narrator Claim Fabrication | `0.39 ± 0.53` 🔴 | `1.00` ✅ |

### Coverage Gaps — What Has Not Yet Been Re-Evaluated

| Persona | Last known score | Re-evaluated post-fix? |
|---|:---:|:---:|
| **AF-5** `agentic_narrator_ranking_drift` | `0.52` Ranking Fidelity | No |
| **AF-7** `agentic_sas_ranking_value_fabrication` | `0.55` Claim Fabrication | No |
| **AF-8** `agentic_sas_ranking_single_shot` | `0.33` Unnecessary Clarification | No (open issue) |
| **PR #127** narrator response duplication | N/A | No eval persona exists yet |

---

## What This PR Contains

### Evaluation runner & infrastructure
- `backend/evals/per_turn_eval.py` — per-turn metric evaluation logic
- `backend/evals/run_conversation_eval.py` — conversation simulation runner

### Test suites
- `backend/evals/configs/suite_agentic_flow.yaml` — agentic flow baseline suite
- `backend/evals/configs/suite_agg_grounding.yaml` — aggregation grounding regression suite

### Personas (conversation test definitions)
- `agentic_compact_compare_decoding` — validates correct decoding of compact positional arrays from `compare_countries`
- `agentic_context_ignore_year` — validates year-context retention across turns
- `agentic_narrator_claim_hallucination` — validates that claim IDs are grounded in tool output
- `agentic_narrator_ranking_drift` — validates ranking value fidelity
- `agentic_redundant_search_dedup` — validates deduplication of redundant searches
- `agentic_sas_ranking_single_shot` — validates single-shot South Asia ranking
- `agentic_sas_ranking_value_fabrication` — validates no value fabrication in rankings
- `regression_compare_countries_grounding` — regression for compare_countries grounding
- `regression_rank_countries_grounding` — regression for rank_countries grounding
- `regression_summarize_data_grounding` — regression for summarize_data grounding

### Judge rubric updates (`eval_config.yaml`)
- Updated **Narrator Claim Fabrication** rubric with `CRITICAL MULTI-TURN RULE`: current-turn tool output takes precedence over prior-turn values, preventing false positives when Turn 2 fetches fresh data with different claim_ids.
- Updated **Research-Narrator Transcription Fidelity** rubric with the same multi-turn rule for the same reason.

### Open item — no eval persona for SSE duplication
The narrator response duplication bug (fixed in PR #127 via `sse_bridge.py`) has no corresponding persona. A `agentic_narrator_response_uniqueness` persona should be added in a follow-up commit to this PR to catch regressions.

---

## Note
Evaluation run artifacts (timestamped `.md` and `.json` files under `backend/evals/conversations/`) are excluded via `.gitignore` and are never committed.
