# E2E Evaluation Guide

How to run DeepEval against the live chatbot -- locally or against a production instance behind VPN.

---

## Architecture

The eval runner sends real HTTP requests through the full chatbot stack: FastAPI backend, streaming response assembly, LLM calls, and MCP tool execution.

```
 ┌──────────────────────────────────────────────────────────┐
 │  Eval Runner (run_conversation_eval.py --http)           │
 │                                                          │
 │  1. POST /api/auth/guest  →  get JWT token               │
 │  2. POST /api/chat        →  stream response (SSE format) │
 │     (with Bearer token + chat_id)                        │
 └────────────┬─────────────────────────────────────────────┘
              │ HTTP
              ▼
 ┌─────────────────────────────────────────────────────────┐
 │  Backend (FastAPI)                                       │
 │  ├─ /api/auth/guest   → creates guest user, returns JWT │
 │  ├─ /api/chat         → streaming chat endpoint         │
 │  └─ Connects to MCP server (Streamable HTTP transport)  │
 └────────────┬────────────────────────────────────────────┘
              │
              ▼
 ┌─────────────────────────────────────────────────────────┐
 │  MCP Server (data360-mcp)                               │
 │  └─ Data360 API tools (search, get_data, get_viz_spec…) │
 └─────────────────────────────────────────────────────────┘
```

---

## Authentication

The eval runner authenticates as a **guest user** -- no MSAL tokens or manual login needed.

This is handled automatically by `_http_model_callback` in `run_conversation_eval.py`:

1. **Create a session** -- `POST <CHATBOT_API_BASE>/api/auth/guest`
   - Returns `{ "access_token": "<JWT>" }`
   - One session per persona, reused across turns

2. **Send messages** -- `POST <CHATBOT_API_BASE>/api/chat`
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
   - The `chat_id` is reused across turns so the backend loads history from the database.

3. **Parse streaming response** -- the backend returns `data: {...}\n` lines (SSE format). The eval runner extracts:
   - `text-delta` -- final assistant text
   - `data-thinking` -- routing reasoning, planner reasoning, tool calls, tool outputs
   - `data-stage` -- stage transitions (routing, executing, interpreting)

> **Note:** The SSE format here is the **chat API response format**, not the MCP transport. The backend connects to the MCP server using Streamable HTTP transport (`backend/app/ai/mcp_tools/_client.py`).

---

## Environment Setup

```bash
cp backend/evals/.env.example backend/evals/.env
# Edit values, then source before running:
set -a; source backend/evals/.env; set +a
```

Key variables:

| Variable | Local | Production |
|---|---|---|
| `CHATBOT_URL` | `http://localhost:3001` | `https://your-chatbot.example.org` |
| `CHATBOT_API_BASE` | `http://localhost:8001` | `https://your-chatbot.example.org` |
| `OPENAI_API_KEY` | _(your key)_ | _(your key)_ |
| `SSL_CERT_FILE` | _(not needed)_ | `./backend/certs/corp-root-ca.crt` |

See `.env.example` for the full list.

---

## Running Locally

### Assumptions

- Docker Compose stack is running (`docker compose up -d`)
- MCP server is running on the host (`./run_server.sh` in the data360-mcp repo)
- Backend `.env` has `MCP_SERVER_URL=http://host.docker.internal:8021/mcp`

### Prerequisites

| Service | Container | Port |
|---|---|---|
| PostgreSQL | `chatbot-db` | 5433 → 5432 |
| FastAPI backend | `chatbot-backend` | 8001 |
| Next.js frontend | `chatbot-frontend` | 3001 |

```bash
docker compose up -d
# In the data360-mcp repo:
./run_server.sh
```

### Commands

```bash
cd backend

# Single persona
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona student_learning_and_exploration

# All personas
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona all

# Simulation only (no scoring)
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona all --no-eval

# Custom turn count
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona all --turns 3

# Multiple runs (variance measurement)
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona all --runs 3
```

---

## Running Against Production (VPN)

### Assumptions

