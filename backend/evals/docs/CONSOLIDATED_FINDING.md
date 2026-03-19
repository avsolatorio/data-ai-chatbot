# Consolidated Evaluation Findings

**Date:** 2026-03-19
**Total conversation files:** 132
**Unique personas:** 61
**Prompt version:** `feat/setup-evals@21e246bdc`
**Judge model:** `gpt-4.1-mini`
**Mode:** HTTP E2E (all runs)
**Eval batches covered:**
- 20260312 — Early flat persona runs (10 personas)
- 20260313 — Full 40-persona evaluation (10 flat + 30 composed)
- 20260314 — Targeted re-runs for rubric fixes
- 20260315 — Overnight regression (16 personas, 42 runs)
- 20260316 — Re-runs for 2 infra-errored personas

---

## Executive Summary

The chatbot passes **92 of 132 runs with zero failures** (69.7%). When a run does fail,
the failure is almost always isolated to a single metric — 40 runs have at least one
metric below threshold, but only 2 runs have catastrophic multi-metric failures (both
are F3 empty-writer events).

**Source Citation is the dominant weakness**, accounting for 28 of the total 72 metric
failures (39%). No other metric exceeds 8 failures. Three metrics — Claim Tagging & PCN,
Comparability Warnings, and Data Gap Handling — have a 100% pass rate across all 132 runs.

---

## Per-Metric Pass Rates (All 132 Runs)

| Metric | Pass | Fail | Pass Rate | Mean Score |
|---|---|---|---|---|
| Claim Tagging & PCN | 132 | 0 | **100.0%** | 1.00 |
| Comparability Warnings | 132 | 0 | **100.0%** | 0.99 |
| Data Gap Handling | 132 | 0 | **100.0%** | 1.00 |
| Content Structure | 131 | 1 | 99.2% | 0.94 |
| Context Retention | 131 | 1 | 99.2% | 0.93 |
| Data Accuracy | 131 | 1 | 99.2% | 0.96 |
| Inline Explanations | 131 | 1 | 99.2% | 0.92 |
| Progressive Disclosure | 131 | 1 | 99.2% | 0.93 |
| Tool Selection | 131 | 1 | 99.2% | 0.96 |
| Conversation Completeness | 81 | 1 | 98.8% | 0.96 |
| Tool Sequencing | 129 | 3 | 97.7% | 0.94 |
| Argument Quality | 127 | 5 | 96.2% | 0.90 |
| Data Formatting | 127 | 5 | 96.2% | 0.88 |
| Latest Data Note | 127 | 5 | 96.2% | 0.95 |
| Routing Correctness | 127 | 5 | 96.2% | 0.94 |
| Visualization & API URLs | 125 | 7 | 94.7% | 0.94 |
| Follow-up Suggestions | 124 | 8 | 93.9% | 0.89 |
| **Source Citation** | **104** | **28** | **78.8%** | **0.76** |

> [!IMPORTANT]
> Source Citation has the lowest pass rate by a wide margin (78.8% vs. next-lowest 93.9%).
> This is the single metric requiring immediate attention.

---

## Failure Taxonomy

### F1 — Missing `Sources:` Section (28 failures, HIGH)

**What happens:** The chatbot omits the `Sources:` heading block. The judge identifies the
absence and scores 0.00–0.18. This is a chatbot behavior issue, not a judge error — the
`Sources:` section is literally absent from the response.

**When it happens:** Two specific turn types trigger the omission:

| Turn Type | Example | Score Range |
|---|---|---|
| Concept/overview (Turn 1) | "Here is a framework for food security..." | 0.01–0.18 |
| Gap-explanation | "Subnational data for Chittagong is unavailable..." | 0.00 |

In both cases, MCP tools were called but the writer treats "no numeric data presented"
as "no citation needed."

**Root cause:** The writer prompt in `app/ai/prompts.py` line 243 says: *"ALWAYS cite data 
sources from the research packet."* The phrase "from the research packet" causes the model
to skip `Sources:` on turns where tool results are used for framing/explanation rather
than data presentation.

