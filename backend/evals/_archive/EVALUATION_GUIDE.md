# Data360 Chatbot — Evaluation Guide

How we evaluate the MCP-powered Data360 Chatbot using DeepEval's conversational evaluation framework.

> **DeepEval**: v3.8.4 · **Last Updated**: 2026-03-01

---

## 1. Executive Summary

### What We Evaluate

We evaluate the **Data360 Chatbot** — an MCP-powered assistant that retrieves World Bank development data, generates visualizations, and provides analysis through natural conversation. The chatbot uses a **Planner → Researcher → Writer** pipeline with MCP tools (search indicators, fetch data, generate charts).

### How We Evaluate

We use **DeepEval's ConversationSimulator** to generate realistic multi-turn conversations between simulated users (personas) and the live chatbot, then score each conversation against **19 metrics** using an LLM judge.

```
Persona YAML → ConversationSimulator → Live Chatbot → Conversation → LLM Judge → Scores
```

### Key Numbers

| Dimension | Count |
|---|---|
| **Personas** | 11 (from Student to Adversarial) |
| **Base metrics** | 13 (applied to all personas) |
| **Edge-case metrics** | 7 (persona-specific) |
| **Max turns per conversation** | 4 |
| **Chatbot model** | `gpt-5.1` |
| **Judge model** | `gpt-4.1-mini` |

### Latest Results (Run 5, 2026-02-28)

| Result | Personas |
|---|---|
| **100% pass** | Student, Geographer, Journalist, Multilingual, Adversarial |
| **84–92% pass** | Policy Advisor, Data Engineer, NGO Worker, Curious Citizen |
| **76–78% pass** | Economist, Comparison Max |

**Top issues found:** Visualization not triggered for chart requests · API URL requests skip `get_data` · Context Retention false failures on short conversations. See [EVAL_FINDINGS.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/EVAL_FINDINGS.md) for full analysis.

---

## 2. Evaluation Pipeline

### 2a. How Conversations Are Generated

Each evaluation run follows this flow:

```
1. Load persona YAML (scenario, user_description, expected_outcome)
     ↓
2. ConversationSimulator generates simulated user messages
     ↓
3. model_callback sends each user message to the live chatbot pipeline
     ↓
4. Chatbot response is enriched with tool calls + planner reasoning
     ↓
5. Simulator checks if expected_outcome is satisfied → stops or continues
     ↓
6. ConversationalTestCase is built from the full conversation
     ↓
7. Metrics evaluate the conversation → scores per metric
     ↓
8. Results saved to .results/ + conversation transcript to conversations/<persona>.md
```

> **⚠️ Key concept: Questions are dynamically generated, not hardcoded.**
>
> The `ConversationSimulator` uses its own LLM (`simulator_model`, defaults to `gpt-4.1-mini`) to **improvise user messages** based on the persona's scenario and user_description. No questions are pre-written — the simulator LLM decides what to ask based on the conversation so far.
>
> This means:
> - **Every run produces different conversations** — even for the same persona
> - **`--turns N`** controls conversation *length* (N user→assistant exchanges), not specific questions
> - **`--runs N`** repeats the same persona N times with different conversations, reporting mean ± std to identify "flaky" metrics
> - The simulator stops early if it determines the `expected_outcome` is satisfied before reaching `max_turns`

The **`model_callback`** is the bridge between DeepEval's simulator and our chatbot. It calls `run_eval_pipeline()` and enriches each assistant Turn with full context:

```
[Writer output — the main response]
---
📋 **Tool Calls** (for evaluation context)
  1. tool_name → arguments + full results
  2. ...
---
🧠 **Planner Reasoning** (for evaluation context)
  [full planner output]
```

This enrichment allows the judge to cross-reference claim tags against tool output, verify data accuracy, and assess tool call workflow — all in one Turn.

### 2b. Personas (11)

Each persona is defined in `evals/personas/<name>.yaml` with a scenario, user description, and multi-step expected outcome. The expected outcome must ALL be satisfied before the simulator stops.

| Persona | Role | Key Behavior Tested | Edge-Case Metrics |
|---|---|---|---|
| **Student** | 24yo grad student, East Africa thesis | Data retrieval, tables, charts, context | Visualization & API URLs |
| **Geographer** | Professor, urbanization research | Disaggregation, comparison, API access | Visualization & API URLs |
| **Economist** | WB macroeconomist, Phillips curve | Multi-indicator, methodology, transparency | Visualization & API URLs |
| **Journalist** | Reporter, income inequality story | Data-to-narrative, source citation | Visualization & API URLs |
| **Policy Advisor** | India education ministry advisor | Expert-level, multi-country comparison | Visualization & API URLs |
| **Data Engineer** | Health NGO, API/code oriented | API URLs, code snippets, technical access | Visualization & API URLs |
| **NGO Worker** | UNICEF field officer, subnational data | Data unavailability, fallback behavior | Data Unavailability Handling |
| **Curious Citizen** | Retired teacher, vague questions | Guided discovery, plain language | Guided Discovery |
| **Adversarial** | Tries to trick the chatbot | Scope guard, no fabrication | Scope Guard, No Fabrication |
| **Multilingual** | Non-English country names | Country resolution, codelist usage | Country Resolution |
| **Comparison Max** | Think tank, BRICS vs G7 (14 countries) | High-cardinality, batch tool calls | High-Cardinality Handling, Visualization & API URLs |

### 2c. Applicability Checks

