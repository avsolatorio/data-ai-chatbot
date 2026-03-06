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

## Metrics

See [METRICS.md](METRICS.md) for the full list of metrics, pre-filter flags, thresholds, and how to add new ones.

In short: **conversational metrics** (ConversationalGEval) evaluate the whole conversation. **Per-turn metrics** (GEval) evaluate each assistant turn individually with pre-filtering to skip irrelevant turns, then aggregate via `min` or `mean`.

## Adding a New Persona

1. Create `evals/personas/<persona_key>.yaml`:
   ```yaml
   scenario: "Description of what this persona does"
   user_description: "Profile of the simulated user"
   expected_outcome: "What a good conversation looks like"
   ```
2. Run: `--persona <persona_key>`