**Affected personas (confirmed across multiple runs):**
- `student:climate_vulnerability` — 5 failures across 7 runs
- `student:food_security:explore` — 5 failures across 6 runs
- `student:education_access:disambiguation` — 4 failures across 6 runs
- `student_learning_and_exploration` — 2 failures across 6 runs
- `general_public:gender_equity:drill_down` — 2 failures (F3-related)
- `adversarial_user_data_scope` — 1 failure (older run; newer runs pre-filter correctly)
- `decision_maker:poverty_inequality:compare` — 1 failure across 6 runs
- Various others — 8 scattered failures

> [!NOTE]
> **Open product question:** Should concept/overview turns (where no numeric values are
> claimed) require `Sources:`? The current rubric says yes. If the team decides concept
> turns are exempt, the fix belongs in the eval pre-filter, not the writer prompt.
>
> - **If citation is required on all tool-call turns:** Fix `app/ai/prompts.py` line 243
> - **If concept/gap turns are exempt:** Add a pre-filter in `eval_config.yaml`

---

### F2 — Visualization Not Generated (7 failures, MEDIUM)

**What happens:** The user explicitly asks for a chart. The chatbot either does not call
`get_viz_spec` at all, or calls it but does not surface the URL. Judge scores 0.00–0.47.

**Status after regression:** F2 did **not appear** in the overnight regression (0 of 42
runs). It appeared 4 times in the 20260313 batch and 3 times in food_security re-runs.
This failure appears to be **intermittent and less frequent** in newer runs.

**Affected personas:**
- `student:food_security:explore` — 3 failures (intermittent across runs)
- `general_public:gender_equity:drill_down` — 1 failure (20260313 batch)
- `country_analyst:economic_growth:visualize` — 1 failure (20260313 batch)
- `student_learning_and_exploration` — 1 failure (early run)

---

### F3 — Empty Writer / Zero Output (2 failures, CRITICAL)

**What happens:** The writer stage produces no output at all. All metrics including
Routing, Tool Sequencing, Argument Quality, and Source Citation score 0.00. One blank
response causes 4+ metric failures simultaneously.

**Status after regression:** F3 did **not appear** in the overnight regression (0 of 42
runs). It appeared twice across all 132 runs:
1. `decision_maker:food_security:adversarial_fabrication` (20260313 r3) — all 0.00
2. `general_public:gender_equity:drill_down` (20260315_000559) — all 0.00

Both are intermittent — other runs of the same persona pass cleanly.

---

### F4 — Spurious Failures on Disambiguation Turns (5 failures, LOW)

**What happens:** A disambiguation turn (clarifying country codes, no numeric data) is
evaluated by metrics designed for data responses. Data Formatting and Latest Data Note
score 0.16–0.29 because the turn legitimately has no numbers or year references(the chatbot behavior is correct).

**Status after regression:** Still appears consistently in
`country_analyst:debt_fiscal:adversarial_disambiguation` — 5 of 7 runs fail Data
Formatting or Latest Data Note on the disambiguation turn.

**Root cause:** Pre-filter gap. The `requires: "tool_data"` condition does not distinguish
between `find_codelist_value` (disambiguation, no data) and `get_data` (actual data
retrieval).

---

### F5 — Follow-up Suggestions Missing (8 failures, LOW)

**What happens:** The chatbot omits the `Suggested follow-ups:` section or provides
inadequate follow-ups. Judge scores 0.00–0.19.

**Pattern:** Similar to F1 — the writer drops optional sections on certain turn types.
Most failures are on turns where the chatbot is explaining data limitations or providing
a short scope-guard response.

**Affected personas:**
- `general_public:gender_equity:drill_down` — 3 failures (2 F3-related)
- `decision_maker:poverty_inequality:compare` — 2 failures
- `decision_maker:food_security:adversarial_fabrication` — 1 failure
- `student:debt_fiscal:drill_down` — 1 failure
- `adversarial_api_edge_cases` — 1 failure

---

## Metric Reliability Tiers

Based on the data, the 18 metrics fall into three reliability tiers:

