# Evaluation Metrics

All metrics are defined in `eval_config.yaml`.

## Conversational Metrics

Evaluated across the full conversation using ConversationalGEval.

| Metric | Threshold |
|---|---|
| Conversation Completeness | 0.5 |

## Per-Turn Metrics

Evaluated per assistant turn, then aggregated to conversation-level.

### Core Metrics (no pre-filter required)

| Per-Turn Metric | Aggregates To | Agg Method | Threshold |
|---|---|---|---|
| Per-Turn Follow-up Suggestions | Follow-up Suggestions | mean | 0.5 |
| Per-Turn Source Citation | Source Citation | min | 0.5 |
| Per-Turn Data Formatting | Data Formatting | min | 0.5 |
| Per-Turn Inline Explanations | Inline Explanations | min | 0.5 |
| Per-Turn Progressive Disclosure | Progressive Disclosure | min | 0.5 |

### Requires: `tool_data`

Only scored when the turn contains tool output markers.

| Per-Turn Metric | Aggregates To | Agg Method | Threshold |
|---|---|---|---|
| Per-Turn Data Accuracy | Data Accuracy | min | 0.5 |
| Per-Turn Claim Consistency | Claim Tagging & PCN | min | 0.5 |
| Per-Turn Latest Data Note | Latest Data Note | min | 0.5 |
| Per-Turn Content Structure | Content Structure | mean | 0.5 |

### Requires: `tool_calls`

Only scored when structured tool calls exist for the turn.

| Per-Turn Metric | Aggregates To | Agg Method | Threshold |
|---|---|---|---|
| Per-Turn Tool Selection | Tool Selection | mean | 0.5 |
| Per-Turn Tool Sequencing | Tool Sequencing | min | 0.5 |
| Per-Turn Argument Quality | Argument Quality | min | 0.5 |
| Per-Turn Visualization & API URLs | Visualization & API URLs | min | 0.5 |

**Visualization & API URLs** includes programmatic verification: when a user asks for a chart, the system checks if `get_viz_spec` was called and the returned URL appears in the response. The LLM judge uses these signals (`Viz URL In Response: VERIFIED/MISSING`) rather than judging URL validity itself.

### Requires: `data_gap`

Only scored when the response mentions missing/unavailable data.

| Per-Turn Metric | Aggregates To | Agg Method | Threshold |
|---|---|---|---|
| Per-Turn Data Gap Handling | Data Gap Handling | min | 0.5 |

### Requires: `comparison`

Only scored when multiple countries or time periods are present.

| Per-Turn Metric | Aggregates To | Agg Method | Threshold |
|---|---|---|---|
| Per-Turn Comparability Warnings | Comparability Warnings | min | 0.5 |

### Requires: `prior_context`

Only scored on turns after the first (turn index > 0).

| Per-Turn Metric | Aggregates To | Agg Method | Threshold |
|---|---|---|---|
| Per-Turn Context Retention | Context Retention | min | 0.5 |

### Requires: `routing`

Scored on every turn (always applicable).

| Per-Turn Metric | Aggregates To | Agg Method | Threshold |
|---|---|---|---|
| Per-Turn Routing Correctness | Routing Correctness | min | 0.5 |

## Edge-Case Metrics

Persona-specific metrics defined in `edge_case_metrics` in eval_config.yaml. Applied in addition to the metrics above.

## Adding a New Metric

### Per-Turn Metric

Add to `per_turn_metrics` in `eval_config.yaml`:
```yaml
- name: "Per-Turn My Metric"
  type: "geval"
  threshold: 0.5
  requires: "tool_data"           # pre-filter flag
  aggregates_to: "My Metric"      # conversation-level name
  aggregation: "min"              # or "mean"
  criteria: >
    Your evaluation criteria here.
  evaluation_steps:
    - "Step 1"
    - "Step 2"
  rubric:
    - score_range: [8, 10]
      expected_outcome: "Good behavior"
    - score_range: [0, 3]
      expected_outcome: "Bad behavior"
```

### Conversational Metric

Add to `base_metrics` in `eval_config.yaml`:
```yaml
- name: "My Conversational Metric"
  type: "geval"
  threshold: 0.5
  criteria: >
    Criteria evaluated across the whole conversation.
  evaluation_steps:
    - "Step 1"
```
