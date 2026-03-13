# Evaluation Framework

Automated quality assessment for the Data360 chatbot using persona-based conversation simulations.

The framework simulates realistic multi-turn conversations between predefined user personas and the chatbot, then scores each conversation against a rubric of 17+ metrics. It answers the question: **"Is the chatbot behaving correctly for real users?"**

Built on [DeepEval](https://deepeval.ai/) with LLM-as-judge scoring (default: `gpt-4.1-mini`).

## What It Does

1. **Simulates conversations** -- a persona (e.g., a student asking about literacy rates) chats with the chatbot over 2-5 turns
2. **Records everything** -- each turn captures the full pipeline trace: routing intent, planner reasoning, tool calls, tool outputs, and the assembled response
3. **Scores the conversation** -- an LLM judge evaluates each turn against metrics defined in `eval_config.yaml`
4. **Reports results** -- JSON results, per-persona markdown transcripts, and a pass/fail summary

## How Metrics Work

There are two tiers of evaluation:

| Level | Scope | Example |
|---|---|---|
| **Conversational** | Evaluated across the full conversation | _Conversation Completeness_ -- did the chatbot address all of the persona's goals? |
| **Per-turn** | Scored on each assistant turn individually, then aggregated | _Data Accuracy_ -- are the numbers in this turn consistent with the tool output? |

Per-turn metrics use **pre-filtering**: irrelevant metrics are automatically skipped. For example, _Tool Selection_ is only scored on turns where tool calls were made. This avoids false failures and reduces LLM judge costs.

Aggregation methods:
- **min** -- the conversation score is the _worst_ per-turn score (strict: one bad turn fails the metric)
- **mean** -- the conversation score is the _average_ across turns (lenient)

See [METRICS.md](METRICS.md) for the full list with descriptions.

## Quick Start

```bash
cd backend

# HTTP mode -- true E2E against the running chatbot (recommended)
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona student_learning_and_exploration

# All personas, simulation only (no scoring)
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona all --no-eval

# Replay a previous run (re-score without re-simulating)
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --replay <TIMESTAMP> --persona all

# Compare two runs side-by-side
PYTHONPATH=. uv run python -m evals.compare_eval_runs <TIMESTAMP_A> <TIMESTAMP_B>
```

For full setup instructions (Docker, MCP, VPN, SSL), see [E2E_GUIDE.md](E2E_GUIDE.md).

## Typical Workflow

```
1. Start the stack         docker compose up -d && ./run_server.sh (MCP)
2. Run a quick test        --http --persona <name> --turns 2 --no-eval
3. Run a full eval         --http --persona all
4. Review results          open evals/conversations/<persona>.md
5. Compare with baseline   compare_eval_runs.py <old_ts> <new_ts>
6. Tweak prompts/rubrics   edit eval_config.yaml or system prompts
7. Re-run and compare      repeat from step 3
```

## CLI Reference

```
PYTHONPATH=. uv run python -m evals.run_conversation_eval [OPTIONS]
```

| Flag | Default | Description |
|---|---|---|
| `--http` | off | Run against the live chatbot (E2E). Without this, runs in-process. |
| `--persona <name>` | `all` | Which flat persona to simulate. Use `all` for all personas. |
| `--turns <N>` | 5 | Maximum user-assistant turn cycles per persona. |
| `--no-eval` | off | Simulate conversations but skip scoring. |
| `--runs <N>` | 1 | Repeat each persona N times (reports mean +/- std). |
| `--replay <TS>` | -- | Re-score a previous run without re-simulating. |
| `--config <path>` | `eval_config.yaml` | Path to an alternate config file. |
| `--goldens-file <path>` | -- | Use pre-generated golden test cases instead of personas. |
| `--output-dir <path>` | `conversations/` | Custom output directory for markdown transcripts. |
| `--compose BASE:TOPIC:COUNTRIES:PATTERN` | -- | Compose a persona from facets (see [PERSONAS.md](PERSONAS.md)). |
| `--compose-random BASE` | -- | Random facets per run. Use with `--runs N` for variation. |
| `--list-facets` | -- | Print available bases and facets, then exit. |

## File Layout

| File | Purpose |
|---|---|
| `run_conversation_eval.py` | Main entry point: simulation, evaluation, reporting |
| `per_turn_eval.py` | Per-turn context building, pre-filtering, GEval scoring |
| `metric_builder.py` | Metric construction from `eval_config.yaml` |
| `pipeline_runner.py` | In-process eval pipeline wrapper |
| `eval_config.yaml` | All metric definitions, thresholds, and rubrics |
| `compare_eval_runs.py` | Diff two evaluation runs |
| `review_conversation.py` | LLM-powered manual review of conversations |
| `generate_personas.py` | Persona generation from templates or descriptions |
| `generate_goldens.py` | Golden test case generation from documents |
| `test_tool_use_metrics.py` | Unit tests for per-turn evaluation plumbing |

### Directories

| Directory | Contents |
|---|---|
| `personas/` | Flat YAML persona definitions (10 personas) |
| `personas/bases/` | Composable base profiles (6 archetypes) |
| `personas/facets/` | Composable facets: topics (10), countries (5), patterns (8) |
| `docs/` | Planning docs (MVP features, user stories, findings) |
| `conversations/` | Generated conversation markdown files |
| `.results/` | Evaluation result JSON files |

## Adding a New Persona

Create `evals/personas/<persona_key>.yaml`:

```yaml
scenario: >
  A university student asks about literacy rates in Ethiopia and Kenya.
  They want plain-language explanations, a comparison table, and a chart.

user_description: >
  Lina is a 21-year-old undergraduate with basic data literacy. She asks
  one question at a time and values stepwise explanations.

expected_outcome: >
  ALL of the following must be achieved before the conversation is complete:
  (1) Provide latest literacy rates with claim tags and sources.
  (2) Explain 'literacy rate' in plain language.
  (3) Show a comparison table.
  (4) Generate a bar chart.
  (5) Suggest related indicators for further study.
```

Then run: `--persona <persona_key>`

## Adding a New Metric

See the [Adding a New Metric](METRICS.md#adding-a-new-metric) section in METRICS.md.

## Related Docs

- [PERSONAS.md](PERSONAS.md) -- composable persona system, E2E run playbook
- [METRICS.md](METRICS.md) -- full metric catalog with descriptions
- [E2E_GUIDE.md](E2E_GUIDE.md) -- setup, architecture, VPN, and preflight details
- [.env.example](.env.example) -- environment variable template
