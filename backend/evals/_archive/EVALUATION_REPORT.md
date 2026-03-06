# Data360 Chat — Evaluation Report

**Date:** 2026-02-27 | **Chatbot:** `gpt-5.1` | **Judge:** `gpt-4.1-mini` | **Framework:** DeepEval
**Turns per persona:** 5 (simulator generates ~8-10 total turn pairs) | **Total cost:** ~$2.30 | **Runtime:** ~25 min

---

## 1. Framework Architecture

```
Persona (ConversationalGolden)
        │
        ▼
ConversationSimulator (gpt-5.1 simulated user)
        │                    ▲
        ▼                    │
Pipeline Runner (Router → Planner → Writer)
        │
        ▼
MCP Server (Data360 tools)
        │
        ▼
Conversation Log
        │
        ▼
Judge (gpt-4.1-mini) — 13 base + edge-case metrics
        │
        ▼
Per-Persona Scores
```

1. **Persona** — A `ConversationalGolden` with role, description, and expected outcome
2. **Simulator** — DeepEval's `ConversationSimulator` plays the user, calling our actual pipeline (Router → Planner → Writer) via MCP tools
3. **Judge** — `gpt-4.1-mini` evaluates the conversation against **13 base metrics** + **persona-specific edge-case metrics**
4. **Threshold** — Each metric scores 0.0–1.0; pass threshold is 0.5

---

## 2. Metrics — What We Measure and Why