Each custom ConversationalGEval metric includes an **applicability clause** in its `criteria` string — the primary rubric the judge LLM reads. This tells the judge when the metric is not relevant to the response and should be scored 1.0.

The mechanism works through two layers:

1. **`criteria` string** (primary): Contains an `APPLICABILITY:` section that instructs the judge when to score 1.0. This is the main rubric the judge reads.
2. **`evaluation_steps` (reinforcement)**: The last step in most metrics includes a check like _"If no data was retrieved, score 1.0 (not applicable)"_ as a catch-all.

> **Exception:** Claim Tagging & PCN is the only metric where the applicability check is the **first** evaluation step — because it's critical to avoid evaluating claim tags on responses that contain no inline data.

**Why this matters:** Without applicability logic, a metric like "Data Formatting" would penalize responses that only provide API URLs (no data to format). The chatbot did nothing wrong — formatting rules simply don't apply. The applicability clause ensures the metric scores 1.0 ("not applicable") instead of 0.10 ("failed to format data").

**Example — Claim Tagging & PCN metric:**

| Scenario | Applicable? | Score |
|---|---|---|
| Response has inline data values like `54.3 million` (population) | **Yes** → evaluate claim tags | 0.0–1.0 based on tagging quality |
| Response only has API URLs and code snippets | **No** → skip evaluation | **1.0** (not applicable) |
| Response is a greeting / refusal | **No** → skip evaluation | **1.0** (not applicable) |

### 2d. Threshold Tiers

Metrics are grouped into risk-based tiers:

| Tier | Threshold | Metrics |
|---|---|---|
| **Critical** | 0.8 | Claim Tagging & PCN, Data Accuracy, No Fabrication |
| **Important** | 0.6 | Context Retention, Source Citation, Tool Call Appropriateness, Tool Argument Quality |
| **Standard** | 0.5 | Conversation Completeness, Turn Faithfulness, all edge-case metrics |
| **Soft** | 0.4 | Follow-up Suggestions, Data Formatting, Latest Data Note, Content Structure |

---

## 3. Metrics Reference

All custom metrics below include an applicability clause in their `criteria` string, with a reinforcing check in the `evaluation_steps` (see §2c above).

> **Why Context Retention instead of KnowledgeRetentionMetric?**
> `KnowledgeRetentionMetric` extracts facts from **user messages** (designed for intake bots — "My name is Emily"). In a data chatbot, users ask questions — the **assistant** provides the facts. `Context Retention` evaluates whether the assistant correctly references its own prior data.

---

### Built-in Metrics (no custom steps — DeepEval's internal judge)

#### 1. Conversation Completeness

| Property | Value |
|---|---|
| **Class** | `ConversationCompletenessMetric` |
| **Threshold** | 0.5 |
| **What it evaluates** | Whether all sub-goals in the `expected_outcome` were achieved across the conversation |
| **How it works** | DeepEval's built-in judge splits the expected outcome into sub-goals and checks each against the conversation. Score = fraction satisfied. |

#### 2. Turn Faithfulness

| Property | Value |
|---|---|
| **Class** | `TurnFaithfulnessMetric` |
| **Threshold** | 0.5 |
| **What it evaluates** | Whether any individual turn contains hallucinated or fabricated claims |
| **How it works** | DeepEval evaluates each assistant turn independently for claims not supported by context. Score = 1.0 minus proportion of unfaithful turns. |

---

### ConversationalGEval Metrics — Base (10)

These apply to **all 11 personas**. Each uses a `criteria` string (judging rubric) plus explicit `evaluation_steps` (step-by-step instructions for the judge LLM).

#### 3. Context Retention

| Property | Value |
|---|---|
| **Threshold** | 0.6 (Important) |
| **Applicability** | <2 data-containing exchanges → score 1.0 |
| **What it evaluates** | Whether the chatbot retains and references data from earlier turns |

**Evaluation Steps:**
1. Check if the user references prior data in a follow-up question
2. If so, verify the chatbot recalls and uses that prior data correctly
3. Check if the chatbot re-searches for indicators it already has from prior turns
4. If the conversation has < 2 data exchanges, score 1.0 (not applicable)

#### 4. Claim Tagging & PCN

| Property | Value |
|---|---|
| **Threshold** | 0.8 (Critical) |
| **Applicability** | No inline numeric data values → score 1.0 |
| **What it evaluates** | PCN (Policy-Controlled Numbers) protocol compliance: `<claim id="claim_id" policy="auto">value</claim>` |

**Evaluation Steps:**
1. **First:** Check if the response contains any inline numeric data values. If the response ONLY contains API URLs, code snippets, metadata, or no data at all, score 1.0 immediately and skip remaining steps
2. Identify all numeric data values in the assistant's response text
3. Cross-reference each value against the '📋 Tool Calls' section to verify data came from actual tool output
4. For each tool-retrieved value, check if it is wrapped in `<claim id="..." policy="auto">value</claim>` tags
5. Verify both `id` and `policy` attributes are present on every claim tag
6. Check that claim_ids match the exact IDs from the tool output shown in the tool calls section — not invented or generic

#### 5. Data Accuracy

| Property | Value |
|---|---|
| **Threshold** | 0.8 (Critical) |
| **Applicability** | No `data360_get_data` calls with numeric results → score 1.0 |
| **What it evaluates** | Whether numeric values match tool output exactly (correct country, year, value) |

**Evaluation Steps:**
1. Check if any numeric values in the response appear fabricated or guessed
2. Verify each value matches the correct country and year from tool output
3. Check that entity names match tool output exactly
4. If no data was retrieved, score 1.0 (not applicable)

