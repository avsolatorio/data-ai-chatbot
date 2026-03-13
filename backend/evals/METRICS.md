# Evaluation Metrics

All metrics are defined in [`eval_config.yaml`](eval_config.yaml). This document explains what each one measures and why.

---

## How Scoring Works

Each metric produces a score from **0.0 to 1.0**. A score at or above the **threshold** is a pass.

- **Conversational metrics** are scored once across the entire conversation
- **Per-turn metrics** are scored on each assistant turn individually, then aggregated to conversation-level using `min` (strictest turn wins) or `mean` (average)
- **Pre-filtering** automatically skips metrics that don't apply to a given turn (e.g., *Tool Selection* is skipped on turns where no tools were called). Skipped metrics auto-score 1.0 and don't count toward aggregation.

### Threshold Tiers

| Tier | Threshold | Rationale |
|------|-----------|-----------|
| **Strict** | 0.8 | Hard accuracy requirements -- wrong numbers or missing claim tags are serious errors |
| **Medium** | 0.5--0.6 | Core functionality -- tool use, context retention, routing, source citation |
| **Lenient** | 0.4 | Quality and polish -- structure, formatting, follow-ups, disclosure |

### Pre-Filter Flags

A metric's `requires` field determines when it applies to a turn:

| Flag | Turn qualifies when... |
|------|------------------------|
| *(none)* | Always evaluated |
| `tool_data` | Response contains data from MCP tools (`<claim>` tags or data markers) |
| `claim_data` | Response contains `<claim>` tags specifically |
| `presented_data` | Response has numeric data (claim tags or numbers in markdown tables) |
| `tool_calls` | Structured tool call trace exists for this turn |
| `data_gap` | Response mentions missing or unavailable data |
| `comparison` | Response contains multi-country or multi-year data |
| `technical_terms` | Response contains technical terms (GDP, PPP, per capita, etc.) |
| `prior_context` | Turn index > 0 (not the first turn) |
| `routing` | Always evaluated (routing is available on every turn) |

### Deliverable Detection

Metrics with `skip_on_deliverable: true` are automatically skipped when the user requests a specific output format (bullet points, slide decks, summaries, drafts, etc.). Deliverable turns correctly omit structural elements like section labels and follow-up suggestions, so penalizing their absence would be a false failure.

**Affected metrics:** Content Structure, Follow-up Suggestions, Data Formatting.

---

## Conversational Metrics

Evaluated across the full conversation using ConversationalGEval.

| Metric | What It Measures | Threshold |
|--------|------------------|-----------|
| **Conversation Completeness** | Did the chatbot address all user intentions? Classifies each as MET, PARTIALLY MET (data unavailable but handled gracefully), or UNMET. | 0.5 |

---

## Per-Turn Metrics

Scored on each assistant turn, then aggregated. Grouped by pre-filter requirement.

### Data Trust (Strict Tier, threshold 0.8)

| Metric | Pre-filter | Agg | What It Measures |
|--------|------------|-----|------------------|
| **Data Accuracy** | `tool_data` | min | Numbers match correct country/year from tool output. No fabrication. |
| **Claim Tagging & PCN** | `claim_data` | min | All tool-retrieved values wrapped in `<claim>` tags with correct IDs. |

### Core Functionality (Medium Tier, threshold 0.5--0.6)

| Metric | Pre-filter | Agg | Threshold | What It Measures |
|--------|------------|-----|-----------|------------------|
| **Context Retention** | `prior_context` | min | 0.6 | Reuses indicator/database IDs and claim_ids from prior turns. |
| **Source Citation** | `tool_calls` | min | 0.6 | Ends with `Sources:` section citing database, indicator, methodology. |
| **Data Gap Handling** | `data_gap` | min | 0.5 | Explicitly states what's missing, suggests alternatives. |
| **Tool Selection** | `tool_calls` | mean | 0.5 | Correct tools called for the query (no hallucinated or missing tools). |
| **Tool Sequencing** | `tool_calls` | min | 0.5 | Tools called in logical order (search before data, codelist before data). |
| **Argument Quality** | `tool_calls` | min | 0.5 | Valid ISO codes, correct indicator IDs, specific search queries. |
| **Routing Correctness** | `routing` | min | 0.5 | Router correctly classified RESEARCH vs. DIRECT intent. |
| **Visualization & API URLs** | `tool_calls` | min | 0.5 | `get_viz_spec` called for chart requests, URL appears in response. |

### Quality & Polish (Lenient Tier, threshold 0.4)

| Metric | Pre-filter | Agg | Deliverable-skip | What It Measures |
|--------|------------|-----|------------------|------------------|
| **Content Structure** | `tool_data` | mean | yes | Uses `Data:`, `Analysis:`, `Note:`, `Limitations:` labels. |
| **Follow-up Suggestions** | `tool_data` | min | yes | Ends with `Suggested follow-ups:` section (user-phrased). |
| **Data Formatting** | `tool_data` | min | yes | Units on numbers, markdown tables for 3+ values, no sci notation. |
| **Latest Data Note** | `tool_data` | min | -- | Notes "latest available data" when user didn't specify a year. |
| **Comparability Warnings** | `comparison` | min | -- | Flags year/methodology differences in cross-country comparisons. |
| **Inline Explanations** | `technical_terms` | mean | -- | Technical terms explained in plain language on first use. |
| **Progressive Disclosure** | `tool_data` | mean | -- | Leads with insight before details, doesn't dump data. |

---

## Adding a New Metric

### Per-Turn Metric

Add to `per_turn_metrics` in `eval_config.yaml`:

```yaml
- name: "Per-Turn My Metric"
  type: "geval"
  threshold: 0.5
  requires: "tool_data"           # pre-filter flag (see table above)
  aggregates_to: "My Metric"      # conversation-level display name
  aggregation: "min"              # "min" (strict) or "mean" (lenient)
  skip_on_deliverable: false      # set true if metric doesn't apply to deliverables
  criteria: >
    Evaluate whether the assistant [does something specific].
    Consider [specific aspects to check].
  evaluation_steps:
    - "Check if [condition 1]"
    - "Check if [condition 2]"
  rubric:
    - score_range: [8, 10]
      expected_outcome: "All conditions are met perfectly"
    - score_range: [5, 7]
      expected_outcome: "Most conditions are met with minor issues"
    - score_range: [0, 4]
      expected_outcome: "Multiple conditions are not met"
```

### Conversational Metric

Add to `base_metrics` in `eval_config.yaml`:

```yaml
- name: "My Conversational Metric"
  type: "geval"
  threshold: 0.5
  criteria: >
    Evaluate the full conversation for [quality aspect].
  evaluation_steps:
    - "Step 1"
    - "Step 2"
```
