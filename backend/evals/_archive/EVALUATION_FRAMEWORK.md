# Data360 Chatbot — Evaluation Framework

> A multi-layered quality assurance framework for the MCP-powered Data360 Chatbot,
> built on [DeepEval](https://github.com/confident-ai/deepeval) with custom extensions.

---

## 1. Framework Overview

Our evaluation framework uses **three complementary layers** to ensure chatbot quality at every stage:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    EVALUATION FRAMEWORK                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Layer 1: Conversational Eval (DeepEval)                            │
│  ├── 13 base metrics × 11 personas                                  │
│  ├── 7 edge-case metrics (persona-specific)                         │
│  ├── LLM-judged (gpt-4.1-mini)                                     │
│  └── Multi-turn conversation simulation                             │
│                                                                      │
│  Layer 2: Post-Hoc Analysis                                         │
│  ├── LLM conversation review (10 quality dimensions)                │
│  ├── Search relevancy analysis (MRR, Hit@K)                         │
│  └── Deterministic, runs on saved conversation data                 │
│                                                                      │
│  Layer 3: Standalone Component Testing                               │
│  ├── Search indicator selection eval (single-turn)                  │
│  ├── Disaggregation awareness testing                               │
│  └── No conversation needed — tests search + LLM selection          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Why Three Layers?

| Layer | Speed | What It Catches | Audience |
|---|---|---|---|
| **Conversational Eval** | ~2 min/persona | End-to-end quality across multi-turn interactions | Chatbot team |
| **Post-Hoc Analysis** | ~10s | Data traceability, search ranking quality, review gaps | Search team, QA |
| **Standalone Testing** | ~30s | Component-level search + selection quality | Search team |

---

## 2. Layer 1 — Conversational Evaluation (DeepEval)

### How It Works

```
Persona YAML ──→ DeepEval Simulator ──→ Dynamic questions
                                              ↓
                                     Chatbot pipeline (with MCP tools)
                                              ↓
                                     Multi-turn conversation
                                              ↓
                                     13+ metrics score each conversation
                                              ↓
                                     Pass/Fail per metric with scores
```

> **Key design choice:** Questions are **dynamically generated** by the DeepEval simulator
> based on the persona's scenario and expected outcome — not hardcoded test cases.
> This ensures the chatbot is tested on realistic, varied queries.

### Personas (11)

Each persona represents a distinct user archetype with specific data needs and conversation patterns:

| Persona | Role | Key Behaviors Tested |
|---|---|---|
| **Student** | Economics undergrad researching GDP | Multi-step data retrieval, comparison tables, charts |
| **Economist** | Central bank researcher | Technical precision, methodology questions, source citations |
| **Health Researcher** | Epidemiologist studying disease trends | Cross-database search, indicator selection, data accuracy |
| **Policy Advisor** | Government cabinet briefing prep | Education spending data, policy-relevant framing |
| **NGO Worker** | Field worker in Bangladesh | Subnational data limits, gender disaggregation, data gaps |
| **Journalist** | Data-driven reporter | Quick facts, clear sourcing, visualization requests |
| **Data Engineer** | API integration specialist | Raw data access, API URLs, technical metadata |
| **Geographer** | Spatial analyst | Urban/rural disaggregation, multi-country comparison |
| **Curious Citizen** | Non-technical user | Plain language, guided discovery, no jargon |
| **Adversarial** | Tries to trick the chatbot | Scope guard, fabrication prevention, future projections |
| **Multilingual** | Non-English country names | Country code resolution, cross-language handling |
| **Comparison Max** | 12+ country comparison | High-cardinality tables, response length management |

### Metrics (20 total)

#### Base Metrics (13) — applied to all personas

| # | Metric | Type | What It Measures | Threshold |
|---|---|---|---|---|
| 1 | **Conversation Completeness** | Built-in | All expected outcomes satisfied | 0.5 |
| 2 | **Turn Faithfulness** | Built-in | No hallucinated tool results | 0.5 |
| 3 | **Context Retention** | GEval | References data from earlier turns | 0.6 |
| 4 | **Claim Tagging & PCN** | GEval | `<claim>` tags wrap every data value | 0.6 |
| 5 | **Data Accuracy** | GEval | Values match actual tool output | 0.7 |
| 6 | **Source Citation** | GEval | Database + indicator name cited | 0.6 |
| 7 | **Follow-up Suggestions** | GEval | 2-3 suggested follow-up questions | 0.4 |
| 8 | **Data Formatting** | GEval | Tables, units, consistent formatting | 0.6 |
| 9 | **Latest Data Note** | GEval | Notes "latest available" when no year specified | 0.6 |
| 10 | **Content Structure** | GEval | Headers, sections, clear organization | 0.4 |
| 11 | **Tool Call Appropriateness** | GEval | Correct tools called in right sequence | 0.6 |
| 12 | **Tool Argument Quality** | GEval | Valid country codes, indicator IDs, year ranges | 0.6 |
| 13 | **Search Indicator Selection** | GEval | Picks the most relevant indicator from search results | 0.6 |

#### Edge-Case Metrics (7) — persona-specific

| # | Metric | Applied To |
|---|---|---|
| 14 | Visualization & API URLs | student, geographer, economist, journalist, policy_advisor, data_engineer, comparison_max |
| 15 | Scope Guard | adversarial |
| 16 | No Fabrication | adversarial |
| 17 | Country Resolution | multilingual |
| 18 | Data Unavailability | ngo_worker |
| 19 | Guided Discovery | curious_citizen |
| 20 | High-Cardinality Handling | comparison_max |

### Latest Results (Run 5, 2026-02-28)

| Result | Personas |
|---|---|
| **100% pass** | Student, Geographer, Journalist, Multilingual, Adversarial |
| **84–92% pass** | Policy Advisor, Data Engineer, NGO Worker, Curious Citizen |
| **76–78% pass** | Economist, Comparison Max |

> Average cost per full run (11 personas): **~$0.70**

---

## 3. Layer 2 — Post-Hoc Analysis

### 3a. LLM Conversation Review (`review_conversation.py`)

An independent LLM reviewer (separate from DeepEval) reads saved conversations and evaluates across **10 quality dimensions**:

| Dimension | What It Checks |
|---|---|
| Data Traceability | Every number traces back to a tool call |
| Factual Accuracy | Values match tool output exactly |
| Tool Workflow | Correct search → select → fetch → present sequence |
| Claim Tag Coverage | All data values wrapped in `<claim>` tags |
| Source Citations | Database, indicator, and methodology cited |
| Follow-up Quality | Suggested questions are relevant and diverse |
| Content Structure | Clear headers, tables, organized sections |
| Cross-Turn Consistency | No contradictions between conversation turns |
| Expected Outcome Coverage | Persona's expected outcomes are satisfied |
| Conversation Naturalness | Flows like a real human-chatbot interaction |

**Output:** Markdown report + JSON with per-dimension scores and specific findings.

### 3b. Search Relevancy Analysis (`analyze_search_relevancy.py`)

Parses saved conversations to extract **search → select** pairs and computes ranking quality metrics:

| Metric | What It Tells You |
|---|---|
| **MRR** (Mean Reciprocal Rank) | How highly ranked the chosen indicator was on average |
| **Hit@1** | % of queries where the LLM picked the #1 search result |
| **Hit@3** | % of queries where the chosen indicator was in the top 3 |
| **Miss Rate** | % of queries where the chosen indicator wasn't in search results at all |
| **Rank Distribution** | How often each rank position is selected |

**Purpose:** Provides quantitative feedback to the **search team** on ranking quality — if MRR is low but the LLM still picks good indicators, the search ranking can be improved.

---

## 4. Layer 3 — Standalone Search Selection Eval (`eval_search_selection.py`)

Tests search indicator selection quality **without running full conversations**:

```
For each test query:
  1. Call search_indicators via MCP ──→ get ranked results
  2. Ask LLM: "which indicator would you pick?" ──→ get selected_id
  3. Calculate rank position (deterministic)
  4. Ask judge LLM: "is this the right pick?" ──→ 0.0-1.0 score
```

### Standard Tests (15 queries)

Covers core development indicators: GDP, mortality, unemployment, poverty, education, trade, etc.

### Disaggregation Awareness Tests (8 queries)

Verifies that when users ask for gender/age/urban-rural breakdowns, the selected indicators actually support those dimensions:

| Query Type | Expected Dimension | Example |
|---|---|---|
| "mortality rate by gender" | SEX | Does selected indicator have `SEX: [M, F, _T]`? |
| "population by urban rural" | URBANISATION | Does it support urban/rural breakdown? |

### Sample Results (2026-03-01)

| Metric | Value | Interpretation |
|---|---|---|
| **MRR** | 0.44 | LLM picks correct indicator at rank ~2-3 on average |
| **Hit@1** | 20% | Search ranking could improve — correct indicator often not #1 |
| **Hit@3** | 67% | Most correct indicators are in top 3 |
| **Hit@5** | 87% | Almost all correct indicators within top 5 |
| **Judge Score** | 1.00 | LLM always picks an appropriate indicator (even if not rank #1) |

> **Key Insight:** Judge score of 1.00 with MRR of 0.44 means the **LLM compensates for imperfect search ranking** — it correctly identifies the right indicator even when it's not the top result.

---

## 5. How to Run

### Prerequisites

```bash
cd backend
export OPENAI_API_KEY=<your-key>
export MCP_SERVER_URL=http://localhost:8021/sse
```

### Layer 1 — Conversational Eval

```bash
# Full suite (all 11 personas, ~2 min/persona)
uv run python -m evals.run_conversation_eval --turns 4

# Single persona
uv run python -m evals.run_conversation_eval --persona economist --turns 4

# Replay a previous run (re-evaluate without re-running chatbot)
uv run python -m evals.run_conversation_eval --replay 20260228_141436 --persona data_engineer
```

### Layer 2 — Post-Hoc Analysis

```bash
# LLM conversation review
uv run python -m evals.review_conversation --persona health_researcher
uv run python -m evals.review_conversation --all

# Search relevancy analysis
uv run python -m evals.analyze_search_relevancy --persona health_researcher
uv run python -m evals.analyze_search_relevancy --file .results/conversations_*.json --all
```

### Layer 3 — Standalone Search Eval

```bash
# Default 15 queries + 8 disaggregation queries
uv run python -m evals.eval_search_selection

# Custom queries with country context
uv run python -m evals.eval_search_selection --queries "GDP per capita, poverty rate" --country Kenya

# Multiple countries
uv run python -m evals.eval_search_selection --countries "Kenya, Brazil, India"
```

### Persona Generation (Utility)

```bash
# Generate new personas from existing ones as few-shot examples
uv run python -m evals.generate_personas --count 3
```

### Output Files

| File | Contents |
|---|---|
| `evals/.results/conversations_*.json` | Raw conversation turns per persona |
| `evals/.results/conversation_eval_*.json` | Metric scores per persona |
| `evals/conversations/<persona>.md` | Readable conversation transcript |
| `evals/reviews/search_relevancy_report.md` | Search ranking analysis report |
| `evals/reviews/search_selection_eval.md` | Standalone search eval results |
| `evals/reviews/<persona>_review.md` | Post-hoc LLM review per persona |

---

## 6. Architecture & File Index

```
evals/
├── run_conversation_eval.py     # Layer 1: DeepEval conversational eval (main entry)
├── pipeline_runner.py           # Non-streaming eval runner for chatbot pipeline
├── run_scorecard.py             # Single-turn scorecard tests (edge cases)
├── review_conversation.py       # Layer 2a: Post-hoc LLM conversation review
├── analyze_search_relevancy.py  # Layer 2b: Search ranking analysis (MRR, Hit@K)
├── eval_search_selection.py     # Layer 3: Standalone search selection eval
├── generate_personas.py         # Utility: LLM-powered persona generator
├── dump_conversations.py        # Export conversations for external review
├── personas/                    # 11 persona YAML definitions
│   ├── student.yaml
│   ├── economist.yaml
│   ├── health_researcher.yaml
│   └── ... (11 total)
├── conversations/               # Generated conversation transcripts
│   └── <persona>.md
├── reviews/                     # Post-hoc analysis reports
│   ├── search_relevancy_report.md
│   └── search_selection_eval.md
├── .results/                    # Raw results (gitignored)
│   ├── conversations_*.json
│   └── conversation_eval_*.json
├── .cache/                      # Cached tool definitions
│   └── tool_definitions.json
├── EVALUATION_GUIDE.md          # Detailed technical reference (metrics, thresholds, examples)
├── EVALUATION_FRAMEWORK.md      # This document — high-level overview
├── EVAL_FINDINGS.md             # Consolidated findings across runs
└── mvp_features.md              # MVP feature spec (drives persona design)
```

---

## 7. Key Design Decisions

### Why DeepEval?

- **Conversational metrics** — built-in support for multi-turn evaluation
- **ConversationSimulator** — generates realistic user queries from persona definitions
- **GEval** — flexible LLM-judged metrics with custom criteria and evaluation steps
- **Built-in faithfulness/completeness** — no need to build from scratch

### Why LLM-as-Judge?

All custom metrics use `gpt-4.1-mini` as the judge model because:
- Data accuracy and tool workflow quality require **semantic understanding** — regex/rule-based approaches miss nuance
- **Applicability clauses** in each metric prevent false failures (e.g., "if no data was presented, score 1.0")
- **Evaluation steps** provide structured, reproducible judging (not just a free-form prompt)

### Why Post-Hoc Analysis in Addition to DeepEval?

- **Independence** — catches issues the LLM judge might miss
- **Deterministic metrics** — MRR/Hit@K are exact, not judged
- **Search team feedback** — provides concrete ranking data, not just pass/fail

### Why Personas Instead of Static Test Cases?

- **Realistic coverage** — 11 personas × dynamic questions = diverse test scenarios each run
- **Edge cases by design** — adversarial, multilingual, and data-unavailability personas test boundaries
- **Extensible** — `generate_personas.py` can create new personas automatically

---

## 8. Findings & Insights

### Search Indicator Behavior

Our investigation revealed two distinct patterns the LLM uses for gender-disaggregated queries:

| Pattern | When Used | Example |
|---|---|---|
| **Sex-specific indicators** | Search returns `_MA`/`_FE` suffixed indicators | `SH_DYN_MORT_MA` (male mortality) |
| **Disaggregation filters** | Search result has `dimensions: ['SEX']` | `get_data(SEX="M,F")` on base indicator |

> **Notable finding:** The LLM **never calls `get_disaggregation`** to verify available filter values —
> it either finds sex-specific variants via search or guesses filter codes from training knowledge.
> The system prompt instruction is too weak ("if needed").

### Search Ranking Quality

- **MRR: 0.44** — the correct indicator is typically at rank 2-3, not #1
- **Judge: 1.00** — the LLM always compensates and picks the right one
- **Implication:** Improving search ranking would reduce token usage and latency

### Top Failure Modes (from Run 5)

| Failure | Personas Affected | Root Cause |
|---|---|---|
| Visualization URLs not generated | Policy Advisor | Chatbot answers without generating viz |
| Claim tag coverage gaps | Data Engineer | Some values not wrapped in `<claim>` tags |
| Context retention | NGO Worker | Multi-turn data references lost |

---

## 9. Roadmap

| Priority | Enhancement | Status |
|---|---|---|
| ✅ Done | DeepEval conversational eval (13 base + 7 edge-case metrics) | Implemented |
| ✅ Done | Post-hoc LLM conversation review | Implemented |
| ✅ Done | Search relevancy analysis (MRR/Hit@K) | Implemented |
| ✅ Done | Standalone search selection eval with disaggregation awareness | Implemented |
| 🔲 Planned | Strengthen `get_disaggregation` usage in system prompt | Identified |
| 🔲 Planned | MCP-native metrics (`MCPUseMetric`, `MCPTaskCompletionMetric`) | Requires DeepEval `mcp_servers` field |
| 🔲 Planned | `StepEfficiencyMetric` — detect unnecessary tool calls | Future |
| 🔲 Planned | CI/CD integration — run eval on each PR | Future |
