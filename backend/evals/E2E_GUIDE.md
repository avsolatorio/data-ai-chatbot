# E2E Evaluation Guide

How to run DeepEval against the live chatbot (production-side MCP server + full stack).

---

## Architecture Overview

The eval framework supports two execution modes:

| Mode | Flag | What it hits | MCP required on host? |
|---|---|---|---|
| **In-Process** (default) | _(none)_ | Imports the Python pipeline directly; calls the LLM + MCP tools in the same process | Yes (`MCP_SERVER_URL`) |
| **HTTP E2E** | `--http` | Sends real HTTP requests to the running chatbot (FastAPI backend + Next.js frontend) | No (chatbot connects to MCP internally) |

HTTP E2E is the "true" end-to-end mode. It exercises the full stack: Next.js frontend proxy, FastAPI backend, streaming SSE response assembly, LLM calls, and MCP tool execution.

```
 ┌──────────────────────────────────────────────────────────┐
 │  Eval Runner (run_conversation_eval.py --http)           │
 │                                                          │
 │  1. POST /api/auth/guest  →  get JWT token               │
 │  2. POST /api/chat        →  stream SSE response          │
 │     (with Bearer token + chat_id)                        │
 └────────────┬─────────────────────────────────────────────┘
              │ HTTP
              ▼
 ┌─────────────────────────────────────────────────────────┐
 │  Backend (FastAPI, port 8001)                            │
 │  ├─ /api/auth/guest   → creates guest user, returns JWT │
 │  ├─ /api/chat         → streaming chat endpoint (SSE)   │
 │  └─ Connects to MCP server for Data360 tools            │
 └────────────┬────────────────────────────────────────────┘
              │
              ▼
 ┌─────────────────────────────────────────────────────────┐
 │  MCP Server (data360-mcp, port 8021/8022)               │
 │  └─ Data360 API tools (search, get_data, get_viz_spec…) │
 └─────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

The eval runner authenticates as a **guest user** -- no real credentials needed.

### Step-by-step (handled automatically by `_http_model_callback`)

1. **Create a session** -- `POST http://localhost:8001/api/auth/guest`
   - Returns `{ "access_token": "<JWT>" }`
   - The runner caches this per simulated thread (one session per persona)

2. **Send messages** -- `POST http://localhost:8001/api/chat`
   - Headers: `Authorization: Bearer <JWT>`
   - Body:
     ```json
     {
       "id": "<chat_uuid>",
       "message": {
         "id": "<message_uuid>",
         "role": "user",
         "parts": [{ "type": "text", "text": "What is GDP of Kenya?" }]
       },
       "selectedChatModel": "chat-model",
       "selectedVisibilityType": "private"
     }
     ```
   - The `chat_id` is reused across turns so the backend loads conversation history from the database.

3. **Parse SSE response** -- the runner streams the response and extracts:
   - `text-delta` events → final assistant text
   - `data-thinking` events → routing reasoning, planner reasoning, tool calls, tool outputs
   - `data-stage` events → stage transitions (routing → executing → interpreting)

No API keys, OAuth, or manual login is required. The eval runner creates ephemeral guest sessions that live in the database for the duration of the eval.

---

## Prerequisites

### 1. Start the chatbot stack

```bash
# From the project root
docker compose up -d
```

This starts:

| Service | Container | Port |
|---|---|---|
| PostgreSQL | `chatbot-db` | 5433 (host) → 5432 (container) |
| FastAPI backend | `chatbot-backend` | 8001 |
| Next.js frontend | `chatbot-frontend` | 3001 |

### 2. Start the MCP server

The MCP server runs **on the host** (not in Docker). The backend container reaches it via `host.docker.internal`.

```bash
# In the data360-mcp repo
./run_server.sh
# Default: listens on port 8021 or 8022
```

### 3. Set MCP_SERVER_URL in the backend

The backend's `.env` file must have:

```
MCP_SERVER_URL=http://host.docker.internal:8021/mcp
```

This tells the containerized backend where to find the MCP server running on the host.

### 4. Set DEEPEVAL_API_KEY (for DeepEval cloud features)