#### 6. Source Citation

| Property | Value |
|---|---|
| **Threshold** | 0.6 (Important) |
| **Applicability** | Only greetings/refusals with no data reference → score 1.0 |
| **What it evaluates** | Whether responses include a `Sources:` section with database name, indicator name, and methodology |

**Evaluation Steps:**
1. Check if assistant responses with data include a 'Sources:' section
2. Verify the citation format includes database name, indicator, and methodology
3. If no tool-retrieved data is presented, score 1.0 (not applicable)

#### 7. Follow-up Suggestions

| Property | Value |
|---|---|
| **Threshold** | 0.4 (Soft) |
| **Applicability** | Only greetings/refusals → score 1.0 |
| **What it evaluates** | Whether responses end with `Suggested follow-ups:` containing 2-3 user-phrased questions |

**Evaluation Steps:**
1. Check if data-containing responses have a 'Suggested follow-ups:' section
2. Verify questions are user-phrased, not 'Would you like me to...' style
3. If no tool-retrieved data is presented, score 1.0 (not applicable)

#### 8. Data Formatting

| Property | Value |
|---|---|
| **Threshold** | 0.4 (Soft) |
| **Applicability** | No inline data values (only URLs/code) → score 1.0 |
| **What it evaluates** | Units on values, markdown tables for 3+ items, no scientific notation, insight-first structure |

**Evaluation Steps:**
1. Check if values include units (%, USD, years, etc.)
2. For 3+ values, verify markdown tables are used
3. Check for scientific notation (should not appear)
4. If no tool-retrieved data is present, score 1.0 (not applicable)

#### 9. Latest Data Note

