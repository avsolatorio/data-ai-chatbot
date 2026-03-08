# Evaluation Metrics

All metrics are defined in [`eval_config.yaml`](eval_config.yaml). This document explains what each one measures and why.

---

## How Scoring Works

Each metric produces a score from **0.0 to 1.0**. A score at or above the **threshold** (0.5 for all metrics) is a pass.

- **Conversational metrics** are scored once across the entire conversation
- **Per-turn metrics** are scored on each assistant turn individually, then aggregated to conversation-level using `min` (strictest turn wins) or `mean` (average)
- **Pre-filtering** automatically skips metrics that don't apply to a given turn (e.g., _Tool Selection_ is skipped on turns where no tools were called)

---

## Conversational Metrics

Evaluated across the full conversation using ConversationalGEval.

| Metric | What It Measures | Threshold |
|---|---|---|
| **Conversation Completeness** | Did the chatbot address all of the persona's goals by the end of the conversation? Checks against the `expected_outcome` defined in the persona YAML. | 0.5 |

---

## Per-Turn Metrics

Scored on each assistant turn, then aggregated. Grouped by their pre-filter requirement.

### Always Evaluated (no pre-filter)

These metrics apply to every assistant turn.

| Metric | What It Measures | Agg | Threshold |
|---|---|---|---|
| **Follow-up Suggestions** | Does the assistant suggest relevant next questions or related indicators for the user to explore? | mean | 0.5 |
| **Source Citation** | Does the assistant cite the data source (database name, indicator ID) when presenting data? | min | 0.5 |
| **Data Formatting** | Is data presented in structured formats (tables, lists, labeled sections) rather than buried in prose? | min | 0.5 |
| **Inline Explanations** | Does the assistant explain technical terms (e.g., "GDP per capita", "literacy rate") in plain language? | min | 0.5 |
| **Progressive Disclosure** | Does the assistant present information in digestible chunks rather than dumping everything at once? | min | 0.5 |

### Requires: `tool_data`

Only scored when the turn contains data retrieved from MCP tools (detected by claim tags or data markers in the response).

| Metric | What It Measures | Agg | Threshold |
|---|---|---|---|
| **Data Accuracy** | Are the numbers in the response consistent with what the tools actually returned? Catches hallucinated or garbled values. | min | 0.5 |
| **Claim Tagging & PCN** | Are all data values wrapped in `<claim>` tags with valid `id` and `policy` attributes for provenance tracking? | min | 0.5 |
| **Latest Data Note** | When no specific year was requested, does the response include a "(using latest available data)" note? Conversely, it should not add this note when the user did specify a year. | min | 0.5 |
| **Content Structure** | Is the response organized with clear labels (Data, Analysis, Note, Limitations, Sources) rather than unstructured prose? | mean | 0.5 |

### Requires: `tool_calls`

Only scored when structured tool call data exists for the turn (the pipeline traced which MCP tools were called and with what arguments).

| Metric | What It Measures | Agg | Threshold |
|---|---|---|---|
| **Tool Selection** | Did the chatbot call the right tools for this query? E.g., using `search_indicators` before `get_data`, using `find_codelist_value` for country codes. | mean | 0.5 |
| **Tool Sequencing** | Were tools called in the correct order? The expected pattern is: search -> codelist -> get_data -> get_viz_spec (not all steps are always needed). | min | 0.5 |
| **Argument Quality** | Were tool arguments correct? Checks for proper ISO country codes (not raw names), valid indicator IDs from search results, and reasonable filter values. | min | 0.5 |
| **Visualization & API URLs** | When the user asked for a chart, did the chatbot call `get_viz_spec` and include the returned URL in the response? Includes programmatic verification (not just LLM judgment). | min | 0.5 |

### Requires: `data_gap`

Only scored when the response mentions missing or unavailable data.

| Metric | What It Measures | Agg | Threshold |
|---|---|---|---|
| **Data Gap Handling** | When data is unavailable, does the chatbot acknowledge it transparently, suggest alternatives (nearby years, similar indicators, different countries), and avoid guessing? | min | 0.5 |

### Requires: `comparison`

Only scored when multiple countries or time periods are present in the response.

| Metric | What It Measures | Agg | Threshold |
|---|---|---|---|
| **Comparability Warnings** | When comparing data across countries or years, does the chatbot note potential comparability issues (different methodologies, different survey years, PPP vs. nominal)? | min | 0.5 |

### Requires: `prior_context`

Only scored on turns after the first (turn index > 0).

| Metric | What It Measures | Agg | Threshold |
|---|---|---|---|
| **Context Retention** | Does the chatbot remember and reuse data from earlier turns rather than re-searching for information it already has? | min | 0.5 |

### Requires: `routing`

Scored on every turn (always applicable).

| Metric | What It Measures | Agg | Threshold |
|---|---|---|---|
| **Routing Correctness** | Did the internal router classify the query correctly (RESEARCH vs. FOLLOWUP vs. CLARIFY)? Misrouting can cause the chatbot to skip tool calls or ignore conversation history. | min | 0.5 |

---

## Edge-Case Metrics

Persona-specific metrics defined in the `edge_case_metrics` section of `eval_config.yaml`. These are applied only to matching personas, in addition to the standard metrics above.

Example: an adversarial persona might have a _Scope Guard_ metric that checks whether the chatbot correctly refuses out-of-scope requests.

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

### Pre-Filter Flags

Available `requires` values and when a turn qualifies:

| Flag | Turn qualifies when... |
|---|---|
| _(none)_ | Always evaluated |
| `tool_data` | Response contains data from MCP tools (claim tags or data markers) |
| `tool_calls` | Structured tool call trace exists for this turn |
| `data_gap` | Response mentions missing or unavailable data |
| `comparison` | Response contains multi-country or multi-year data |
| `prior_context` | Turn index > 0 (not the first turn) |
| `routing` | Always evaluated (routing is available for every turn) |
