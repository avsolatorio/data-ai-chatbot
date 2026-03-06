# Evaluation Scorecard

Quantifiable evaluation suite for the Data360 Chat pipeline. Runs test cases through the live chatbot, scores responses using DeepEval LLM-judge metrics + custom deterministic metrics, and saves results as JSON for cross-model comparison.

## Quick Start

```bash
# Prerequisites: MCP server running on localhost:8021
# From backend/

# 1. Cache MCP tool definitions (one-time)
MCP_SERVER_URL=http://localhost:8021/sse PYTHONPATH=. .venv/bin/python -m evals.cache_tools

# 2. Run scorecard (defaults to CHAT_MODEL from .env)
MCP_SERVER_URL=http://localhost:8021/sse PYTHONPATH=. .venv/bin/python -m evals.run_scorecard

# 3. Compare models
MCP_SERVER_URL=http://localhost:8021/sse PYTHONPATH=. .venv/bin/python -m evals.run_scorecard --model gpt-5.1
MCP_SERVER_URL=http://localhost:8021/sse PYTHONPATH=. .venv/bin/python -m evals.run_scorecard --model gpt-4o-mini
MCP_SERVER_URL=http://localhost:8021/sse PYTHONPATH=. .venv/bin/python -m evals.run_scorecard --model gemini/gemini-2.5-flash

# 4. Custom judge model
MCP_SERVER_URL=http://localhost:8021/sse PYTHONPATH=. .venv/bin/python -m evals.run_scorecard --judge gpt-4o-mini
```

Results saved to `evals/.results/scorecard_{model}_{timestamp}.json`.

---

## Coverage Matrix ([Issue #2](https://github.com/avsolatorio/data360-mcp/issues/2))

Cross-reference of every requirement from the MCP Integration Evaluation Framework issue.

### 1. Synthetic Prompt Generation

| Requirement | Layer | Status | Implementation |
|---|---|---|---|
| Create realistic user prompts | Chatbot | ✅ | 8 test cases in `SCORECARD_CASES` covering data, charts, methodology, greetings |
| Adversarial prompts | Chatbot | ⚠️ Partial | `sc_out_of_scope` (chocolate cake) tests scope guard; no adversarial injection tests yet |
| Ambiguity variations | Chatbot | ❌ Not yet | No ambiguous queries (e.g., "Show me development data" without specifying country/indicator) |
| Underspecification | Chatbot | ❌ Not yet | No underspecified queries (e.g., "GDP" without country) |
| Multi-step requests | Chatbot | ❌ Not yet | No multi-turn follow-up sequences (e.g., "GDP of Kenya" → "Now show me a chart") |

### 2. Tool-use Evaluation

| Requirement | Layer | Status | Implementation |
|---|---|---|---|
| Selects the correct MCP tools | Chatbot | ✅ | **Tool Selection F1** metric (precision/recall) |
| Uses tools in appropriate sequence | Chatbot | ⚠️ Partial | F1 checks set membership, not ordering |
| Passes well-formed arguments | MCP | ❌ Not yet | Not validating argument schemas |
| Semantically correct arguments | MCP | ❌ Not yet | Not checking if `REF_AREA=KEN` matches "Kenya" |
| Hallucinated tools | Chatbot | ✅ | F1 penalizes tools called that aren't expected |
| Skipped tools | Chatbot | ✅ | F1 penalizes expected tools not called (recall) |
| Incorrect tool routing | Chatbot | ✅ | Routing checked (RESEARCH vs DIRECT) |

### 3. Response Quality & Grounding

| Requirement | Layer | Status | Implementation |
|---|---|---|---|
| Responses grounded in tool outputs | Chatbot | ✅ | **Claim Tag Rate** ensures data is tagged with tool-sourced claim IDs |
| Not free-form generation | Chatbot | ⚠️ Partial | Methodology case (F1=0.00) shows LLM answering from training data — detected but not prevented |
| Sensitivity to prompt phrasing | MCP+Chatbot | ❌ Not yet | No variant queries testing same intent with different phrasing |
| Sensitivity to tool/resource descriptions | MCP | ❌ Not yet | No tests varying MCP tool descriptions |
| Data accuracy | Chatbot | ✅ | **Data Accuracy** GEval metric |
| Response completeness | Chatbot | ✅ | **Response Completeness** GEval metric |

### 4. Prompt, Tool, and Resource Optimization

| Requirement | Layer | Status | Implementation |
|---|---|---|---|
| Iteratively refine tool descriptions | MCP | ❌ Not yet | Scorecard results _can inform_ refinements, but no automated loop |
| Iteratively refine resource metadata | MCP | ❌ Not yet | — |
| Iteratively refine system/tool prompts | Chatbot | ✅ | Scorecard identifies weak spots (methodology F1=0.00 → prompt fix needed) |
| Track improvements over time | Both | ✅ | JSON results saved with model name + timestamp for trend tracking |

### 5. Expected Outcomes

