# Evaluation Metrics Reference

> Architecture: **1 conversation-level** + **12 per-turn** metrics with intent-based pre-filtering.

---

## Conversation-Level Metric

| Metric | Type | Threshold | Why Conversation-Level |
|--------|------|-----------|----------------------|
| **Conversation Completeness** | GEval | 0.5 | Needs holistic view of ALL user intentions across turns |

---

## Per-Turn Metrics

Each per-turn metric is evaluated on individual assistant turns. Inapplicable metrics are **auto-scored 1.0** (zero judge calls). Scores aggregate to conversation-level via `min` or `mean`.

### Data Trust

| Metric | Requires | Aggregates To | Agg | Threshold |
|--------|----------|---------------|-----|-----------|
| Per-Turn Data Accuracy | `tool_data` | Data Accuracy | min | 0.8 |
| Per-Turn Claim Consistency | `tool_data` | Claim Tagging & PCN | min | 0.8 |

### Context & Retention

| Metric | Requires | Aggregates To | Agg | Threshold |
|--------|----------|---------------|-----|-----------|
| Per-Turn Context Retention | `prior_context` | Context Retention | min | 0.6 |

Checks: indicator/database ID reuse, **claim_id reuse** (data provenance), assertion consistency ("data not available" must be maintained).

### Data Gap Handling

| Metric | Requires | Aggregates To | Agg | Threshold |
|--------|----------|---------------|-----|-----------|
| Per-Turn Data Gap Handling | `data_gap` | Data Gap Handling | min | 0.5 |

### Comparability

| Metric | Requires | Aggregates To | Agg | Threshold |
|--------|----------|---------------|-----|-----------|
| Per-Turn Comparability Warnings | `comparison` | Comparability Warnings | min | 0.4 |

### Response Quality

| Metric | Requires | Aggregates To | Agg | Threshold |
|--------|----------|---------------|-----|-----------|
| Per-Turn Content Structure | `tool_data` | Content Structure | min | 0.4 |
| Per-Turn Follow-up Suggestions | `tool_data` | Follow-up Suggestions | min | 0.4 |
| Per-Turn Latest Data Note | `tool_data` | Latest Data Note | min | 0.4 |
| Per-Turn Source Citation | `tool_data` | Source Citation | min | 0.6 |
| Per-Turn Data Formatting | `tool_data` | Data Formatting | min | 0.4 |

### Accessibility & Learning

| Metric | Requires | Aggregates To | Agg | Threshold |
|--------|----------|---------------|-----|-----------|
| Per-Turn Inline Explanations | `technical_terms` | Inline Explanations | mean | 0.4 |
| Per-Turn Progressive Disclosure | `tool_data` | Progressive Disclosure | mean | 0.4 |

---

## Pre-Filtering Logic

The `requires` field determines when a metric is evaluated:

| `requires` value | Context flag checked | Skipped when... |
|-----------------|---------------------|-----------------|
| `tool_data` | `has_tool_data` | Turn has no tool-retrieved data |
| `data_gap` | `has_data_gap` | Turn has no data unavailability |
| `comparison` | `has_comparison` | No cross-country/time comparison |
| `technical_terms` | `has_technical_terms` | No technical terms/acronyms |
| `prior_context` | `turn_idx > 0` | First turn (nothing to retain) |

### Example Pre-Filter Results

| Turn Type | Metrics Selected | Savings |
|-----------|-----------------|---------|
| Greeting (turn 0, no data) | 0 | 12 skipped |
| Data + comparison (turn 1) | 11 | 1 skipped |
| Data gap (turn 2) | 10 | 2 skipped |
| Follow-up, no data (turn 3) | 1 | 11 skipped |

---

## Aggregation

Per-turn scores roll up to conversation-level via:
- **`min`** — strictest turn wins (Data Accuracy, Claim Consistency, etc.)
- **`mean`** — average quality (Inline Explanations, Progressive Disclosure)

---

## Removed Metrics

| Metric | Reason |
|--------|--------|
| Turn Faithfulness (built-in) | Redundant with Per-Turn Data Accuracy |
| Turn Relevancy (built-in) | Redundant with Conversation Completeness |