```bash
export DEEPEVAL_API_KEY=<your-key>   # optional, for dashboard uploads
```

### 5. Set OPENAI_API_KEY (for judge model)

The judge model (default: `gpt-4.1-mini`) requires an OpenAI API key:

```bash
export OPENAI_API_KEY=<your-key>
```

---

## Running E2E Evals

### Preflight checks

The `--http` flag triggers automatic preflight checks before any simulation runs. The runner verifies:

1. **Frontend** reachable at `http://localhost:3001` (or `CHATBOT_URL`)
2. **Backend API** reachable at `http://localhost:8001/health` (or `CHATBOT_API_BASE`)
3. **MCP Server** reachable at `MCP_SERVER_URL`

If any check fails, the runner prints actionable error messages and exits.

### Commands

```bash
cd backend

# Single persona, HTTP E2E
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona student_learning_and_exploration

# All personas, HTTP E2E
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona all

# Skip evaluation (simulation only, no scoring)
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona all --no-eval

# Custom number of turns
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona all --turns 3

# Multiple runs (for variance measurement)
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona all --runs 3
```

### Environment variable overrides

| Variable | Default | Purpose |
|---|---|---|
| `CHATBOT_URL` | `http://localhost:3001` | Frontend URL for preflight |
| `CHATBOT_API_BASE` | `http://localhost:8001` | Backend API base URL |
| `MCP_SERVER_URL` | _(required)_ | MCP server URL (for preflight check) |
| `DEEPEVAL_JUDGE_MODEL` | `gpt-4.1-mini` | Override the judge LLM |

These can also be set in `eval_config.yaml` under `chatbot_url` and `chatbot_api_base`.

---

## Output Files

Each run produces:

| File | Location | Content |
|---|---|---|
| Conversations JSON | `evals/.results/conversations_<timestamp>.json` | Full conversation data with pipeline details |
| Eval results JSON | `evals/.results/conversation_eval_<timestamp>.json` | Metric scores, thresholds, judge reasoning |
| Per-persona markdown | `evals/conversations/<persona>.md` | Human-readable transcript + eval results |

### Replaying a previous run

Re-evaluate saved conversations without re-running the simulation:

```bash
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --replay <TIMESTAMP> --persona all
```

The timestamp comes from the filename, e.g. `conversations_20260305_210102.json` → `20260305_210102`.

### Comparing two runs

```bash
PYTHONPATH=. uv run python -m evals.compare_eval_runs <TIMESTAMP_A> <TIMESTAMP_B>
```

---

## Troubleshooting

### Preflight fails: "Chatbot frontend unreachable"

```bash
docker compose ps          # Check containers are running
docker compose logs -f     # Check for startup errors
```

### Preflight fails: "MCP_SERVER_URL is not set"

```bash
export MCP_SERVER_URL=http://host.docker.internal:8021/mcp
```

The eval runner checks this variable exists. The _backend_ is what actually calls the MCP server -- the eval runner only verifies it is reachable (after translating `host.docker.internal` → `localhost` for host-side probing).

### HTTP callback errors (timeouts)

The streaming endpoint has a 300-second timeout. If your MCP server or LLM is slow:
- Check MCP server logs for Data360 API timeouts
- Check backend logs: `docker compose logs -f backend`

### Guest auth fails

The `POST /api/auth/guest` endpoint creates an ephemeral user in the database. If it fails:
- Verify the database is running: `docker compose logs db`
- Check backend health: `curl http://localhost:8001/health`

---

## In-Process vs HTTP E2E: When to Use Each

| Use case | Mode |
|---|---|
| Quick iteration on prompts/rubrics | In-process (faster, no Docker needed) |
| Testing the full deployed stack | HTTP E2E |
| Validating streaming, auth, DB persistence | HTTP E2E |
| CI/CD pipeline | HTTP E2E (against staging) |
| Debugging a specific metric | In-process + `--replay` |

In-process mode requires `MCP_SERVER_URL` set locally and imports the pipeline code directly. HTTP E2E mode requires the full Docker stack running and sends real HTTP requests through the frontend/backend.