| Outcome | Status | Implementation |
|---|---|---|
| A reusable eval suite for MCP integrations | ✅ | `run_scorecard.py` is reusable, configurable via `--model`/`--judge` |
| Quantitative signals on robustness | ✅ | 9 metrics with 0.0-1.0 scores, aggregated Mean/Pass%/Min/Max |
| Quantitative signals on tool reliability | ⚠️ Partial | Tool Selection F1 measures LLM's tool _choices_, not MCP server reliability |
| Quantitative signals on prompt sensitivity | ❌ Not yet | No prompt-variant tests |
| Clear diagnostics to guide improvements | ✅ | Per-case scores pinpoint exact issues (methodology F1=0.00, chart non-determinism) |

### Summary

| Category | Chatbot | MCP Server |
|---|---|---|
| ✅ Implemented | Tool selection, grounding, quality metrics, scope guard, instruction following | — |
| ⚠️ Partial | Adversarial prompts, tool sequencing, grounding detection | — |
| ❌ Not yet | Ambiguity, underspecification, multi-turn, prompt sensitivity | Argument validation, tool descriptions, resource metadata, server reliability |


---

## Architecture

```
run_scorecard.py
├── Pipeline Phase
│   ├── pipeline_runner.py  →  LiteLLM (chatbot model)
│   └── pipeline_runner.py  →  MCP Server (tool calls)
├── DeepEval Phase
│   └── evaluate()  →  LLM Judge (scoring)
└── Custom Metrics Phase
    └── Deterministic checks (F1, regex, string match)
```

Each test case goes through:
1. **Pipeline** — full chatbot flow: routing → multi-turn tool calling (up to 5 turns) → response generation
2. **DeepEval** — 3 LLM-judge metrics score the response quality
3. **Custom** — 6 deterministic metrics check tool usage and instruction following

---

## Test Cases (11)

| ID | Query | Tests For | Prompt Reference |
|---|---|---|---|
| `sc_gdp_kenya` | What is the GDP of Kenya? | Data retrieval workflow | Steps 1-6 |
| `sc_unemployment_compare` | Compare unemployment rates in Kenya and Tanzania | Multi-country + codelist | Steps 1-6 |
| `sc_population_chart` | Show me a chart of China's population... | Chart generation | **L142**: MUST call `get_viz_spec` |
| `sc_methodology` | How is the poverty headcount ratio measured? | Metadata tool usage | **L139**: call `get_metadata` for methodology |
| `sc_claim_tags` | What is the life expectancy in Japan? | Claim tagging | **L160**: numbers must have `<claim>` tags |
| `sc_out_of_scope` | What is the best recipe for chocolate cake? | Scope guard | **L100**: refuse non-development topics |
| `sc_follow_ups` | What is the GDP per capita of Brazil? | Follow-up suggestions | **L265**: end with follow-up questions |
| `sc_greeting` | Hello, how are you? | Direct routing | Router: DIRECT for greetings |
| `sc_ambiguity` | Show me GDP data | Asks clarifying question | **L103**: clarify ambiguous queries |
| `sc_table_format` | Show me the GDP of the top 5 African economies | Table format | **L239**: 3+ values → table |
| `sc_comparability` | Compare the poverty rate and unemployment rate in India | Comparability warning | **L170**: warn different methodologies |

---

## Metrics (17 total)

### DeepEval (LLM Judge) — 3 metrics

| Metric | Threshold | What It Evaluates |
|---|---|---|
| **Answer Relevancy** | 0.5 | Response relevance to the query |
| **Data Accuracy** (GEval) | 0.5 | Specific numbers/facts vs vague statements |
| **Response Completeness** (GEval) | 0.5 | All aspects of query addressed |

### Custom (Deterministic) — 14 metrics

| Metric | Prompt Ref | What It Evaluates |
|---|---|---|
| **Tool Selection F1** | Steps 1-8 | Precision/recall on expected vs actual tools |
| **Entity Coverage** | L155 | Expected countries/indicators in output |
| **Chart Accuracy** | L142 | `get_viz_spec` called when chart requested |
| **Claim Tag Rate** | L160 | Numbers wrapped in `<claim>` tags |
| **Follow-up Present** | L265 | Suggested follow-ups at end |
| **Scope Guard** | L100 | Out-of-scope queries refused, no tools |
| **Sources Citation** | L243 | "Sources:" section with data providers |
| **Units & Time** | L240 | Units and time period included |
| **No Sci Notation** | L241 | Numbers not in scientific notation |
| **Latest Data Note** | L167/L242 | "latest available" phrasing when no year specified |
| **Viz URL Format** | L225 | Chart URL as markdown link `[text](url)` |
| **Table Format** | L239 | Markdown table for 3+ values |
| **Clarification** | L103 | Asks clarifying question for ambiguous queries |
| **Comparability Warning** | L170 | Warns about different methodologies |

---

## Baseline Results (gpt-5.1, 2026-02-26)

