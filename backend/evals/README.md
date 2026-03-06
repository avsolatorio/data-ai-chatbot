# Evaluation Framework

Persona-based conversation evaluation for the Data360 chatbot using [DeepEval](https://deepeval.ai/).

## Quick Start

```bash
cd backend

# Replay a previous run (eval only, no MCP needed)
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --replay <TIMESTAMP> --persona student_learning_and_exploration

# New run against the pipeline (requires MCP server)
MCP_SERVER_URL=http://localhost:8021/mcp \
PYTHONPATH=. uv run python -m evals.run_conversation_eval --persona student_learning_and_exploration

# All personas
PYTHONPATH=. uv run python -m evals.run_conversation_eval --persona all

# HTTP mode (true E2E against running chatbot)
PYTHONPATH=. uv run python -m evals.run_conversation_eval --http --persona all

# Compare two runs
PYTHONPATH=. uv run python -m evals.compare_eval_runs <TIMESTAMP_A> <TIMESTAMP_B>

# Unit tests
PYTHONPATH=. uv run python -m pytest evals/test_tool_use_metrics.py -v
```

## File Layout

| File | Purpose |
|---|---|
| `run_conversation_eval.py` | Main entry point: simulation, evaluation, reporting |
| `per_turn_eval.py` | Per-turn context building, pre-filtering, GEval scoring |
| `metric_builder.py` | Metric construction from `eval_config.yaml` |
| `pipeline_runner.py` | In-process eval pipeline wrapper |
| `eval_config.yaml` | All metric definitions, thresholds, and rubrics |
| `compare_eval_runs.py` | Diff two evaluation runs |
| `dump_conversations.py` | Export conversations to markdown |
| `review_conversation.py` | Manual review tooling |
| `generate_personas.py` | Persona generation from templates |
| `generate_goldens.py` | Golden test case generation |
| `test_tool_use_metrics.py` | Unit tests for per-turn evaluation plumbing |

### Directories

| Directory | Purpose |
|---|---|
| `personas/` | YAML persona definitions (10 personas) |
| `conversations/` | Generated conversation markdown files |
| `.results/` | Evaluation result JSON files |
| `.cache/` | Cached conversation data |
| `_archive/` | Archived files and old runs |

## How Metrics Work

### Conversational Metrics (ConversationalGEval)

Evaluated across the entire conversation as a whole. Defined in `base_metrics` in `eval_config.yaml`.

Example: **Conversation Completeness** -- scores whether the chatbot addressed all user questions.

### Per-Turn Metrics (GEval)

Evaluated on each assistant turn individually, then aggregated to conversation-level.

Each per-turn metric has:
- **`requires`** -- pre-filter flag (e.g., `tool_data`, `tool_calls`, `routing`). If the turn doesn't match, the metric auto-scores 1.0 without calling the LLM judge.
- **`aggregates_to`** -- the conversation-level metric name it rolls up to.
- **`aggregation`** -- `min` (strictest) or `mean` (average).

### Pre-Filter Flags

| Flag | Triggers When |
|---|---|
| `tool_data` | Response contains tool output markers |
| `tool_calls` | Structured tool calls exist for this turn |
| `data_gap` | Response mentions missing/unavailable data |
| `comparison` | Multiple countries or time periods |
| `technical_terms` | Response uses GDP, HDI, etc. |
| `prior_context` | Turn index > 0 |
| `routing` | Always (every turn) |

## Adding a New Persona

1. Create `evals/personas/<persona_key>.yaml`:
   ```yaml
   scenario: "Description of what this persona does"
   user_description: "Profile of the simulated user"
   expected_outcome: "What a good conversation looks like"
   ```
2. Run: `--persona <persona_key>`

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
