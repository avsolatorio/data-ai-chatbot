# DeepEval Implementation Reference

**Document type:** Technical Reference  
**Audience:** Anyone working on or extending the evaluation framework  
**Related files:** `eval_config.yaml`, `per_turn_eval.py`, `metric_builder.py`, `run_conversation_eval.py`

---

## Table of Contents

### Part 1: The Gist
- [What This Framework Does](#what-this-framework-does)
- [How a Single Evaluation Run Works](#how-a-single-evaluation-run-works)
- [What the Scores Mean](#what-the-scores-mean)
- [Key Concepts in Plain Language](#key-concepts-in-plain-language)

### Part 2: Technical Reference
1. [Overview](#1-overview)
2. [Metric Tiers: Conversation-Level vs. Per-Turn](#2-metric-tiers-conversation-level-vs-per-turn)
3. [Pre-filtering Engine](#3-pre-filtering-engine)
4. [Context Construction](#4-context-construction)
5. [Aggregation Mechanics](#5-aggregation-mechanics)
6. [TurnData: The Trace Object](#6-turndata-the-trace-object)
7. [ConversationSimulator and _GuardedSimulator](#7-conversationsimulator-and-_guardedsimulator)
8. [HTTP Mode: SSE Stream Parsing](#8-http-mode-sse-stream-parsing)
9. [Multi-Run Mode and Composed Personas](#9-multi-run-mode-and-composed-personas)
10. [Hyperparameter Tracking and Config Resolution](#10-hyperparameter-tracking-and-config-resolution)
11. [Preflight Checks](#11-preflight-checks)
12. [Replay Mechanism](#12-replay-mechanism)
13. [Adding or Modifying a Metric](#13-adding-or-modifying-a-metric)
14. [Output File Structure](#14-output-file-structure)

---

## Part 1: The Gist

### What This Framework Does

This framework automatically tests how well the Data360 chatbot handles real-world user conversations. Instead of writing hand-crafted test cases, it:

1. **Simulates a realistic user** — a virtual persona (e.g., a policy analyst asking about fiscal data in South Asia) chats with the live chatbot for 3–5 turns.
2. **Records everything** — every tool call, every piece of data retrieved, every routing decision is captured.
3. **Scores the conversation** — an LLM judge (GPT-4.1-mini) reads the transcript and grades the chatbot against a set of rubrics.
4. **Produces a report** — a markdown transcript with inline scores is saved per persona, and a JSON results file is stored for comparison.

The framework is built on top of [DeepEval](https://deepeval.com) (by Confident AI), which provides the simulation engine and the LLM-as-a-judge scoring infrastructure.

---

### How a Single Evaluation Run Works

```
1. Preflight         Verify that the chatbot, backend, and MCP tools are reachable.
                     (HTTP mode only — skipped for in-process runs)

2. Load Personas     Read persona YAML files from evals/personas/. Each persona has a
                     scenario, a user description, and an expected outcome.

3. Simulate          A ConversationSimulator plays the user. For each turn:
                     - HTTP mode: POSTs to /api/chat and parses the SSE stream.
                     - In-process mode: calls the pipeline directly.
                     Every turn's tool calls, routing, and outputs are captured.

4. Score: Base       The full transcript is scored once by the Conversation Completeness
                     metric — did the chatbot address all of the persona's goals?

5. Score: Per-Turn   Each assistant turn is scored individually against up to 13 metrics
                     (Data Accuracy, Claim Tagging, Tool Selection, etc.).
                     Metrics that don't apply to a turn are automatically skipped.
                     Per-turn scores are then aggregated into a single conversation score.

6. Report            Results are saved to:
                     - evals/.results/conversations_<TS>.json  (full trace)
                     - evals/.results/results_<TS>.json        (scores)
                     - evals/conversations/<persona>/<TS>.md   (transcript + scores)
```

---

### What the Scores Mean

All metrics produce a score between 0 and 1. Each metric has a threshold that determines pass/fail:

| Threshold | Meaning | Typical Metrics |
|---|---|---|
| 0.8 | Strict — near-perfect required | Data Accuracy, Claim Tagging |
| 0.5–0.6 | Core behavior — must generally work | Tool Selection, Context Retention, Source Citation |
| 0.4 | Quality/polish — best effort | Content Structure, Follow-up Suggestions, Formatting |

A metric that passes on 4 out of 5 turns is aggregated differently depending on the method:
- **`min` aggregation:** The worst turn determines the conversation score. One failure = conversation fails.
- **`mean` aggregation:** The average across turns is the score. A minor slip on one turn does not fail the conversation.

---

### Key Concepts in Plain Language

**Persona** — A YAML file describing a simulated user: who they are, what they want to achieve, and what a fully complete outcome looks like. The simulator uses this to generate realistic messages turn by turn.

**Golden** — DeepEval's term for a pre-defined test scenario (scenario + user description + expected outcome). Personas are loaded into goldens before simulation begins.

**Pre-filtering** — A mechanism that automatically skips irrelevant metrics per turn. For example, "Data Formatting" is only scored on turns that actually present data, not on greetings or clarifications. This prevents false failures and reduces LLM judge API costs.

**Aggregation** — The method used to combine per-turn scores into a single conversation-level score. `min` is strict (worst turn wins); `mean` is lenient (average quality).

**Replay** — Re-scoring a past conversation without re-simulating it. The original trace (tool calls, responses) is saved to disk, so rubrics can be iterated quickly without paying for new simulation inference.

**Composed Persona** — A persona assembled at runtime from modular YAML facets: a base profile (e.g., "student"), a topic (e.g., "health outcomes"), a set of countries, and a conversational pattern (e.g., "visualize"). This allows diverse test coverage without maintaining a large number of static persona files.

---

## Part 2: Technical Reference

---

## 1. Overview

The evaluation framework uses [DeepEval](https://deepeval.com) (by Confident AI) to assess the Data360 chatbot through automated, persona-driven conversation simulations. Rather than hard-coded assertions, all scoring is performed by an LLM judge (`gpt-4.1-mini` by default) via DeepEval's `GEval` family of metrics.

The framework consists of three runtime phases:

| Phase | What happens |
|---|---|
| **Simulation** | A `ConversationSimulator` plays the role of a simulated user persona, calling the chatbot for up to N turns. Each turn is traced in full detail into `TurnData` objects. |
| **Evaluation** | The captured conversations are scored by the LLM judge against metrics defined in `eval_config.yaml`. Two types of scoring run in sequence: conversation-level (`ConversationalGEval`) and per-turn (`GEval`). |
| **Reporting** | Results are persisted as JSON score files and human-readable markdown transcripts under `evals/conversations/`. |

### Key files

| File | Responsibility |
|---|---|
| `eval_config.yaml` | Single source of truth for all metric definitions, thresholds, rubrics, and system configuration |
| `metric_builder.py` | Instantiates DeepEval `ConversationalGEval` objects from `base_metrics` config |
| `per_turn_eval.py` | Pre-filtering engine, context construction, per-turn `GEval` scoring, and aggregation |
| `run_conversation_eval.py` | Main entry point: simulation orchestration, HTTP mode, output persistence, CLI |
| `pipeline_runner.py` | In-process pipeline wrapper used in non-HTTP simulation mode |
| `persona_composer.py` | Assembles composed personas from YAML facets at runtime |

---

## 2. Metric Tiers: Conversation-Level vs. Per-Turn

DeepEval was built to evaluate single input/output pairs. Multi-turn chatbot evaluation requires tracking state across turns. The framework splits metrics into two tiers to handle this.

### Conversation-level metrics

- Evaluated **once** per conversation against the full transcript.
- Defined under `base_metrics` in `eval_config.yaml`.
- Instantiated as `ConversationalGEval` objects via `metric_builder.py → _build_conversational_metrics()`.
- Passed to DeepEval's `evaluate()` with a `ConversationalTestCase` that holds the complete turn list.

**Current metric:** *Conversation Completeness* — did the chatbot address all of the persona's stated goals?

### Per-turn metrics

- Evaluated **individually** on each assistant turn, then aggregated to the conversation level.
- Defined under `per_turn_metrics` in `eval_config.yaml`.
- Instantiated as standard `GEval` objects with `evaluation_params=[INPUT, ACTUAL_OUTPUT, CONTEXT]` via `per_turn_eval.py → _build_per_turn_metrics()`.
- A fresh `LLMTestCase` is constructed for each turn and scored independently.

**Examples:** *Per-Turn Data Accuracy*, *Per-Turn Claim Consistency*, *Per-Turn Tool Selection*, and 11 others.

---

## 3. Pre-filtering Engine

Applying all metrics to every turn is expensive and produces false failures — for example, scoring "Data Formatting" on a turn that contains no data at all. The pre-filtering engine solves this by selectively applying metrics based on what actually occurred in each turn.

### How it works

1. `_build_condensed_context()` (in `per_turn_eval.py`) inspects the rendered assistant response and the structured `TurnData` trace for each turn, extracting a set of boolean signal flags.
2. `_select_metrics_for_turn()` compares each metric's `requires` field against those flags and returns only the applicable metric names.
3. Non-applicable metrics are **auto-scored `1.0`** and flagged `"prefiltered": True`. They are excluded from aggregation (see Section 5).

### Valid `requires` values

The `requires_map` dict in `_select_metrics_for_turn()` defines the mapping from YAML values to context flags:

| `requires` Value | Context Flag | Condition to Run the Metric |
|---|---|---|
| `tool_data` | `has_tool_data` | Turn contains tool-retrieved numeric data (claim tags, `OBS_VALUE` markers, etc.) |
| `tool_calls` | `has_tool_calls` | Turn has at least one structured tool call in its trace |
| `data_gap` | `has_data_gap` | Turn contains phrases matching data-unavailability patterns (regex-based) |
| `comparison` | `has_comparison` | Turn references more than one `REF_AREA` or `TIME_PERIOD` |
| `technical_terms` | `has_technical_terms` | Turn uses technical indicator names or acronyms (GDP, HDI, WDI, etc.) |
| `prior_context` | `turn_idx > 0` | Skips turn 0; runs on all subsequent turns |
| `routing` | Always true | Every turn has a routing classification; this metric always runs |

> **Known gap:** The `requires_map` does not include `claim_data` or `presented_data`. A metric in `eval_config.yaml` using `requires: "claim_data"` will not match any key in `requires_map`, causing `flag_key` to be `None`, and the metric will be silently skipped on every turn. When adding new metrics, only use `requires` values from the table above, or explicitly extend `requires_map` in `per_turn_eval.py`.

### The `skip_on_deliverable` flag

If a metric definition includes `skip_on_deliverable: true`, it is additionally skipped on turns where the **user's message** matches a deliverable-format request pattern (e.g., "write me a brief", "give me a slide deck", "draft a summary"). Detection is regex-based on the user's input, not the assistant's output.

This prevents false failures on turns where structural conventions (e.g., "Suggested follow-ups:" sections) are intentionally omitted because the user asked for a deliverable.

---

## 4. Context Construction

To score properties like *Data Accuracy* and *Context Retention* reliably, the LLM judge needs structured ground truth, not just the raw response text.

### LLMTestCase structure

Each per-turn evaluation builds an `LLMTestCase` as follows:

```python
LLMTestCase(
    input=user_input,           # The user's message for this turn
    actual_output=assistant_output,  # The assistant's full rendered response for this turn
    context=context_strings,    # List of serialized prior-turn summaries
)
```

The `context` parameter corresponds to `LLMTestCaseParams.CONTEXT`. It is **not** `retrieval_context` — that is a separate DeepEval parameter used for RAG metrics.

### Prior context accumulation

`context_strings` is a list that grows cumulatively. For turn N, it contains serialized summaries of turns 0 through N-1. Each summary is built by `_serialize_condensed_context()` from a structured dict produced by `_build_condensed_context()`.

Each prior-turn summary includes:

- Turn index and routing classification (RESEARCH / DIRECT)
- Tool sequence (e.g., `search_indicators -> get_data -> get_viz_spec`)
- Individual tool calls with arguments (truncated to 80 chars per value)
- Indicator IDs, database IDs, `REF_AREA` codes, `TIME_PERIOD` values
- Claim-tag mappings in `claim_id=value` format
- Data gap and alternatives-suggested flags
- Visualization URL verification signals (programmatic, not LLM-judged)

---

## 5. Aggregation Mechanics

After per-turn `GEval` scoring, the per-turn scores are rolled up to conversation-level by `_evaluate_per_turn()` in `per_turn_eval.py`.

Each per-turn metric in `eval_config.yaml` specifies:
- `aggregates_to`: the name reported in the final conversation summary.
- `aggregation`: the method used to combine scores across turns.

| Method | Formula | When to Use |
|---|---|---|
| `min` | Conversation score = lowest individual-turn score | Strict correctness metrics (Data Accuracy, Claim Tagging) — a single bad turn should fail the whole conversation |
| `mean` | Conversation score = average across applied turns | Quality/polish metrics (Content Structure, Inline Explanations) — isolated slips should not fail an otherwise good conversation |

**Important:** Pre-filtered turns (`"prefiltered": True`) are excluded from aggregation. Only turns where the metric actually ran contribute to the final conversation score. This prevents auto-scored `1.0` values from artificially inflating results.

---

## 6. TurnData: The Trace Object

`TurnData` is a `dataclass` defined in `run_conversation_eval.py` that records the complete pipeline trace for a single conversation turn.

```python
@dataclass
class TurnData:
    role: str                 # "user" or "assistant"
    content: str              # Full rendered output (includes embedded tool call blocks)
    turn_index: int
    routing_intent: str       # "RESEARCH" or "DIRECT" (in-process); "(via HTTP)" (HTTP mode)
    routing_reasoning: str    # LLM's reasoning for the routing decision
    planner_output: str       # Planner's reasoning and tool plan text
    writer_output: str        # Clean writer output, without embedded tool call blocks
    tool_calls: list[dict]    # Normalized list of tool call records (see format note below)
    agent_actions: list[dict] # Chronological event timeline: routing, thinking, tool_call, tool_output
    model: str
    turns_used: int
    error: str | None
    warnings: list[str]       # E.g. "Empty writer output (sse_events=12, finish_reason=error)"
```

`TurnData` objects are stored in a global `_turn_data_store: dict[str, list[TurnData]]` keyed by `thread_id`. This store is passed to `_evaluate_per_turn()` so the per-turn evaluator can access structured tool call data directly from the trace.

### tool_calls format difference between modes

| Mode | tool_calls format |
|---|---|
| In-process | `{"tool": str, "arguments": dict, "result": ...}` |
| HTTP | `{"name": str, "args": dict, "output": ...}` |

`_build_condensed_context()` normalizes both formats into a consistent structure before building judge context.

---

## 7. ConversationSimulator and _GuardedSimulator

DeepEval's `ConversationSimulator` manages the multi-turn simulation loop. It calls the `model_callback` for each user turn and decides when to stop the conversation based on whether the `expected_outcome` in the persona golden appears to be satisfied.

### Simulator configuration

```python
simulator = _GuardedSimulator(
    model_callback=callback,      # Either _pipeline_model_callback or _http_model_callback
    simulator_model=judge_model,  # LLM that acts as the simulated user
    async_mode=True,
    max_concurrent=1,             # Sequential execution — MCP server is a shared resource
)
test_cases = simulator.simulate(
    conversational_goldens=goldens,
    max_user_simulations=max_turns,
)
```

### Why _GuardedSimulator exists

DeepEval's base `ConversationSimulator` can terminate a conversation after a single user+assistant exchange if its internal judge concludes the `expected_outcome` is already satisfied. For complex personas with multi-step goals, this produces spuriously short conversations that do not adequately stress-test the chatbot.

`_GuardedSimulator` subclasses `ConversationSimulator` and overrides `a_stop_conversation()` to enforce a minimum of two turns (one full user+assistant exchange) before any early termination is permitted:

```python
async def a_stop_conversation(self, turns, golden, progress=None, pbar_turns_id=None):
    if len(turns) < 2:
        return False  # Enforce minimum conversation length
    return await super().a_stop_conversation(turns, golden, progress, pbar_turns_id)
```

---

## 8. HTTP Mode: SSE Stream Parsing

When running with `--http`, the model callback (`_http_model_callback`) sends a streaming `POST /api/chat` request to the live chatbot and parses the Server-Sent Events (SSE) response.

### SSE event types handled

| Event type | Data captured |
|---|---|
| `data-stage` | Stage transitions (`routing`, `interpreting`, `executing`) — triggers flush of the accumulated thinking buffer |
| `text-delta` | Assembles `full_content` (the final writer response) |
| `data-thinking / text-delta` | Accumulates LLM reasoning text into `routing_text` or `planner_text` |
| `data-thinking / tool-input-available` | Captures tool name and arguments; registers entry in `_tool_call_map` by `toolCallId` |
| `data-thinking / tool-output-available` | Captures tool result and pairs it back to the correct call via `toolCallId` |
| `error` / `finish` / `done` | Records finish reason for diagnostics |

All events are assembled into a chronological `agent_timeline` list stored in `TurnData.agent_actions`.

If `full_content` is empty after stream completion, the callback emits a structured warning (including SSE event count, stages seen, tool call count, and finish reason) and continues — it does not raise an exception.

### Session reuse across turns

HTTP mode maintains a per-thread session in `_http_sessions` containing a guest auth token and a stable `chat_id` UUID:

- **Turn 1:** Authenticates via `POST /api/auth/guest` and mints a new `chat_id`.
- **Turns 2–N:** Reuses the same token and `chat_id`. The backend loads conversation history from the database.

The request body does **not** include `existingMessages` — the database is the authoritative source of conversation history.

---

## 9. Multi-Run Mode and Composed Personas

### Multi-run mode (`--runs N`)

Repeats the full simulation and evaluation cycle N times. This is primarily used with `--compose-random` to sample diverse facet combinations and measure score variance across runs.

- Each run saves a separate `conversations_<TIMESTAMP>_r<N>.json` trace file.
- Each run saves a separate `<TIMESTAMP>_r<N>.md` transcript.
- The final printed summary reports both mean and standard deviation across all runs.
- The aggregated markdown uses the last run's conversations.
- `--replay` and `--runs > 1` are mutually exclusive.

### Composed personas

`--compose BASE:TOPIC:COUNTRIES:PATTERN` or `--compose-random BASE` builds a persona dynamically from YAML facets at runtime via `persona_composer.py`.

- The composer merges a base profile (e.g., `student`) with a topic, countries, and a conversational pattern facet into a complete persona dict.
- The composed persona is registered in the global `PERSONAS` dict under the key `composed_<label>` for the duration of the run.
- With `--compose-random`, each run receives a different random combination of available facets, producing diverse test coverage.
- Output files are placed in `conversations/<base>/<topic>_<countries>_<pattern>/`.

---

## 10. Hyperparameter Tracking and Config Resolution

Every `evaluate()` call passes a `hyperparameters` dict to DeepEval, which logs it alongside scores for reproducibility.

### Auto-populated fields

| Field | Source | Purpose |
|---|---|---|
| `prompt_version` | `git branch@short_hash` | Identifies the exact branch and commit of the system prompts under test |
| `system_prompt_hash` | SHA-256 of `get_combined_system_prompt()`, first 12 chars | Detects prompt changes within the same branch |

Both fields fall back to `"unknown"` on failure (e.g., not a git repo, import error) without blocking evaluation.

### Config resolution order

Settings are resolved in the following precedence (highest to lowest):

1. **Auto-detected at runtime** — git branch, commit hash, system prompt hash
2. **Environment variables** — `DEEPEVAL_JUDGE_MODEL`, `CHATBOT_URL`, `CHATBOT_API_BASE`
3. **`eval_config.yaml`** — base values for all settings

---

## 11. Preflight Checks

When running in `--http` mode, `_preflight_checks()` runs before any simulation begins and verifies that the full stack is reachable. It performs three sequential checks:

1. **Chatbot frontend** (`chatbot_url`, default `http://localhost:3001`): HEAD request — any HTTP response (including redirects or 404) confirms the server is running.
2. **Backend API** (`chatbot_api_base/health`, default `http://localhost:8001`): GET request — any non-5xx response passes.
3. **MCP tools** (`chatbot_api_base/api/v1/mcp/tools`): Authenticates as guest via `POST /api/auth/guest`, then calls the tools-listing endpoint and verifies `count > 0`.

If any check fails, actionable error messages are printed and `sys.exit(1)` is called. Check 3 is automatically skipped if check 2 failed (backend unreachable).

---

## 12. Replay Mechanism

The replay mechanism allows rubrics and metric definitions to be iterated rapidly without re-running expensive LLM simulations.

- `evals/.results/conversations_<TIMESTAMP>.json` stores the complete trace: all turn contents and the full `TurnData` pipeline details (routing, planner, tool calls, agent timeline).
- `--replay <TIMESTAMP>` reloads this file, restores `_turn_data_store`, and re-runs only the `GEval` / `ConversationalGEval` scoring step.
- The restored `_turn_data_store` means the per-turn evaluator and markdown renderer have identical pipeline details to the original run.

**Typical workflow for rubric iteration:**

```
1. Run a simulation once to capture a baseline trace
2. Update criteria/rubric/threshold in eval_config.yaml
3. re-score: --replay <TIMESTAMP> --persona <name>
4. Compare: uv run python -m evals.compare_eval_runs <OLD_TS> <NEW_TS>
5. Repeat from step 2
```

---

## 13. Adding or Modifying a Metric

### Step-by-step

1. **Open** `backend/evals/eval_config.yaml`.

2. **Decide the scope:**
   - `base_metrics` — holistic, evaluated once per conversation, uses `ConversationalGEval`.
   - `per_turn_metrics` — evaluated per assistant turn and aggregated, uses `GEval`.

3. **Define the metric block** with these required fields:

   | Field | Description |
   |---|---|
   | `name` | Unique string used in reports and result files |
   | `type` | Always `geval` |
   | `threshold` | Pass/fail cutoff: `0.8` (strict accuracy), `0.5–0.6` (core behavior), `0.4` (quality/polish) |
   | `criteria` | System-level instruction for the judge LLM (be explicit and precise) |
   | `evaluation_steps` | Chain-of-thought steps that guide the judge's reasoning |
   | `rubric` | Three score-range tiers (0–3, 4–7, 8–10) each with an `expected_outcome` string |

4. **For per-turn metrics only**, also specify:

   | Field | Description |
   |---|---|
   | `requires` | Pre-filter condition (must be a key in `requires_map` — see Section 3 table) |
   | `aggregates_to` | Name of the resulting conversation-level metric in reports |
   | `aggregation` | `min` (one bad turn fails the conversation) or `mean` (average quality) |
   | `skip_on_deliverable` | Optional boolean; set `true` to skip on deliverable-format user requests |

5. **Validate** with a targeted run against a known persona:

   ```bash
   cd backend
   PYTHONPATH=. uv run python -m evals.run_conversation_eval \
     --http --persona student_learning_and_exploration --turns 2
   ```

6. **Iterate** using replay if the conversation is already captured:

   ```bash
   PYTHONPATH=. uv run python -m evals.run_conversation_eval \
     --replay <TIMESTAMP> --persona student_learning_and_exploration
   ```

---

## 14. Output File Structure

```
evals/
├── eval_config.yaml                          # Metric definitions and system config
├── .results/
│   ├── conversations_<TIMESTAMP>.json        # Full trace: turns + TurnData pipeline fields
│   ├── conversations_<TIMESTAMP>_r2.json     # Per-run trace file when --runs > 1
│   └── results_<TIMESTAMP>.json             # Aggregated metric scores
│
└── conversations/
    ├── <flat_persona>/
    │   ├── <TIMESTAMP>.md                    # Transcript + per-turn scores (single run)
    │   ├── <TIMESTAMP>_r1.md                 # Per-run transcript when --runs > 1
    │   └── <TIMESTAMP>_r1_review.md          # Manual review artifact (review_conversation.py)
    │
    └── <base>/
        └── <topic>_<countries>_<pattern>/
            └── <TIMESTAMP>_r1.md             # Composed persona transcript
```

The `conversations_<TIMESTAMP>.json` file in `.results/` is the authoritative input to `--replay`. It must be present for replay to work. Each JSON entry includes the raw turn content alongside the full `TurnData` pipeline fields (routing intent, planner output, tool calls, agent action timeline).