```
  Metric                        Mean   Pass%    Min    Max
  ─────────────────────────── ────── ─────── ────── ──────
  Answer Relevancy              0.83     91%   0.00   1.00
  Data Accuracy [GEval]         0.97    100%   0.80   1.00
  Response Completeness         0.92     91%   0.40   1.00
  Tool Selection F1             0.75     82%   0.00   1.00
  Entity Coverage               1.00    100%   1.00   1.00
  Chart Accuracy                1.00    100%   1.00   1.00
  Claim Tag Rate                1.00    100%   1.00   1.00
  Follow-up Present             0.91     91%   0.00   1.00
  Scope Guard                   1.00    100%   1.00   1.00
  Sources Citation              1.00    100%   1.00   1.00
  Units & Time                  1.00    100%   1.00   1.00
  No Sci Notation               1.00    100%   1.00   1.00
  Latest Data Note              1.00    100%   1.00   1.00
  Viz URL Format                1.00    100%   1.00   1.00
  Table Format                  0.91     91%   0.00   1.00
  Clarification                 1.00    100%   1.00   1.00
  Comparability Warning         1.00    100%   1.00   1.00
```

**Cost**: ~$0.30 per run (pipeline + judge) · **Runtime**: ~5 min

### Per-Case Results

| Test Case | Relevancy | Data Acc | Complete | Tool F1 | Sources | Table | Follow |
|---|---|---|---|---|---|---|---|
| GDP Kenya | 0.00 | 1.00 | 0.40 | **1.00** | ✅ | ✅ | ✅ |
| Unemployment KEN/TZA | 0.67 | 1.00 | 1.00 | 0.89 | ✅ | ✅ | ✅ |
| Population Chart | 0.81 | 1.00 | 1.00 | 0.57 | ✅ | ✅ | ✅ |
| Methodology | 0.89 | 1.00 | 1.00 | **0.00** ⚠️ | ✅ | ✅ | ❌ |
| Life Exp Japan | 1.00 | 0.80 | 0.90 | **1.00** | ✅ | ✅ | ✅ |
| Out of Scope | 0.87 | 1.00 | 1.00 | **1.00** | ✅ | ✅ | ✅ |
| GDP/Cap Brazil | 0.88 | 1.00 | 1.00 | **1.00** | ✅ | ✅ | ✅ |
| Greeting | 0.94 | 1.00 | 1.00 | **1.00** | ✅ | ✅ | ✅ |
| Ambiguity | 0.94 | 1.00 | 1.00 | 0.00 | ✅ | ✅ | ✅ |
| Table (Africa GDP) | 0.78 | 1.00 | 0.90 | 0.80 | ✅ | ✅ | ✅ |
| Comparability (India) | 0.97 | 0.90 | 0.90 | **1.00** | ✅ | ❌ | ✅ |

### Known Issues

| Issue | Metric | Score | Root Cause |
|---|---|---|---|
| **Methodology skips tools** | Tool F1 | 0.00 | LLM answers from training data instead of calling `search_indicators` → `get_metadata` |
| **Chart non-determinism** | Tool F1 | 0.57 | LLM calls extra tools (`get_data`, `get_metadata`, `get_data_api_url`) alongside `get_viz_spec` |
| **Ambiguity doesn't clarify** | Tool F1 | 0.00 | LLM calls `search_indicators` instead of asking a clarifying question |
| **Comparability no table** | Table Format | 0.00 | LLM uses bullets instead of markdown table for the comparison |
| **Methodology no follow-ups** | Follow-up Present | 0.00 | LLM skips follow-up section when answering from training data |

---

## Next Steps

### Prompt Engineering
1. **Fix methodology compliance** — Strengthen prompt L139: force `search_indicators` → `get_metadata` for methodology/definition questions
2. **Fix chart non-determinism** — Strengthen prompt L142: call `get_viz_spec` directly after `search_indicators` for chart requests

### Eval Suite Expansion
3. **Run model comparison** — Execute against `gpt-4o-mini`, `gemini/gemini-2.5-flash` to compare instruction-following
4. **Add test cases** — Multi-turn follow-ups, edge cases (no data available), disaggregation queries, different languages
5. **Fix relevancy for chart responses** — Custom metric or adjusted expected_output

### CI/CD Integration
6. **Automate** — Run scorecard on PR merges or prompt changes
7. **Regression tracking** — Compare JSON results across runs to detect score drops
8. **Expand instruction coverage** — Extract more testable rules from `prompts.py`

---

## JSON Output Format

Results are saved to `evals/.results/scorecard_{model}_{timestamp}.json`:

```json
{
  "timestamp": "2026-02-26T15:45:56",
  "model": "gpt-5.1",
  "judge_model": "gpt-5.1",
  "num_test_cases": 8,
  "metrics": {
    "Answer Relevancy": {"mean": 0.77, "pass_rate": 88, "min": 0.0, "max": 1.0, "scores": [...]},
    "Tool Selection F1": {"mean": 0.81, "pass_rate": 88, "min": 0.0, "max": 1.0, "scores": [...]}
  },
  "test_cases": [
    {
      "id": "sc_gdp_kenya",
      "input": "What is the GDP of Kenya?",
      "routing": "RESEARCH",
      "tools_called": ["data360_search_indicators", "data360_get_data", "data360_get_metadata"],
      "expected_tools": ["data360_search_indicators", "data360_get_data", "data360_get_metadata"],
      "output_length": 3460,
      "turns_used": 3,
      "error": null
    }
  ]
}
```