| Tier | Metrics | Pass Rate | Assessment |
|---|---|---|---|
| **Rock-solid (100%)** | Claim Tagging, Comparability Warnings, Data Gap Handling | 100% | No action needed |
| **Reliable (96–99%)** | Content Structure, Context Retention, Data Accuracy, Inline Explanations, Progressive Disclosure, Tool Selection, Conversation Completeness, Tool Sequencing, Argument Quality, Data Formatting, Latest Data Note, Routing Correctness | 96–99% | Failures are almost all F3/F4 cascades, not chatbot issues |
| **Needs attention (<96%)** | Visualization & API URLs, Follow-up Suggestions, **Source Citation** | 79–95% | Active chatbot behavior issues |

---

## Notable Conversations

### Resilient Behavior

These conversations demonstrate the chatbot handling complex or adversarial scenarios
with high quality across all metrics.

**1. Adversarial Creative Writing Scope Guard** — 10 turns, mean 0.972, 17/17 PASS
- File: `conversations/resilient/adversarial_creative_writing_scope_guard.md`
- Persona (Priya) starts with legitimate NGO data requests then gradually steers toward
  creative writing. The chatbot correctly fulfills data needs while consistently
  redirecting creative requests back to data analysis. All metrics pass, including
  Source Citation (0.96) and Follow-up Suggestions (0.99).
- Notable: The scope guard does not break the conversational flow — the chatbot remains
  helpful and engaged while staying on-topic.

**2. Technical Expert: Trade Openness Disambiguation** — 8 turns, mean 0.991, 17/17 PASS
- File: `conversations/resilient/technical_expert/trade_openness_disambiguation_20260313_r3.md`
- Persona (Carlos) asks about ambiguous regional labels ("Southern Cone", "Central America",
  "Andean region", "Caribbean"). The chatbot provides precise ISO3 code mappings, explains
  institutional definitions (CAN, SICA, CARICOM), and offers pipeline integration advice.
  15 of 17 metrics score 1.00.
- Notable: Zero tool calls on all turns — the chatbot correctly routes these as
  metadata/definition questions, not data queries. Pre-filters engage properly, scoring
  all data-dependent metrics as N/A.

**3. Adversarial Fabrication Rejection** — 8 turns, mean 0.953, 18/18 PASS
- File: `conversations/resilient/decision_maker/food_security_fabrication_rejection_20260315.md`
- Persona attempts to get the chatbot to confirm fabricated statistics. The chatbot
  consistently cross-references against actual Data360 tool outputs and refuses to
  validate unverifiable claims.
- Notable: Conversation Completeness scores 1.00 — the judge recognizes that correctly
  refusing fabricated data counts as meeting the user's legitimate intent.

**4. Rivendell Scope Guard** — 2 turns, mean 0.972, 18/18 PASS
- File: `conversations/resilient/adversarial_rivendell_scope_guard_20260315.md`
- User asks for GDP data for the fictional place "Rivendell". The chatbot immediately
  identifies it as fictional, makes zero tool calls, and offers to help with real
  countries instead. All metrics pre-filtered correctly.
- Notable: Conversation Completeness scores exactly 0.50 — the judge classifies the gap
  handling as PARTIALLY MET (correct behavior for unavailable data), demonstrating that
  the rubric handles this edge case as designed.

### Concerning Conversations

These are the weakest runs and represent known failure patterns.

**1. Gender Equity F3 Crash** — 2 turns, 4/18 PASS, mean 0.222
- File: `conversations/concerning/general_public/gender_equity_f3_crash_20260315.md`
- The writer produced no output on Turn 1 despite 6 successful tool calls (search, get_data
  for women's empowerment, WBL index, anti-discrimination law, violence stats, gender
  development index). All judge scores are 0.00 with reasoning "None". This is the worst
  single run in the entire dataset.
- Root cause: F3 (empty writer). The agent actions log shows correct tool usage;  the
  failure is isolated to the writer emission step.

