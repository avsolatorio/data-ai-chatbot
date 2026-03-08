# E2E Evaluation Guide

How to run DeepEval against the live chatbot -- locally or against a production instance behind VPN.

---

## Architecture Overview

The eval framework supports two execution modes:

| Mode | Flag | What it hits | MCP required on host? |
|---|---|---|---|
| **In-Process** (default) | _(none)_ | Imports the Python pipeline directly; calls the LLM + MCP tools in the same process | Yes (`MCP_SERVER_URL`) |
| **HTTP E2E** | `--http` | Sends real HTTP requests to the running chatbot (FastAPI backend + Next.js frontend) | No (chatbot connects to MCP internally) |

HTTP E2E is the "true" end-to-end mode. It exercises the full stack: FastAPI backend, streaming response assembly, LLM calls, and MCP tool execution.

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

## Authentication Flow

The eval runner authenticates as a **guest user** -- no real credentials or MSAL tokens needed.

### Step-by-step (handled automatically by `_http_model_callback`)

1. **Create a session** -- `POST <CHATBOT_API_BASE>/api/auth/guest`
   - Returns `{ "access_token": "<JWT>" }`
   - The runner caches this per simulated thread (one session per persona)

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
   - The `chat_id` is reused across turns so the backend loads conversation history from the database.

3. **Parse streaming response** -- the backend returns a streaming response in SSE format (`data: {...}\n` lines). The eval runner parses these events to extract:
   - `text-delta` events --> final assistant text
   - `data-thinking` events --> routing reasoning, planner reasoning, tool calls, tool outputs
   - `data-stage` events --> stage transitions (routing, executing, interpreting)

> **Note:** The SSE format here is the **chat API response format**, not the MCP transport. The backend connects to the MCP server using Streamable HTTP transport (see `backend/app/ai/mcp_tools/_client.py`).

---

## Environment Setup

Copy the template and fill in values:

```bash
cp backend/evals/.env.example backend/evals/.env
```

See `.env.example` for all available variables. The key ones are:

| Variable | Local | Production |
|---|---|---|
| `CHATBOT_URL` | `http://localhost:3001` | `https://your-chatbot.example.org` |
| `CHATBOT_API_BASE` | `http://localhost:8001` | `https://your-chatbot.example.org` |
| `MCP_SERVER_URL` | `http://host.docker.internal:8021/mcp` | _(not needed -- backend handles it)_ |
| `OPENAI_API_KEY` | _(your key)_ | _(your key)_ |
| `SSL_CERT_FILE` | _(not needed)_ | `/path/to/corp-root-ca.crt` _(if behind corporate proxy)_ |

---

## Running Locally

### Assumptions

- Docker Compose stack is running (`docker compose up -d`)
- MCP server is running on the host (e.g., `./run_server.sh` in the data360-mcp repo)
- Backend `.env` has `MCP_SERVER_URL=http://host.docker.internal:8021/mcp`

### Prerequisites

| Service | Container | Port |
|---|---|---|
| PostgreSQL | `chatbot-db` | 5433 (host) → 5432 (container) |
| FastAPI backend | `chatbot-backend` | 8001 |
| Next.js frontend | `chatbot-frontend` | 3001 |

```bash
# Start the stack
docker compose up -d

# Start MCP server (in the data360-mcp repo)
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

# Skip evaluation (simulation only)
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

- You are connected to the company VPN
- The production chatbot is reachable (e.g., `https://your-chatbot.example.org`)
- Guest auth (`POST /api/auth/guest`) is enabled on the production backend
- The MCP server is already configured and running inside the production environment -- the eval runner does not need access to it

### Setup

1. **Set environment variables** in `backend/evals/.env`:

   ```bash
   CHATBOT_URL=https://your-chatbot.example.org
   CHATBOT_API_BASE=https://your-chatbot.example.org
   OPENAI_API_KEY=<your-key>
   ```

2. **Corporate SSL certificates** (if applicable):

   If the VPN uses a corporate root CA, set:

   ```bash
   SSL_CERT_FILE=/path/to/corp-root-ca.crt
   REQUESTS_CA_BUNDLE=/path/to/corp-root-ca.crt
   ```

   The certificate file is typically at `backend/certs/corp-root-ca.crt` in this repo.

3. **MCP_SERVER_URL** is optional for production HTTP E2E. The eval runner only checks
   that the backend API is reachable. If `MCP_SERVER_URL` is not set (or not reachable
   from your machine), the preflight check will log a warning but will **not** block the run.

### Commands

Same as local, but the env vars point at production:

```bash
cd backend

# Load env vars
set -a; source evals/.env; set +a

# Run against production
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --http --persona student_learning_and_exploration
```

---

## Preflight Checks

The `--http` flag triggers automatic preflight checks before simulation:

| Check | Required | Failure behavior |
|---|---|---|
| Chatbot frontend (`CHATBOT_URL`) | Yes | Hard failure -- exits |
| Backend API (`CHATBOT_API_BASE/health`) | Yes | Hard failure -- exits |
| MCP server (`MCP_SERVER_URL`) | No | Warning only (in HTTP E2E mode, the backend connects to MCP internally) |

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

The timestamp comes from the filename, e.g., `conversations_20260305_210102.json` → `20260305_210102`.

### Comparing two runs

```bash
PYTHONPATH=. uv run python -m evals.compare_eval_runs <TIMESTAMP_A> <TIMESTAMP_B>
```

---

## Troubleshooting

### Preflight fails: "Chatbot frontend unreachable"

```bash
# Local
docker compose ps
docker compose logs -f

# Production
curl -I https://your-chatbot.example.org   # verify VPN access
```

### SSL errors against production

```bash
export SSL_CERT_FILE=/path/to/corp-root-ca.crt
export REQUESTS_CA_BUNDLE=/path/to/corp-root-ca.crt
```

### HTTP callback errors (timeouts)

The streaming endpoint has a 300-second timeout. If the MCP server or LLM is slow:
- Check backend logs: `docker compose logs -f backend` (local) or production logs
- The Data360 API occasionally times out on large queries

### Guest auth fails

The `POST /api/auth/guest` endpoint creates an ephemeral user. If it fails:
- Verify the backend is running: `curl <CHATBOT_API_BASE>/health`
- Check that guest auth is enabled on the target environment

---

## In-Process vs HTTP E2E: When to Use Each

| Use case | Mode |
|---|---|
| Quick iteration on prompts/rubrics | In-process (faster, no Docker needed) |
| Testing the full deployed stack (local) | HTTP E2E |
| Testing against production behind VPN | HTTP E2E |
| Validating streaming, auth, DB persistence | HTTP E2E |
| CI/CD pipeline against staging | HTTP E2E |
| Debugging a specific metric | In-process + `--replay` |
