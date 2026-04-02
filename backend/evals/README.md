# Evaluation Framework

Automated quality assessment for the Data360 chatbot using persona-based conversation simulations.

The framework simulates realistic multi-turn conversations between predefined user personas and the chatbot, then scores each conversation against a rubric of 17+ metrics. It answers the question: **"Is the chatbot behaving correctly for real users?"**

Built on [DeepEval](https://deepeval.ai/) with LLM-as-judge scoring (default: `gpt-4.1-mini`).

## What It Does

1. **Simulates conversations** -- a persona (e.g., a student asking about literacy rates) chats with the chatbot over 2-5 turns
2. **Records everything** -- each turn captures the full pipeline trace: routing intent, planner reasoning, tool calls, tool outputs, and the assembled response
3. **Scores the conversation** -- an LLM judge evaluates each turn against metrics defined in `eval_config.yaml`
4. **Reports results** -- JSON results, per-persona markdown transcripts, and a pass/fail summary

## Quick Start

All commands assume you are in the `backend/` directory:

```bash
cd backend
```

### 1. Generate a persona

```bash
# From a text description
PYTHONPATH=. uv run python -m evals generate \
  --describe "A journalist asking about trade data in West Africa"

# From product documents
PYTHONPATH=. uv run python -m evals generate \
  --from-docs evals/docs/mvp/mvp_features.md
```

### 2. Generate a suite

```bash
# See available facets
PYTHONPATH=. uv run python -m evals suite --list-facets

# Random 20 combinations
PYTHONPATH=. uv run python -m evals suite --sample 20

# All combinations for one base
PYTHONPATH=. uv run python -m evals suite --base student

# Adversarial patterns only
PYTHONPATH=. uv run python -m evals suite --adversarial-only --sample 10

# Full combinatorial (2,400 entries)
PYTHONPATH=. uv run python -m evals suite --full
```

### 3. Run a single conversation

```bash
# Flat persona (HTTP mode, true E2E)
PYTHONPATH=. uv run python -m evals run \
  --http --persona student_learning_and_exploration

# Composed persona
PYTHONPATH=. uv run python -m evals run \
  --compose student:health_outcomes:south_asia:visualize --http

# Simulation only (no scoring)
PYTHONPATH=. uv run python -m evals run \
  --http --persona all --no-eval

# Replay a previous run (re-score without re-simulating)
PYTHONPATH=. uv run python -m evals run \
  --replay <TIMESTAMP> --persona all
```

### 4. Run a batch

```bash
# Run the default suite
PYTHONPATH=. uv run python -m evals batch --http

# Resume an interrupted batch
PYTHONPATH=. uv run python -m evals batch --http --resume

# Use a custom suite file
PYTHONPATH=. uv run python -m evals batch --suite my_suite.yaml --http
```

### 5. Compare runs

```bash
PYTHONPATH=. uv run python -m evals compare <TIMESTAMP_A> <TIMESTAMP_B>
```

For full setup instructions (Docker, MCP, VPN, SSL), see [E2E_GUIDE.md](E2E_GUIDE.md).

## Typical Workflow

```
1. Start the stack         docker compose up -d && ./run_server.sh (MCP)
2. Generate a persona      python -m evals generate --describe "..."
3. Run a quick test        python -m evals run --http --persona <name> --turns 2 --no-eval
4. Run a full eval         python -m evals run --http --persona all
5. Compare with baseline   python -m evals compare <old_ts> <new_ts>
6. Tweak prompts/rubrics   edit eval_config.yaml or system prompts
7. Scale up                python -m evals suite --sample 50 && python -m evals batch --http
```

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

See [eval_config.yaml](eval_config.yaml) for the full metric definitions and rubrics.

## CLI Reference

```
PYTHONPATH=. uv run python -m evals <command> [options]
```

| Command | Description |
|---|---|
| `run` | Simulate and score a single conversation |
| `batch` | Run a batch of personas from a suite file |
| `generate` | Generate persona YAML files |
| `suite` | Generate a suite.yaml from available facets |
| `compare` | Compare two evaluation runs |

Run `python -m evals <command> --help` for command-specific options.

### `run` options

| Flag | Default | Description |
|---|---|---|
| `--http` | off | Run against the live chatbot (E2E). Without this, runs in-process. |
| `--persona <name>` | `all` | Which flat persona to simulate. Use `all` for all personas. |
| `--turns <N>` | 5 | Maximum user-assistant turn cycles per persona. |
| `--no-eval` | off | Simulate conversations but skip scoring. |
| `--runs <N>` | 1 | Repeat each persona N times (reports mean +/- std). |
| `--replay <TS>` | -- | Re-score a previous run without re-simulating. |
| `--config <path>` | `eval_config.yaml` | Path to an alternate config file. |
| `--compose BASE:TOPIC:COUNTRIES:PATTERN` | -- | Compose a persona from facets. |
| `--compose-random BASE` | -- | Random facets per run. Use with `--runs N`. |

### `suite` options

| Flag | Default | Description |
|---|---|---|
| `--full` | off | Generate all composed combinations. |
| `--sample <N>` | -- | Random N combinations. |
| `--base <name>` | -- | Filter by base (e.g. `student`). |
| `--adversarial-only` | off | Only adversarial patterns. |
| `--include-flat` | off | Include flat personas in the suite. |
| `--runs <N>` | 1 | Runs per persona in the generated suite. |
| `--output <path>` | `suite.yaml` | Output file path. |
| `--list-facets` | off | Print available facets and exit. |

## File Layout

| File | Purpose |
|---|---|
| `__main__.py` | Unified CLI entry point |
| `run_conversation_eval.py` | Simulation, evaluation, and reporting engine |
| `per_turn_eval.py` | Per-turn context building, pre-filtering, GEval scoring |
| `metric_builder.py` | Metric construction from `eval_config.yaml` |
| `pipeline_runner.py` | In-process eval pipeline wrapper |
| `persona_composer.py` | Composable persona assembly from YAML facets |
| `eval_config.yaml` | All metric definitions, thresholds, and rubrics |
| `suite.yaml` | Default batch suite configuration |
| `run_regression.py` | Batch runner with retry and checkpoint support |
| `compare_eval_runs.py` | Diff two evaluation runs |
| `generate_personas.py` | Persona generation from templates or descriptions |
| `generate_goldens.py` | Golden test case generation from documents |
| `test_persona_composer.py` | Unit tests for the persona composer |
| `test_tool_use_metrics.py` | Unit tests for per-turn evaluation plumbing |

### Directories

| Directory | Contents |
|---|---|
| `personas/` | Flat YAML persona definitions (10 personas) |
| `personas/bases/` | Composable base profiles (6 archetypes) |
| `personas/facets/` | Composable facets: topics (10), countries (5), patterns (8) |
| `docs/findings/` | Evaluation findings and technical implementation reference |
| `docs/mvp/` | MVP feature specification and user stories |
| `conversations/` | Generated conversation markdown files |
| `.results/` | Evaluation result JSON files |

## Adding a New Persona

```bash
# Quick: generate from a description
PYTHONPATH=. uv run python -m evals generate \
  --describe "A blind user using a screen reader who wants poverty data"
```

Or create `evals/personas/<persona_key>.yaml` manually:

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

Then run: `python -m evals run --persona <persona_key> --http`

## Adding a New Metric

See [Adding or Modifying a Metric](docs/findings/DEEPEVAL_IMPLEMENTATION.md#13-adding-or-modifying-a-metric) in the implementation reference.

## Related Docs

- [PERSONAS.md](PERSONAS.md) -- composable persona system and facet architecture
- [E2E_GUIDE.md](E2E_GUIDE.md) -- setup, architecture, VPN, and preflight details
- [DEEPEVAL_IMPLEMENTATION.md](docs/findings/DEEPEVAL_IMPLEMENTATION.md) -- technical implementation reference
- [CONSOLIDATED_FINDING.md](docs/findings/CONSOLIDATED_FINDING.md) -- evaluation findings and recommendations
- [.env.example](.env.example) -- environment variable template