**2. Debt Fiscal F3 Cascade** — 10 turns, 13/17 PASS, mean 0.726
- File: `conversations/concerning/decision_maker/debt_fiscal_f3_cascade_20260312_r1.md`
- Turn 1 writer produced no output (F3). Turns 2–10 recovered and scored well across all
  metrics. But the min aggregation on Tool Sequencing (0.01), Argument Quality (0.00),
  Routing Correctness (0.09), and Source Citation (0.00) drags the entire run below
  threshold.
- Notable: This illustrates how a single F3 event on one turn cascades into 4 metric
  failures. The chatbot was otherwise strong (Turns 2–10 all pass individually).

**3. Health Outcomes F3 Cascade** — 10 turns, 13/17 PASS, mean 0.745
- File: `conversations/concerning/student/health_outcomes_f3_cascade_20260312_r2.md`
- Same pattern as above: Turn 1 F3 event, remaining turns pass. Context Retention dropped
  to 0.18 because the empty Turn 1 breaks the continuity expected by the judge.

---

## Recommendations

### P0 — Source Citation Writer Prompt Fix

**What:** Broaden the `Sources:` instruction in `app/ai/prompts.py` line 243 to cover all
turns where MCP tools were called, not just data-presenting turns.

**Current wording:**
```
- **ALWAYS** cite data sources from the research packet under a "**Sources:**" label
  at the end of your response.
```

**Proposed wording:**
```
- **ALWAYS** include a "**Sources:**" section at the end of your response whenever
  any MCP tool was called in this turn — even if you are explaining a concept,
  confirming a data gap, or presenting no numeric values. If a search returned
  no usable data, cite what was searched and note that it was unavailable.
```

**Expected impact:** Should resolve ~20 of the 28 Source Citation failures (the ones
caused by concept/gap turns). The remaining ~8 are either F3 cascades or edge cases
requiring additional investigation.

**Decision required:** Do we want `Sources:` on concept/gap turns? If not, the fix
moves to the eval pre-filter instead (see Open Product Questions in F1 section above).

---

### P1 — Disambiguation Pre-Filter Fix

**What:** Extend the pre-filter in `eval_config.yaml` to exclude turns where the only tool
call is `find_codelist_value` or `search_indicators` (no `get_data`) from Data Formatting
and Latest Data Note metrics.

**Current pre-filter condition:**
```yaml
requires: "tool_data"
```

**Proposed pre-filter condition:**
```yaml
requires: "get_data_output"  # Only triggers when get_data returned actual values
```

This means disambiguation turns that only call `find_codelist_value` or `search_indicators`
would be pre-filtered as N/A rather than scored against a data-presentation rubric.

**Expected impact:** Resolves all 5 F4 failures in `debt_fiscal:disambiguation`.

---

### P2 — Follow-up Suggestions Enforcement

**What:** Add `Suggested follow-ups:` to the mandatory output sections in the writer prompt
(same treatment as the `Sources:` fix). Currently it is implied but not enforced.

**Current wording** (in `app/ai/prompts.py`, PRESENTATION block — follow-ups are mentioned
but not as a mandatory section).

**Proposed addition** (after the `Sources:` instruction):
```
- **ALWAYS** end your response with a "**Suggested follow-ups:**" section containing
  2-3 user-phrased questions that invite further exploration of the topic.
  Write them from the user's perspective (e.g., "Can you compare this across countries?").
```

**Expected impact:** Should reduce the 8 Follow-up Suggestions failures. Low risk — the
writer already includes follow-ups on ~94% of turns.

---

## Summary of Previous Finding Documents

This document supersedes:

| Document | What it covered | Status |
|---|---|---|
| `OVERALL_FINDING.md` | Initial 40-persona batch (20260313), F1–F4 taxonomy | **Superseded** — findings carried forward here |
| `REGRESSION_FINDING.md` | Overnight regression (20260315) + re-runs | **Superseded** — findings carried forward here |
| `REGRESSION_REPORT_20260315_215501.md` | Machine-generated run scoreboard | Retained in `docs/` |
| 3 review files | Per-persona manual reviews | Retained in `conversations/reviews/` |