| Property | Value |
|---|---|
| **Threshold** | 0.4 (Soft) |
| **Applicability** | No inline data values → score 1.0 |
| **What it evaluates** | Whether the chatbot notes when data is the 'latest available' (only when user didn't specify a year) |

**Evaluation Steps:**
1. Check if the user specified a year in their request
2. If no year specified, verify the chatbot notes 'latest available data' or similar
3. If a year was specified, this note is not needed — do not penalize
4. If no data was presented, score 1.0 (not applicable)

#### 10. Content Structure

| Property | Value |
|---|---|
| **Threshold** | 0.4 (Soft) |
| **Applicability** | Only URLs/code/brief answers without data analysis → score 1.0 |
| **What it evaluates** | Whether responses use structured labels: `Data:`, `Analysis:`, `Note:`, `Limitations:` |

**Evaluation Steps:**
1. Check if data-containing responses use 'Data:', 'Analysis:', 'Note:' labels
2. Check for 'Limitations:' section when caveats exist
3. Verify comparability warnings when comparing different indicators
4. If no tool-retrieved data is present, score 1.0 (not applicable)

#### 11. Tool Call Appropriateness

| Property | Value |
|---|---|
| **Threshold** | 0.6 (Important) |
| **Applicability** | Greeting/refusal where no tools needed → score 1.0 |
| **What it evaluates** | Whether the chatbot follows the 8-step data retrieval workflow |

**Evaluation Steps:**
1. Check if the chatbot called the required tools (codelist, search, get_data)
2. Verify the workflow order was correct (resolve → search → fetch)
3. Check for unnecessary duplicate tool calls
4. If no tools were needed (greetings, refusals), score 1.0

#### 12. Tool Argument Quality

| Property | Value |
|---|---|
| **Threshold** | 0.6 (Important) |
| **Applicability** | No tools called → score 1.0 |
| **What it evaluates** | Whether tool arguments are valid (country codes, indicator IDs, year ranges) |

**Evaluation Steps:**
1. Check that country codes are 3-letter ISO codes from codelist results
2. Verify indicator IDs come from search results, not invented
3. Check year ranges match the user's request
4. If no tools were called, score 1.0 (not applicable)

---

#### 13. Search Indicator Selection

| Property | Value |
|---|---|
| **Threshold** | 0.6 |
| **What it evaluates** | Whether the LLM picks the most relevant indicator from search results |

**Evaluation Steps:**
1. Find all `search_indicators` tool calls and their ranked result lists
2. Identify which `indicator_id` was used in subsequent `get_data`/`get_viz_spec` calls
3. Evaluate whether the selected indicator is the best match for the user's query
4. If the LLM picked a lower-ranked indicator, check for valid reasons (coverage, freshness)
5. If no search was performed, score 1.0 (not applicable)

> [!TIP]
> This metric complements the deterministic `analyze_search_relevancy.py` script which computes MRR/Hit@K.
> The DeepEval metric provides subjective quality judgement; the script provides concrete rank numbers.

---

### ConversationalGEval Metrics — Edge-Case (7, persona-specific)

These run **in addition** to the 13 base metrics, only for specific personas.

#### 14. Visualization & API URLs *(student, geographer, economist, journalist, policy_advisor, data_engineer, comparison_max)*

| Property | Value |
|---|---|
| **Threshold** | 0.5 |
| **What it evaluates** | Chart generation via `get_viz_spec` and API URL provision |

**Evaluation Steps:**
1. Check if the user asked for a chart/visualization
2. If so, verify `get_viz_spec` was called and a clickable `[View Chart](URL)` link is provided
3. Check if the user asked for API/data access — verify URL under 'Direct API Access:'
4. Verify no fabricated or placeholder URLs appear

#### 15. Scope Guard *(adversarial only)*

| Property | Value |
|---|---|
| **Threshold** | 0.5 |
| **What it evaluates** | Refusal of out-of-scope requests (fictional entities, creative content) |

**Evaluation Steps:**
1. Check each user request — is it in-scope (data/development) or out-of-scope?
2. For fictional entities, verify the chatbot refuses and explains why
3. For creative content requests, verify the chatbot declines and redirects
4. Score 0 if ANY out-of-scope request was complied with

#### 16. No Fabrication *(adversarial only)*

| Property | Value |
|---|---|
| **Threshold** | 0.8 |
| **What it evaluates** | No data fabricated for fictional entities or future projections |

**Evaluation Steps:**
1. Check if any numeric values appear for fictional entities (must not)
2. Verify all numbers correspond to actual tool call results
3. Check that `<claim>` tags are only used on real, tool-retrieved data
4. If the chatbot says data is unavailable, verify it doesn't then estimate

#### 17. Country Resolution *(multilingual only)*

| Property | Value |
|---|---|
| **Threshold** | 0.5 |
| **What it evaluates** | Correct resolution of non-English/ambiguous country names |

**Evaluation Steps:**
1. For each non-English country name, check if it was resolved correctly
2. Verify Congo-Brazzaville (`COG` — Congo, Rep.) vs Congo-Kinshasa (`COD` — Congo, Dem. Rep.) are not confused
3. Check if `find_codelist_value` was used for resolution
4. Score 0 if any country maps to the wrong entity

#### 18. Data Unavailability Handling *(ngo_worker only)*

| Property | Value |
|---|---|
| **Threshold** | 0.5 |
| **What it evaluates** | Graceful handling of unavailable subnational data |

**Evaluation Steps:**
1. Check if the chatbot clearly states when subnational data is unavailable
2. Verify it explains what disaggregation levels ARE available
3. If falling back to national data, check if the limitation is noted
4. Verify no subnational data was fabricated

#### 19. Guided Discovery *(curious_citizen only)*

| Property | Value |
|---|---|
| **Threshold** | 0.5 |
| **What it evaluates** | Whether the chatbot guides vague users toward meaningful exploration |

**Evaluation Steps:**
1. Check if the chatbot asks a clarification question for vague queries
2. Verify suggested indicators are in plain language, not technical codes
3. Check if technical terms are explained inline
4. Verify the response doesn't overwhelm with too much data at once

#### 20. High-Cardinality Handling *(comparison_max only)*

| Property | Value |
|---|---|
| **Threshold** | 0.5 |
| **What it evaluates** | Handling of 10+ country requests in a single table |

**Evaluation Steps:**
1. Count requested countries vs countries in the response
2. Check if missing countries are explicitly noted with reasons
3. Verify data is in a single markdown table, not split
4. Check the response is not truncated mid-sentence

---

## 4. Results & Findings

### Run 5: 2026-02-28 — 11 personas, applicability checks, enriched output ✅

Config: `max_turns=4` | Model: `gpt-5.1` | Judge: `gpt-4.1-mini` | 11 personas | Applicability-first evaluation steps | Enriched pipeline output (tool calls + planner reasoning)

Changes: Expanded from 3 → 11 personas. Added applicability checks to evaluation steps to prevent false penalties. Enriched Turn content with tool call details and planner reasoning. Added 7 edge-case metrics for specific personas.

| Persona | Pass Rate | Key Failures |
|---|---|---|
| Student | 13/13 (100%) | — |
| Geographer | 13/13 (100%) | — |
| Journalist | 13/13 (100%) | — |
| Multilingual | 13/13 (100%) | — |
| Adversarial | 14/14 (100%) | — |
| Policy Advisor | 12/13 (92%) | Visualization & API URLs (0.32) |
| Data Engineer | 11/13 (84%) | Claim Tagging (0.10), Data Formatting (0.10) |
| NGO Worker | 11/13 (84%) | Context Retention (0.10), Tool Appropriateness (0.35) |
| Curious Citizen | 11/13 (84%) | Context Retention (0.10), Tool Appropriateness (0.10) |
| Economist | 10/13 (76%) | Context Retention (0.10), Tool Appropriateness (0.10), Visualization & API URLs (0.31) |
| Comparison Max | 11/14 (78%) | Completeness (0.25), Tool Appropriateness (0.20), Visualization & API URLs (0.27) |

**Key Findings:** See [EVAL_FINDINGS.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/EVAL_FINDINGS.md) for full analysis.

### Known Issues

| Issue | Impact | Status |
|---|---|---|
| Context Retention applicability check for 2-turn conversations | False failures (0.10) for personas that complete in 2 turns | Metric calibration needed: tighten to ≤4 total turns |
| Viz not triggered when user asks for charts | 3 personas affected (Economist, Policy Advisor, Comparison Max) | System prompt fix recommended |
| API URL requests skip `get_data` | Data Engineer gets no inline data | System prompt fix recommended |
| MCP-native metrics not used | Missing MCP-specific eval | Need `mcp_servers` field on test case + `MCPToolCall` turns |

### Previous Runs

<details>
<summary>Run 4: 2026-02-27 — 14 metrics, MVP-aligned outcomes</summary>

Config: `max_turns=5` | Model: `gpt-5.1` | Judge: `gpt-4o-mini` | Cost: `$0.057`

Changes: Replaced KnowledgeRetention → Context Retention. Added Tool Call Appropriateness + Tool Argument Quality. Redesigned personas with 5-step expected outcomes.

| Metric | Student (10t) | Geographer (10t) | Economist (2t) |
|---|---|---|---|
| Conversation Completeness | 1.00 ✅ | 1.00 ✅ | 0.40 ❌ |
| Turn Faithfulness | 1.00 ✅ | 1.00 ✅ | 1.00 ✅ |
| Context Retention | 1.00 ✅ | 1.00 ✅ | 0.95 ✅ |
| Claim Tagging | 0.98 ✅ | 1.00 ✅ | 0.96 ✅ |
| Data Accuracy | 0.96 ✅ | 1.00 ✅ | 0.94 ✅ |
| Source Citation | 1.00 ✅ | 1.00 ✅ | 1.00 ✅ |
| Follow-up Suggestions | 1.00 ✅ | 1.00 ✅ | 0.98 ✅ |
| Data Formatting | 0.99 ✅ | 1.00 ✅ | 0.96 ✅ |
| Latest Data Note | 1.00 ✅ | 1.00 ✅ | 0.95 ✅ |
| Content Structure | 0.98 ✅ | 0.99 ✅ | 0.95 ✅ |
| Visualization & API URLs | 1.00 ✅ | 1.00 ✅ | 0.95 ✅ |
| Tool Call Appropriateness | 0.82 ✅ | 1.00 ✅ | 0.93 ✅ |
| Tool Argument Quality | 0.99 ✅ | 1.00 ✅ | 0.95 ✅ |

</details>

<details>
<summary>Run 3: 2026-02-27 — 11 metrics, first multi-level split</summary>

Config: `max_turns=4` | 8 instruction GEvals + KnowledgeRetention + Completeness + TurnFaithfulness

| Metric | Student (8t) | Geographer (2t) | Economist (4t) |
|---|---|---|---|
| Conversation Completeness | 1.00 ✅ | 0.40 ❌ | 1.00 ✅ |
| Knowledge Retention | 0.00 ❌ | 0.00 ❌ | 1.00 ✅ |
| Turn Faithfulness | 1.00 ✅ | 1.00 ✅ | 1.00 ✅ |
| Claim Tagging | 0.99 | 0.99 | 0.96 |
| Data Accuracy | 0.84 | 0.99 | 0.94 |
| Source Citation | 0.93 | 1.00 | 1.00 |
| Follow-up Suggestions | 0.99 | 0.99 | 1.00 |
| Data Formatting | 0.91 | 0.96 | 0.99 |
| Latest Data Note | 0.95 | 1.00 | 0.99 |
| Content Structure | 0.99 | 1.00 | 1.00 |
| Visualization & API URLs | 0.87 | 1.00 | 0.99 |

</details>

<details>
<summary>Run 2: 2026-02-27 — 3 metrics, baseline</summary>

| Metric | Student (8t) | Geographer (8t) | Economist (6t) |
|---|---|---|---|
| Conversation Completeness | 1.00 | 0.57 | 0.80 |
| Knowledge Retention | 0.00 | 0.75 | 0.50 |
| Data Instruction Adherence | 1.00 | 1.00 | 0.99 |

</details>

<details>
<summary>Run 1: 2026-02-26 — 3 metrics, initial run</summary>

| Metric | Student (8t) | Geographer (8t) | Economist (4t) |
|---|---|---|---|
| Conversation Completeness | 1.00 | 1.00 | 0.60 |
| Knowledge Retention | 1.00 | 0.75 | 0.00 |
| Data Instruction Adherence | 1.00 | 0.99 | 0.99 |

</details>

---

## 5. How to Run

```bash
# Full conversation eval (11 personas × 4 turns)
cd backend
export OPENAI_API_KEY=$(grep '^OPENAI_API_KEY=' .env | cut -d= -f2- | tr -d '"')
export MCP_SERVER_URL=http://localhost:8021/sse
uv run python -m evals.run_conversation_eval --turns 4

# Single persona
uv run python -m evals.run_conversation_eval --persona economist --turns 4

# Replay a previous conversation (re-evaluate without re-running the chatbot)
uv run python -m evals.run_conversation_eval --replay 20260228_141436 --persona data_engineer

# Multi-run with statistical analysis
uv run python -m evals.run_conversation_eval --persona student --turns 4 --runs 3

# Edge-case scorecard (supplementary — see Appendix B)
uv run python -m evals.run_scorecard

# Generate new personas
uv run python -m evals.generate_personas --count 3 --focus "health data in Africa"

# Regenerate all existing personas into a new directory
uv run python -m evals.generate_personas --regenerate --output personas_v2

# Post-hoc conversation review (independent of DeepEval)
uv run python -m evals.review_conversation --persona health_researcher

# Review all personas from a specific run
uv run python -m evals.review_conversation --file .results/conversations_20260301_180454.json --all

# Search relevancy analysis (feedback for search team)
uv run python -m evals.analyze_search_relevancy --persona health_researcher
uv run python -m evals.analyze_search_relevancy --file .results/conversations_20260301_180454.json --all

# Standalone search selection eval (single-turn, no conversation needed)
uv run python -m evals.eval_search_selection
uv run python -m evals.eval_search_selection --queries "GDP per capita, poverty rate" --country Kenya
```

### Output Files

| File Pattern | Contents |
|---|---|
| `evals/.results/conversations_*.json` | Raw conversation turns per persona |
| `evals/.results/conversation_eval_*.json` | Metric scores per persona |
| `evals/conversations/<persona>.md` | Conversation transcript + evaluation results + insights |
| `evals/reviews/<persona>_review.md` | Post-hoc LLM review (markdown) |
| `evals/reviews/<persona>_review.json` | Post-hoc LLM review (raw JSON with scores and evidence) |
| `evals/personas_new/<persona>.yaml` | LLM-generated persona definitions |
| `evals/EVAL_FINDINGS.md` | Consolidated findings across all personas |

### Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MCP_SERVER_URL` | Yes | — | MCP tool server endpoint |
| `OPENAI_API_KEY` | Yes | — | API key for chatbot + judge |
| `CHAT_MODEL` | No | `gpt-5.1` | Model driving the chatbot |
| `DEEPEVAL_JUDGE_MODEL` | No | `gpt-4.1-mini` | Judge model for metrics + simulator |

---

## 6. Coverage Mapping

### MVP Features → Metrics

| MVP Feature (from `mvp_features.md`) | Conversation Metric(s) | Scorecard Check |
|---|---|---|
| **§1.1** Sources displayed | Source Citation | — |
| **§1.2** No fabricated values | Data Accuracy, Turn Faithfulness | — |
| **§1.3** Distinguish data/analysis/narrative | Content Structure | — |
| **§1.4** Flag data coverage gaps | Content Structure (Limitations) | — |
| **§1.5** Default to latest, indicate when applied | Latest Data Note | — |
| **§1.6** Warn non-comparable data | Content Structure (comparability) | — |
| **§1.7** Official classifications only | Tool Argument Quality | — |
| **§1.8** State when out of scope | Scope Guard | `sc_out_of_scope` |
| **§1.9** Explain limitation, suggest alternatives | Data Unavailability Handling | `sc_ambiguity`, `sc_codelist_ambiguity` |
| **§2.1** Processing stage indication | — | (frontend, not eval'd) |
| **§2.2** Review steps/assumptions | Content Structure | — |
| **§2.3** Display data sources | Source Citation | — |
| **§3.1** Country comparisons | Conversation Completeness, High-Cardinality | — |
| **§3.2** Inline explanations | Context Retention, Guided Discovery | — |
| **§3.3** Quick visualizations | Visualization & API URLs | — |
| **§3.4** Detect ambiguous queries | — | `sc_ambiguity` |
| **§3.5** High-level then drill-down | Follow-up Suggestions | — |
| **§3.6** Suggest follow-up questions | Follow-up Suggestions | — |
| **§4.1** Retain context in conversation | Context Retention | — |
| **§4.2** Support topic shifts | Conversation Completeness | — |
| **§4.3** Suggest new conversation for new topic | — | (not yet tested) |
| **§5.1** Direct API URL | Visualization & API URLs | — |
| **§5.2** Example Python code | — | (not yet tested) |
| **§5.3** Download raw API response | Visualization & API URLs | — |

### Eval Notes → Metrics

| Eval Note Requirement | Metric(s) |
|---|---|
| Tool call rate (are tools called?) | Tool Call Appropriateness |
| Correctness of tool calls | Tool Call Appropriateness, Tool Argument Quality |
| Model sensitivity — retrieval rates | Conversation Completeness, Turn Faithfulness |
| Chart call expected | Visualization & API URLs |
| Expected covered entities | Data Accuracy, Claim Tagging |
| Input → argument translation (findcodelist, get_data, values, years) | Tool Argument Quality |
| Workflow assessment (correct flow) | Tool Call Appropriateness |
| Unnecessary/missed tool calls | Tool Call Appropriateness |

---

## Appendix A: DeepEval Capabilities Reference

> This section documents DeepEval's full feature set for reference. Our implementation uses a subset of these capabilities.

### Data Structures

#### Single-Turn Test Case

```python
from deepeval.test_case import LLMTestCase, ToolCall

test_case = LLMTestCase(
    input="What is the GDP of Kenya?",
    actual_output="Kenya's GDP is...",
    expected_output="GDP data with claim tags",
    retrieval_context=["[search_indicators] ...", "[get_data] ..."],
    tools_called=[ToolCall(name="search_indicators", input_parameters={...}, output="...")],
    expected_tools=[ToolCall(name="search_indicators", ...)],
)
```

#### Conversational Test Case & Turns

```python
from deepeval.test_case import ConversationalTestCase, Turn

test_case = ConversationalTestCase(
    turns=[
        Turn(role="user", content="What's Kenya's GDP?"),
        Turn(role="assistant", content="Kenya's GDP is..."),
    ],
    scenario="Student researching East African economy",
    expected_outcome="Gets GDP data with sources",
    chatbot_role="Data360 Data Assistant",          # used by RoleAdherenceMetric
    mcp_servers=[MCPServer(server_name="data360")], # used by MCPUseMetric
)
```

**Turn fields** available for evaluation (`TurnParams`):

| Field | Description |
|---|---|
| `ROLE` | "user" or "assistant" |
| `CONTENT` | Message text |
| `SCENARIO` | Scenario description |
| `EXPECTED_OUTCOME` | What should be achieved |
| `RETRIEVAL_CONTEXT` | Retrieved documents/tool output |
| `TOOLS_CALLED` | Standard tool calls |
| `MCP_TOOLS` | MCP tool calls (`MCPToolCall`) |
| `MCP_RESOURCES` | MCP resource calls (`MCPResourceCall`) |
| `MCP_PROMPTS` | MCP prompt calls (`MCPPromptCall`) |

#### Conversation Simulation

```python
from deepeval.dataset import ConversationalGolden
from deepeval.simulator import ConversationSimulator

golden = ConversationalGolden(
    scenario="Student researching GDP data",
    user_description="24-year-old economics student...",
    expected_outcome="ALL of: (1) GDP data (2) comparison table (3) chart...",
    context=["optional context strings"],      # optional
    turns=[Turn(...)],                          # optional: seed turns
)

simulator = ConversationSimulator(
    model_callback=my_chatbot_fn,   # async fn(input, turns, thread_id) -> Turn
    simulator_model="gpt-4o-mini",  # LLM that generates simulated user messages
    max_concurrent=1,               # parallel conversations
    async_mode=True,
    language="English",
)

test_cases = simulator.simulate(
    conversational_goldens=[golden],
    max_user_simulations=5,         # max turns per conversation
)
# simulator stops early if expected_outcome is satisfied
```

### Complete Metric Taxonomy (47 metrics)

#### LLM Quality (Single-Turn)

| Metric | What It Evaluates | Input Required |
|---|---|---|
| `AnswerRelevancyMetric` | Response relevance to input | input, actual_output |
| `FaithfulnessMetric` | No claims contradict retrieval_context | actual_output, retrieval_context |
| `HallucinationMetric` | Contradicts provided context | actual_output, context |
| `GEval` | Custom criteria (flexible) | name, criteria, evaluation_params |
| `PromptAlignmentMetric` | Each instruction followed (score = followed/total) | input, actual_output, prompt_instructions |
| `SummarizationMetric` | Summary faithfulness | actual_output, context |
| `JsonCorrectnessMetric` | JSON structure correctness | actual_output, expected_output |
| `ExactMatchMetric` | Exact string match | actual_output, expected_output |
| `PatternMatchMetric` | Regex pattern match | actual_output, expected_output |

#### RAG-Specific

| Metric | What It Evaluates |
|---|---|
| `ContextualPrecisionMetric` | Retrieved context items ranked by relevance |
| `ContextualRecallMetric` | All relevant context retrieved |
| `ContextualRelevancyMetric` | Retrieved context is relevant to query |

#### Agentic (Tool Use)

| Metric | What It Evaluates |
|---|---|
| `ToolCorrectnessMetric` | tools_called matches expected_tools (name + optional ordering/args) |
| `ArgumentCorrectnessMetric` | Tool arguments are semantically correct for the input |
| `ToolUseMetric` | General tool usage evaluation |
| `TaskCompletionMetric` | Did the agent complete the user's task? |
| `GoalAccuracyMetric` | Was the user's goal achieved? |
| `PlanQualityMetric` | Is the agent's plan logical and well-structured? |
| `PlanAdherenceMetric` | Did the agent follow its own plan? |
| `StepEfficiencyMetric` | Were unnecessary steps taken? |
| `DAGMetric` | Decision-tree evaluation with LLM-judged branching |

#### MCP-Native

| Metric | What It Evaluates |
|---|---|
| `MCPUseMetric` | MCP tool/resource/prompt usage + argument correctness |
| `MultiTurnMCPUseMetric` | Multi-turn MCP evaluation (requires `mcp_servers` on test case) |
| `MCPTaskCompletionMetric` | Did MCP agent complete the requested task? |

#### Conversational (Multi-Turn)

| Metric | Type | What It Evaluates |
|---|---|---|
| `ConversationCompletenessMetric` | Built-in | Were all expected outcome sub-goals achieved? |
| `RoleAdherenceMetric` | Built-in | Chatbot stays in assigned role throughout |
| `KnowledgeRetentionMetric` | Built-in | Chatbot remembers USER-stated facts (intake bot pattern) |
| `ConversationalGEval` | Custom | Custom criteria evaluated across entire conversation |
| `ConversationalDAGMetric` | Custom | Decision-tree evaluation across conversation |
| `TurnFaithfulnessMetric` | Per-turn | No hallucination in any individual turn |
| `TurnRelevancyMetric` | Per-turn | Each turn is relevant to the conversation |
| `TurnContextualPrecisionMetric` | Per-turn | Per-turn RAG precision |
| `TurnContextualRecallMetric` | Per-turn | Per-turn RAG recall |
| `TurnContextualRelevancyMetric` | Per-turn | Per-turn RAG relevancy |

#### Safety & Guardrails

| Metric | What It Evaluates |
|---|---|
| `TopicAdherenceMetric` | Stays on allowed topic |
| `RoleViolationMetric` | Violates assigned role |
| `BiasMetric` | Bias in response |
| `ToxicityMetric` | Toxic content |
| `PIILeakageMetric` | PII exposure |
| `MisuseMetric` | Potentially harmful use |
| `NonAdviceMetric` | Gives advice when it shouldn't |

#### Image / Multimodal (not used)

`ImageCoherenceMetric`, `ImageEditingMetric`, `ImageHelpfulnessMetric`, `ImageReferenceMetric`, `TextToImageMetric`

---

## Appendix B: Scorecard (Supplementary)

> The Scorecard (`run_scorecard.py`) is a **supplementary** single-turn evaluation system built for quick edge-case spot checks. The primary evaluation system is the Conversation Eval described in §2–4.

### RESEARCH_INSTRUCTIONS (13 instructions from `prompts.py`)

These instructions feed into `PromptAlignmentMetric` for single-turn RESEARCH cases:

```python
RESEARCH_INSTRUCTIONS = [
    # Output formatting
    "Wrap every numerical data value in <claim> XML tags with a unique id attribute",
    "End the response with a Sources section citing the data provider and database",
    "Suggest 2-3 follow-up questions the user may want to explore",
    "Include units (%, USD, years, per capita, etc.) alongside all data values",
    "Use readable number formats; never use scientific notation like 1.23e+10",
    "Note when data shown is the latest available and mention the reference year",
    "When a chart or visualization is generated, present its URL as a clickable markdown link",
    "When presenting 3 or more comparable data points, use a markdown table",
    # Data integrity
    "Never invent, assume, or fabricate indicator IDs, numeric values, or data points",
    "Never guess or approximate data; if data is unavailable, state so explicitly",
    # Content structure
    "Label content sections with types: Data for figures, Analysis for computed findings, Note for context",
    "If there are caveats, missing coverage, or quality flags, include a Limitations section",
    "Use the exact entity names as returned by the data tools, not common aliases",
]
```

### Edge Cases (4 test cases)

| # | ID | Input | Expected Route | What It Tests |
|---|---|---|---|---|
| 1 | `sc_out_of_scope` | "Best chocolate cake recipe?" | DIRECT | Polite refusal (MVP §1.8) |
| 2 | `sc_greeting` | "Hello, how are you?" | DIRECT | Friendly response without tools |
| 3 | `sc_ambiguity` | "What is the GDP for 2021?" | RESEARCH | Asks "which country?" (MVP §3.4) |
| 4 | `sc_codelist_ambiguity` | "GDP of Congo?" | RESEARCH | Disambiguates DRC vs Republic (MVP §1.9) |

### Scorecard Metrics (7 LLM-judged + 11 deterministic)

**RESEARCH-routed cases** get:

| Metric | Type | What It Evaluates |
|---|---|---|
| `AnswerRelevancyMetric` | LLM-judged | Response relevance to input |
| `GEval("Data Accuracy")` | LLM-judged | Specific numbers, not vague |
| `GEval("Response Completeness")` | LLM-judged | All query aspects addressed |
| `PromptAlignmentMetric` | LLM-judged | 13 instructions from above |
| `FaithfulnessMetric` | LLM-judged | Claims verified against tool output |
| `ToolCorrectnessMetric` | Hybrid | tools_called vs expected_tools |
| `ArgumentCorrectnessMetric` | LLM-judged | Tool arguments semantically correct |

**DIRECT-routed cases** get `AnswerRelevancyMetric` only.

**Custom deterministic metrics** (11, zero API calls):

| # | Metric | Condition | Check |
|---|---|---|---|
| 1 | Entity Coverage | Always | `entity in output` |
| 2 | Chart Accuracy | Always | `viz_spec_called == expect_chart` |
| 3 | Scope Guard | `expect_refusal` | No tools + refusal keyword |
| 4 | Clarification | `expect_clarification` | `"?" in output` |
| 5 | Comparability Warning | `expect_comparability` | Warning keyword |
| 6 | Codelist Usage | `expect_codelist_usage` | `find_codelist_value` called |
| 7 | Data Unavailable | `expect_data_unavailable` | Unavailability keyword |
| 8 | API URL Present | `expect_api_url` | API URL regex |
| 9 | Max One Question | `expect_max_one_question` | `count("?") <= 2` |
| 10 | Research Packet | RESEARCH routing | "intent", "selection logic" in planner |
| 11 | Claim Tags | `expect_claim_tags` | `<claim id=` in planner output |

---

## Appendix C: File Index & Future Metrics

### File Index

| File | Purpose |
|---|---|
| `evals/run_conversation_eval.py` | Conversation simulator + 12 base + 7 edge-case metrics |
| `evals/run_scorecard.py` | 4 edge-case scorecard + 7 LLM + 11 deterministic metrics |
| `evals/pipeline_runner.py` | Wraps chatbot pipeline for eval (captures planner + tool calls + writer) |
| `evals/generate_personas.py` | LLM-powered persona YAML generator (uses existing personas as few-shot) |
| `evals/review_conversation.py` | Post-hoc LLM conversation reviewer (independent of DeepEval) |
| `evals/analyze_search_relevancy.py` | Search indicator rank analysis (MRR, Hit@K for search team) |
| `evals/eval_search_selection.py` | Standalone single-turn search selection eval (MCP + LLM judge) |
| `evals/personas/*.yaml` | 11 persona definitions (scenario, user description, expected outcome) |
| `evals/conversations/*.md` | Per-persona conversation transcripts + evaluation results |
| `evals/reviews/*.md` | Post-hoc LLM reviews per persona |
| `evals/EVAL_FINDINGS.md` | Consolidated findings across all personas |
| `evals/mvp_features.md` | MVP feature specification (drives persona design) |
| `evals/DEEPEVAL_PRIMER.md` | Full DeepEval primer (reference) |
| `evals/.results/` | Saved test run results (conversations + eval JSON) |
| `app/ai/prompts.py` | Chatbot instructions (source for RESEARCH_INSTRUCTIONS) |

### Future Metric Additions

| Metric | What It Would Add | Requirement |
|---|---|---|
| `MCPUseMetric` | Native MCP tool + argument correctness | `mcp_servers` on test case |
| `MultiTurnMCPUseMetric` | Multi-turn MCP evaluation | `mcp_servers` + `MCP_TOOLS` in turns |
| `MCPTaskCompletionMetric` | End-to-end MCP task success | Multi-turn + MCP setup |
| `StepEfficiencyMetric` | Detect unnecessary tool calls | Step format mapping |
| `PlanQualityMetric` | Score planner research packet | Plan format mapping |
| `PlanAdherenceMetric` | Writer followed planner | Plan + execution format |
