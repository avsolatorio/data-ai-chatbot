# AI and Streaming

!!! warning "Deprecated"
    This page is outdated. It describes a legacy **RESEARCH vs DIRECT** single-LLM model.
    Production chat uses a **LangGraph pipeline** with six intents and multiple nodes.
    For current documentation, see
    [Architecture (comprehensive)](../architecture-comprehensive.md) and
    [Agents and chat flow](../agents-and-chat-flow.md).

---

This document describes the **AI and streaming pipeline**: how a chat message is processed, how intent routing (RESEARCH vs DIRECT) works, how the stream is generated and sent, tool execution (local and MCP), and resumable streams.

---

## Entry point: POST /api/chat

When the user sends a message, the client POSTs to **`/api/chat`** with the conversation id (or empty for new chat), the latest message, selected model, and visibility. The handler in **`backend/app/api/v1/chat.py`**:

1. **Rate limit** — Applied by middleware; if exceeded, request fails with 429.
2. **Auth** — `get_current_user` resolves the user.
3. **Get or create chat** — If an id is provided, load the chat and check ownership/visibility; otherwise create a new chat and set title (e.g. from first message or a title model call later).
4. **Save user message** — Persist the user message to the database and attach it to the chat.
5. **Build conversation for LLM** — Convert chat history (and optionally system prompt) into the format expected by the LLM (OpenAI-style messages: role, content, tool_calls, etc.). See **`utils/message_converter.py`** and related.
6. **Intent routing** — Run a lightweight **routing** step to decide whether this turn is **RESEARCH** (data-heavy, open-ended) or **DIRECT** (simpler, no MCP). Routing may use the last few messages and a small model (`ROUTING_MODEL`, `ROUTING_HISTORY_LIMIT`). See **`ai/routing.py`** (`check_intent`).
7. **Prepare tools** — Build the list of tools to expose to the LLM: **local tools** (e.g. document, suggestions, weather) and **MCP tools** (from Data360 MCP via `get_mcp_tools()`). MCP tool list is cached (e.g. 5 minutes). Each tool has a name, description, and parameters (OpenAI function schema). MCP tools are marked so that the executor calls the MCP client instead of a local function. See **`api/v1/utils/tool_setup.py`** (`prepare_tools`) and **`ai/mcp_tools/`**.
8. **Stream** — Call the streaming entry point (e.g. **`utils/stream.py`** `stream_text()` or equivalent) with the messages, tools, and routing mode. The stream produces SSE events that are sent to the client. Optionally, stream chunks are written to Redis for resume.
9. **After stream** — Background tasks (or inline after stream ends) save the assistant message(s) to the database and update chat metadata (e.g. `lastContext` for token usage).

If the client disconnects mid-stream, the backend can continue generating and writing to Redis (when enabled) so that the user can resume later.

---

## Intent routing: RESEARCH vs DIRECT

- **RESEARCH** — Used when the user's intent is open-ended or data-heavy (e.g. "find indicators about poverty in Kenya", "show me a chart"). The system prompt includes **chain-of-thought** and data-workflow guidance; **MCP tools** (Data360 search, metadata, data, charts) are available; the stream may include **"thinking"** segments (data-thinking, data-stage) so the UI can show progress. The **StreamEventProcessor** mode is typically **unified** (handles thinking and tool events).
- **DIRECT** — Used for simpler queries (e.g. "what is GDP?"). A shorter system prompt and **only local tools**; no "thinking" segment; processor mode **chat**. This reduces latency and cost when MCP is not needed.

Routing is implemented in **`ai/routing.py`** (e.g. `check_intent()`). The result is passed into the stream so that the correct system prompt and tool set are used for the single LLM call.

---

## Streaming pipeline

The core streaming logic lives in **`backend/app/utils/stream.py`** (and related **`stream_processor.py`**, **`responses_stream.py`**).

- **`stream_text()`** (or equivalent) — Calls **LiteLLM** (or the configured client) with the conversation messages, system prompt, and tools. The LLM returns a stream of chunks (text deltas, tool calls). For each **tool call** requested by the model:
  - If the tool is **local**, the backend executes the corresponding Python function and passes the result back into the stream as a tool result.
  - If the tool is **MCP**, the backend calls **`call_mcp_tool(tool_name, arguments)`** (Data360 MCP client in **`ai/mcp_tools/`**), then formats the response and sends it as a tool result in the stream.
- **SSE events** — The backend emits events such as: message-start, text-delta, tool-call (input), tool-call (output), data-thinking, data-stage, finish (with usage). The **StreamEventProcessor** in **`utils/stream_processor.py`** maps these to **message parts** (text, tool-invocation, thinking, etc.) and to **usage** (tokens). The frontend consumes the stream and updates the message list and artifacts (e.g. charts) from these parts.
- **Protocol** — Event types and payload shapes are defined in **`ai/protocols/stream.py`** (or equivalent) so that the frontend and backend agree on `data-thinking`, `data-stage`, and other custom events.

---

## Tool execution (local vs MCP)

- **Local tools** — Implemented in **`ai/tools/`** (e.g. `document.py`, `suggestions.py`, `weather.py`). Registered with a name and schema; when the LLM requests a call, the backend looks up the function and runs it in-process, then returns the result to the model in the stream.
- **MCP tools** — The backend does not implement Data360 operations; it delegates to the **Data360 MCP server**. Tool **definitions** (name, description, parameters) are fetched via **`get_mcp_tools()`** and cached. When the LLM requests an MCP tool, the executor calls **`call_mcp_tool(tool_name, arguments)`**, which sends a request to the MCP server (HTTP/SSE), waits for the result, and returns it. The result is then formatted and sent back in the stream as a tool result; **StreamEventProcessor** turns it into message parts (e.g. chart artifact, search result) for the frontend.

---

## Resumable streams

When **Redis** is configured and the feature is enabled:

- The backend assigns a **stream id** to each stream and writes **chunks** (e.g. SSE events or serialized deltas) to Redis keyed by stream id and sequence number.
- If the **client disconnects**, the backend can continue generating and writing chunks to Redis. When the client **reconnects** (e.g. with the same stream id in a resume request), the backend can read the remaining chunks from Redis and stream them to the client, or continue generation from the last checkpoint. The exact resume protocol (e.g. **`chat_resume.py`**, **`utils/resumable_stream.py`**) defines how the client requests resume and how the backend serves the tail of the stream.

---

## Observability

- **Token usage** — Tracked in **`ai/observability/token_usage.py`** (or equivalent) and stored in `lastContext` (or similar) on the chat so that the UI or admins can see usage per conversation.
- **Logging** — Errors and key events (e.g. stream start, tool call, MCP failure) are logged with the app logger so that operations can trace behavior without exposing internals to the client.

---

## Summary

- **Single entry:** POST /api/chat → load/create chat, save user message, route intent (RESEARCH vs DIRECT), prepare tools (local + MCP), then one **stream_text** call that drives the LLM and tool execution.
- **RESEARCH** uses thinking and MCP tools; **DIRECT** uses a simpler prompt and local tools only.
- **Streaming** is SSE; **StreamEventProcessor** maps raw events to message parts and usage. **Resumable streams** (when Redis is used) allow the user to reconnect and receive the rest of the response after a disconnect.

The next document, [Integrations](integrations.md), describes the Data360 MCP client and LLM (LiteLLM) configuration in more detail.
