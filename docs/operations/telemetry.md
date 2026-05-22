# OpenTelemetry (backend)

The FastAPI backend exports distributed traces to **Azure Application Insights** in deployed environments, with optional **OTLP** or **console** export for local development.

## Architecture

A typical chat request produces this span hierarchy:

1. **FastAPI** — incoming HTTP request (`/api/v1/chat/...`)
2. **`chat.turn`** — one assistant message / graph run
3. **`chatbot.graph.<node>`** — LangGraph nodes (router, research, narrator, followup, …)
4. **`chatbot.tool.<name>`** — MCP / LangChain tool calls
5. **httpx** — outbound HTTP (Azure OpenAI, Data360 MCP, charts API, …)

Span attributes use opaque IDs only (`chatbot.message_id`, `chatbot.model_type`, `chatbot.intent`). User queries, emails, and tokens are **not** attached to spans.

## Deployed (Azure App Service)

Set on the **backend** app slot:

| Variable | Example |
|----------|---------|
| `ENVIRONMENT` | `production`, `qa`, or `uat` (not `development` or `local`) |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | From the Application Insights resource |

Traces appear in Application Insights under **Transaction search** and **Application map**.

The Next.js frontend keeps its existing `@vercel/otel` registration; end-to-end trace propagation from browser to API is not enabled in v1.

## Local development

### Console spans

```bash
export CHATBOT_OTEL_CONSOLE=1
export OTEL_SERVICE_NAME=ai-chatbot-backend
uv run uvicorn app.main:app --reload --port 8001
```

Send a chat message; span JSON is printed to stdout.

### Jaeger (OTLP)

```bash
docker run --rm -d --name jaeger \
  -p 16686:16686 -p 4317:4317 -p 4318:4318 \
  jaegertracing/jaeger:latest

export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export OTEL_SERVICE_NAME=ai-chatbot-backend
```

Open http://localhost:16686 and look for service `ai-chatbot-backend`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `ENVIRONMENT` | `development` / `local` → local path; otherwise Azure Monitor when connection string is set |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Azure Monitor export (deployed) |
| `OTEL_SERVICE_NAME` | Resource name (default `ai-chatbot-backend`) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Local OTLP traces endpoint |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | Alternate OTLP endpoint |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `http/protobuf` or `http/json` for HTTP exporter |
| `CHATBOT_OTEL_CONSOLE` | `1` / `true` / `yes` → stdout span export |

See also [`backend/.env.example`](../../backend/.env.example).

## Error correlation

When the API returns `errorId` on 5xx responses, the same value is set on the active span as `chatbot.error_id` when tracing is enabled. Use it to correlate support tickets with Application Insights traces.

## Implementation files

| File | Role |
|------|------|
| `backend/app/observability/otel_setup.py` | Exporters, httpx hooks, FastAPI instrumentor |
| `backend/app/observability/graph_spans.py` | LangGraph node spans |
| `backend/app/observability/tool_spans.py` | Tool invocation spans |
| `backend/app/main.py` | Startup initialization |
| `backend/app/ai/graph/pipeline.py` | Wrapped graph nodes |
| `backend/app/api/v1/utils/graph_stream.py` | `chat.turn` parent span |

## Related observability (not OpenTelemetry)

- **Request logging** — `RequestLoggingMiddleware` (duration, path, status)
- **Token usage** — persisted per chat and optional reviewer UI (`token_usage.py`)
- **Graph debug log** — `GRAPH_DEBUG_LOG_LLM` (may contain PII; dev only)