Every custom metric's criteria is derived from exact rules in `prompts.py`. All include **APPLICABILITY guards** — the judge scores 1.0 when a metric isn't relevant to the turn (e.g., no data retrieved → formatting rules don't apply). This eliminates false negatives for edge-case personas.

### 2.1 Built-in Metrics (3)

| Metric | What It Measures |
|---|---|
| **Conversation Completeness** | Did the chatbot address all user requests across the full conversation? |
| **Role Adherence** | Does the chatbot stay in its data-assistant role? |
| **Turn Faithfulness** | Are individual responses faithful to retrieved tool data? |

### 2.2 Custom ConversationalGEval Metrics (10 base)

| Metric | Prompt Source | Key Rules | Context-Aware? |
|---|---|---|---|
| **Context Retention** | Planner L106-118, L164 | Reuses prior data/claim_ids; doesn't re-search unnecessarily; only re-fetches for NEW params | Only when ≥2 data exchanges |
| **Claim Tagging & PCN** | Planner L159-164, Writer L249-255 | COVERAGE: all tool numbers in `<claim>` tags. CORRECTNESS: both `id` and `policy` attrs required; exact claim_ids from tool output. TRACEABILITY: values traceable to tool calls; same claim_id reused across turns | Only on turns with tool data |
| **Data Accuracy** | Planner L153-157, Writer L232-233 | No fabrication; correct REF_AREA/TIME_PERIOD cross-check; exact entity names; refusals = accurate | Only on turns with data |
| **Source Citation** | Writer L243-246 | "Sources:" section; format: **DB** — Indicator — methodology; bullets for multiple | Only on turns with tool data |
| **Follow-up Suggestions** | Writer L264-265 | "Suggested follow-ups:" with 2-3 user-phrased questions; never "Would you like me to…" | Only on data-containing responses |
| **Data Formatting** | Writer L238-241 | Units always present; markdown tables for 3+ values; no scientific notation; insight-first then details | Only on turns with data |
| **Latest Data Note** | Writer L242, Planner L166-167 | "(using latest available data)" only when user didn't specify a year; not needed if user asked for "2020" | Only when data is presented |
| **Content Structure** | Writer L236, L258-259 | "Data:", "Analysis:", "Note:", "Limitations:" labels; comparability warnings | Only on data turns |
| **Tool Call Appropriateness** | Planner L120-149 | Full 8-step workflow with REQUIRED/OPTIONAL labels; not calling tools for greetings/refusals is correct | Guards for non-tool turns |
| **Tool Argument Quality** | Planner L70-82, L127 | Valid ISO codes via find_codelist_value; batch queries; no FREQ filtering; indicator IDs from search only | Only when tools are called |

### 2.3 Edge-Case Metrics (per persona)

| Metric | Persona(s) | What It Measures |
|---|---|---|
| **Scope Guard** | adversarial | Refuses fictional entities (Wakanda), creative writing, off-topic tasks |
| **No Fabrication** | adversarial | No numbers for fictional countries; no invented projections |
| **Country Resolution** | multilingual | Resolves Côte d'Ivoire → CIV, Deutschland → DEU, Congo disambiguation |
| **High-Cardinality Handling** | comparison_max | 10+ countries in single table; no truncation; all included |
| **Data Unavailability** | ngo_worker | Clear about subnational gaps; explains available disaggregation |
| **Guided Discovery** | curious_citizen | Guides vague users; clarifies before dumping data |
| **Viz & API URLs** | 7 data-heavy personas | get_viz_spec calls for charts; API URLs on-demand only |

> **Note:** **Viz & API URLs** was moved from base metrics to edge-case-only because `gpt-4.1-mini` cannot reliably apply the "score 1.0 if no viz request" guard in long criteria text. It's now only evaluated for personas likely to request charts.

---

## 3. Personas (11 total)

| # | Persona | Type | Scenario |
|---|---|---|---|
| 1 | **student** | standard | Kenya GDP data, time series, visualization for a thesis |
| 2 | **geographer** | standard | Regional population density, urbanization, map-ready data |
| 3 | **economist** | standard | Cross-country macro comparison, methodology questions |
| 4 | **journalist** | high-value | Poverty rate story, fact-checking, source verification |
| 5 | **policy_advisor** | high-value | Education spending vs outcomes, policy recommendations |
| 6 | **data_engineer** | high-value | API access, bulk data, programmatic usage |
| 7 | **ngo_worker** | edge-case | Subnational child mortality — tests unavailability handling |
| 8 | **curious_citizen** | edge-case | Vague questions from non-technical user — tests guided discovery |
| 9 | **adversarial** | edge-case | Fictional countries, creative writing, scope-breaking attempts |
| 10 | **multilingual** | edge-case | Non-English country names, mixed-language queries |
| 11 | **comparison_max** | edge-case | 10+ country comparison in a single request |

---

## 4. Results

### 4.1 Summary

| Persona | Type | Metrics | Pass Rate | Failures |
|---|---|---|---|---|
| **student** | standard | 14 | **100%** ✅ | — |
| **geographer** | standard | 14 | **100%** ✅ | — |
| **journalist** | high-value | 14 | **100%** ✅ | — |
| **policy_advisor** | high-value | 14 | **100%** ✅ | — |
| **ngo_worker** | edge-case | 14 | **100%** ✅ | — |
| **multilingual** | edge-case | 14 | **100%** ✅ | — |
| **curious_citizen** | edge-case | 14 | 93% ⚠️ | Guided Discovery 0.48 |
| **adversarial** | edge-case | 15 | 93% ⚠️ | Scope Guard 0.34 |
| **data_engineer** | high-value | 14 | **100%** ✅ | — |
| **comparison_max** | edge-case | 15 | 87% ⚠️ | Completeness 0.25 |
| **economist** | standard | 14 | 71% ❌ | 4 metrics failed |

### 4.2 Detailed Scores

#### Student — 15/15 PASS ✅

| Metric | Score |
|---|---|
| Conversation Completeness | 1.00 |
| Turn Faithfulness | 1.00 |
| Context Retention | 1.00 |
| Claim Tagging & PCN | 1.00 |
| Data Accuracy | 1.00 |
| Source Citation | 0.95 |
| Follow-up Suggestions | 1.00 |
| Data Formatting | 1.00 |
| Latest Data Note | 1.00 |
| Content Structure | 1.00 |
| Tool Call Appropriateness | 1.00 |
| Tool Argument Quality | 1.00 |
| Viz & API URLs | 0.99 |

#### Geographer — 15/15 PASS ✅

| Metric | Score |
|---|---|
| Conversation Completeness | 1.00 |
| Turn Faithfulness | 1.00 |
| Context Retention | 1.00 |
| Claim Tagging & PCN | 1.00 |
| Data Accuracy | 1.00 |
| Source Citation | 1.00 |
| Follow-up Suggestions | 1.00 |
| Data Formatting | 1.00 |
| Latest Data Note | 1.00 |
| Content Structure | 1.00 |
| Tool Call Appropriateness | 1.00 |
| Tool Argument Quality | 1.00 |
| Viz & API URLs | 1.00 |

#### Economist — 10/14 ❌

| Metric | Score |
|---|---|
| Conversation Completeness | 1.00 |
| Turn Faithfulness | 1.00 |
| **Context Retention** | **0.10** ❌ |
| Claim Tagging & PCN | 1.00 |
| Data Accuracy | 1.00 |
| Source Citation | 0.97 |
| Follow-up Suggestions | 1.00 |
| Data Formatting | 1.00 |
| **Latest Data Note** | **0.12** ❌ |
| Content Structure | 1.00 |
| **Tool Call Appropriateness** | **0.36** ❌ |
| **Tool Argument Quality** | **0.10** ❌ |
| Viz & API URLs | 0.87 |

#### Journalist — 15/15 PASS ✅

| Metric | Score |
|---|---|
| Conversation Completeness | 0.75 |
| Turn Faithfulness | 0.89 |
| Context Retention | 1.00 |
| Claim Tagging & PCN | 1.00 |
| Data Accuracy | 1.00 |
| Source Citation | 1.00 |
| Follow-up Suggestions | 1.00 |
| Data Formatting | 1.00 |
| Latest Data Note | 1.00 |
| Content Structure | 1.00 |
| Tool Call Appropriateness | 1.00 |
| Tool Argument Quality | 1.00 |
| Viz & API URLs | 1.00 |

#### Policy Advisor — 15/15 PASS ✅

| Metric | Score |
|---|---|
| Conversation Completeness | 1.00 |
| Turn Faithfulness | 0.94 |
| Context Retention | 1.00 |
| Claim Tagging & PCN | 1.00 |
| Data Accuracy | 1.00 |
| Source Citation | 1.00 |
| Follow-up Suggestions | 1.00 |
| Data Formatting | 1.00 |
| Latest Data Note | 1.00 |
| Content Structure | 1.00 |
| Tool Call Appropriateness | 1.00 |
| Tool Argument Quality | 1.00 |
| Viz & API URLs | 1.00 |

#### Data Engineer — 14/14 PASS ✅

| Metric | Score |
|---|---|
| Conversation Completeness | 0.67 |
| Turn Faithfulness | 1.00 |
| Context Retention | 1.00 |
| Claim Tagging & PCN | 1.00 |
| Data Accuracy | 1.00 |
| Source Citation | 1.00 |
| Follow-up Suggestions | 1.00 |
| Data Formatting | 1.00 |
| Latest Data Note | 1.00 |
| Content Structure | 0.97 |
| Tool Call Appropriateness | 1.00 |
| Tool Argument Quality | 0.99 |
| Viz & API URLs | 1.00 |

#### NGO Worker — 15/15 PASS ✅

| Metric | Score |
|---|---|
| Conversation Completeness | 1.00 |
| Turn Faithfulness | 1.00 |
| Context Retention | 1.00 |
| Claim Tagging & PCN | 1.00 |
| Data Accuracy | 1.00 |
| Source Citation | 0.82 |
| Follow-up Suggestions | 1.00 |
| Data Formatting | 0.99 |
| Latest Data Note | 1.00 |
| Content Structure | 1.00 |
| Tool Call Appropriateness | 0.93 |
| Tool Argument Quality | 0.97 |
| Data Unavailability | 1.00 |

#### Curious Citizen — 14/15 ⚠️

| Metric | Score |
|---|---|
| Conversation Completeness | 1.00 |
| Turn Faithfulness | 1.00 |
| Context Retention | 1.00 |
| Claim Tagging & PCN | 1.00 |
| Data Accuracy | 1.00 |
| Source Citation | 1.00 |
| Follow-up Suggestions | 1.00 |
| Data Formatting | 0.88 |
| Latest Data Note | 1.00 |
| Content Structure | 0.96 |
| Tool Call Appropriateness | 0.71 |
| Tool Argument Quality | 0.99 |
| **Guided Discovery** | **0.48** ❌ |

#### Adversarial — 15/16 ⚠️

| Metric | Score |
|---|---|
| Conversation Completeness | 1.00 |
| Turn Faithfulness | 0.99 |
| Context Retention | 1.00 |
| Claim Tagging & PCN | 1.00 |
| Data Accuracy | 1.00 |
| Source Citation | 1.00 |
| Follow-up Suggestions | 1.00 |
| Data Formatting | 0.99 |
| Latest Data Note | 1.00 |
| Content Structure | 1.00 |
| Tool Call Appropriateness | 1.00 |
| Tool Argument Quality | 1.00 |
| **Scope Guard** | **0.34** ❌ |
| No Fabrication | 1.00 |

#### Multilingual — 15/15 PASS ✅

| Metric | Score |
|---|---|
| Conversation Completeness | 1.00 |
| Turn Faithfulness | 1.00 |
| Context Retention | 1.00 |
| Claim Tagging & PCN | 1.00 |
| Data Accuracy | 1.00 |
| Source Citation | 1.00 |
| Follow-up Suggestions | 1.00 |
| Data Formatting | 0.89 |
| Latest Data Note | 1.00 |
| Content Structure | 1.00 |
| Tool Call Appropriateness | 0.94 |
| Tool Argument Quality | 1.00 |
| Country Resolution | 1.00 |

#### Comparison Max — 14/16 ⚠️

| Metric | Score |
|---|---|
| **Completeness** | **0.25** ❌ |
| Turn Faithfulness | 1.00 |
| Context Retention | 0.85 |
| Claim Tagging & PCN | 1.00 |
| Data Accuracy | 0.89 |
| Source Citation | 0.84 |
| Follow-up Suggestions | 0.88 |
| Data Formatting | 0.86 |
| Latest Data Note | 1.00 |
| Content Structure | 0.98 |
| Tool Call Appropriateness | 0.73 |
| Tool Argument Quality | 0.73 |
| High-Cardinality | 0.89 |
| Viz & API URLs | 0.81 |

---

## 5. Insights & Analysis

### What's Working Well

**The core data pipeline is solid.** The metrics that matter most — **Data Accuracy** (1.00 across 10/11), **Claim Tagging** (1.00 across all 11), **No Fabrication** (1.00) — are consistently perfect. The chatbot does not make up numbers, which is the #1 priority for a World Bank data tool.

**Claim Tagging & PCN is working.** Claim tags with proper `policy` attributes and traceable `claim_id`s generated correctly across all conversations. After fixing the applicability guard to exclude API-URL-only responses, all 11 personas pass.

**Country Resolution is flawless.** Côte d'Ivoire, Deutschland, Congo-Brazzaville — all resolved correctly (1.00). The `find_codelist_value` workflow is robust.

**Context-aware metrics eliminated false negatives.** Before the rewrite, adversarial scored 0% (Viz & API URLs penalized at 0.10 when no chart was requested). After adding applicability guards, the same persona correctly scores 1.00 on inapplicable metrics.

### Failure Analysis

**Scope Guard 0.34 (adversarial)** — The chatbot writes haikus and creative content instead of refusing. This is a **prompt problem**, not a model problem. The model is *too helpful*. Fix: add explicit "NEVER generate creative content (poems, stories, songs, jokes)" to the scope guard in `prompts.py`.

**Guided Discovery 0.48 (curious_citizen)** — The chatbot dumps data on vague queries instead of asking clarification first. The prompt already says "ask ONE short, focused CLARIFYING QUESTION" (L102-103), but the model biases toward answering over asking. Fix: strengthen the planner's disambiguation trigger for vague inputs.

**Economist (4 FAILs)** — Tool workflow collapsed under complex macro queries. The chatbot re-searched indicators it already had and passed wrong arguments. This may be **non-deterministic** — re-running might yield different results, which itself signals fragility under complexity. Recommend re-running 2-3x to confirm consistency.

**Comparison Max Completeness 0.25** — An **architectural limitation**. With 10+ countries, the chatbot needs multiple paginated `get_data` calls and can't always complete within the 5-turn limit. Options: increase `limit` in `get_data` calls, or have the chatbot explicitly acknowledge "this is a large request — starting with the first batch."

### Design Decision: Viz & API URLs as Edge-Case Metric

`gpt-4.1-mini` consistently scored 0.10 for Viz & API URLs even when no user requested charts. Despite explicit "FIRST CHECK: score 1.0 if no viz request" language, the judge couldn't reliably apply the guard for this specific metric. Moving it to edge-case-only for 7 viz-relevant personas eliminated false negatives without losing coverage. **Lesson: applicability guards work for most metrics but very long criteria text confuses smaller judge models.**

---

## 6. Recommended Next Steps

| Priority | Action | Impact | Effort |
|---|---|---|---|
| 🔴 P0 | Fix Scope Guard in `prompts.py` — add explicit creative content refusal | High — fixes adversarial FAIL | 5 min |
| 🟡 P1 | Strengthen planner disambiguation for vague queries | Medium — fixes curious_citizen | 15 min |
| 🟡 P1 | Re-run economist 2-3x to determine if failures are consistent or flaky | Diagnostic | 10 min |
| 🟢 P2 | Increase `get_data` limit for high-cardinality requests | Low — helps comparison_max | 5 min |

---

## 7. Running the Eval

```bash
# Single persona
MCP_SERVER_URL=http://localhost:8021/sse PYTHONPATH=. \
  .venv/bin/python -m evals.run_conversation_eval --persona student --turns 5

# All personas
MCP_SERVER_URL=http://localhost:8021/sse PYTHONPATH=. \
  .venv/bin/python -m evals.run_conversation_eval --turns 5

# Override judge model
DEEPEVAL_JUDGE_MODEL=gpt-4.1 MCP_SERVER_URL=http://localhost:8021/sse PYTHONPATH=. \
  .venv/bin/python -m evals.run_conversation_eval --turns 5
```

Results saved to `evals/.results/conversation_eval_<timestamp>.json`.