- You are connected to the WBG VPN
- The production chatbot is reachable (e.g., `https://your-chatbot.example.org`)
- Guest auth (`POST /api/auth/guest`) is enabled on the production backend
- The MCP server is already running inside the production environment -- the eval runner does not need access to it

### Setup

1. **Set environment variables** in `backend/evals/.env`:

   ```bash
   CHATBOT_URL=https://your-chatbot.example.org
   CHATBOT_API_BASE=https://your-chatbot.example.org
   OPENAI_API_KEY=<your-key>
   ```

2. **Corporate SSL certificates** (if applicable):

   The corporate root CA is already in the repo at `backend/certs/corp-root-ca.crt`. Point the env vars at it:

   ```bash
   SSL_CERT_FILE=./backend/certs/corp-root-ca.crt
   REQUESTS_CA_BUNDLE=./backend/certs/corp-root-ca.crt
   ```

3. **MCP connectivity** is validated automatically. The preflight authenticates as a guest and calls the backend's tool-listing endpoint (`GET /api/v1/mcp/tools`) to verify the backend can reach the MCP server. No `MCP_SERVER_URL` is needed on the eval runner's side.

### Commands

Same as local, but the env vars point at production:

```bash
cd backend
set -a; source evals/.env; set +a

PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona student_learning_and_exploration
```

---

## Preflight Checks

The `--http` flag runs automatic checks before simulation:

| Check | Required | On failure |
|---|---|---|
| Chatbot frontend (`CHATBOT_URL`) | Yes | Exits |
| Backend API (`CHATBOT_API_BASE/health`) | Yes | Exits |
| MCP tools (via backend `GET /api/v1/mcp/tools`) | Yes | Exits (backend cannot reach MCP) |

---

## Output Files

| File | Location | Content |
|---|---|---|
| Conversations JSON | `evals/.results/conversations_<timestamp>.json` | Full conversation + pipeline details |
| Eval results JSON | `evals/.results/conversation_eval_<timestamp>.json` | Scores, thresholds, judge reasoning |
| Per-persona markdown | `evals/conversations/<persona>.md` | Transcript + eval results |

### Replaying a previous run

```bash
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --replay <TIMESTAMP> --persona all
```

Timestamp from the filename: `conversations_20260305_210102.json` -> `20260305_210102`.

### Comparing two runs

```bash
PYTHONPATH=. uv run python -m evals.compare_eval_runs <TIMESTAMP_A> <TIMESTAMP_B>
```

---

## Troubleshooting

### Preflight fails: "Chatbot frontend unreachable"

```bash
# Local
docker compose ps && docker compose logs -f

# Production
curl -I https://your-chatbot.example.org   # verify VPN access
```

### SSL errors against production

```bash
export SSL_CERT_FILE=./backend/certs/corp-root-ca.crt
export REQUESTS_CA_BUNDLE=./backend/certs/corp-root-ca.crt
```

### Timeouts

The streaming endpoint has a 300-second timeout. Check backend logs (`docker compose logs -f backend`) or the Data360 API status.

### Guest auth fails

```bash
curl <CHATBOT_API_BASE>/health          # backend running?
curl -X POST <CHATBOT_API_BASE>/api/auth/guest  # guest auth enabled?
```

---

## Annex: In-Process Mode

The eval framework also supports an **in-process** mode (the default when `--http` is omitted). This imports the Python pipeline directly and calls the LLM + MCP tools in the same process, bypassing the HTTP stack entirely.

This mode is useful for:
- Quick iteration on prompts or rubrics (faster, no Docker needed)
- Debugging a specific metric with `--replay`

```bash
cd backend

# In-process mode (requires MCP_SERVER_URL on host)
MCP_SERVER_URL=http://localhost:8021/mcp \
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --persona student_learning_and_exploration

# Replay + in-process (no MCP needed)
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --replay <TIMESTAMP> --persona all
```

**Requirements:** `MCP_SERVER_URL` must be set and reachable from the host (not via Docker). The MCP server runs directly on your machine, not in a container.
