# Integrations

This document describes how the backend integrates with **external services**: the Data360 MCP client (tool discovery and execution), LiteLLM and the LLM provider, and optional services (e.g. Azure AD, which is covered in [Authentication](authentication.md)).

---

## Data360 MCP client

The backend uses the **Data360 MCP server** to perform data and chart operations. It does not implement search, metadata, disaggregation, data fetch, or chart generation itself; it **calls the MCP server** and passes results back into the chat stream.

### Configuration

- **`MCPSettings`** in **`app/config.py`** (env prefix **`MCP_`**):
  - **`server_url`** — Base URL of the MCP server (e.g. HTTP or SSE endpoint).
  - **`ssl_verify`** — Whether to verify TLS (set false only for dev with self-signed or proxy).
  - **`timeout`** — HTTP timeout in seconds for individual MCP requests.
  - **`load_timeout`** — Max seconds to wait when loading the tool list at chat start; avoids hanging if the server is unreachable.
  - **`tools_cache_ttl_seconds`** — How long to cache the list of MCP tools (0 = no cache).

### Tool discovery: `get_mcp_tools()`

- Implemented in **`app/ai/mcp_tools/`** (e.g. **`data360_mcp.py`**, **`_client.py`**). The backend connects to the MCP server (HTTP or SSE, depending on config) and requests the **list of tools** (name, description, parameters schema). This list is **cached** for `tools_cache_ttl_seconds` so that not every chat request triggers an MCP round-trip. When preparing tools for the LLM, **`prepare_tools()`** (in **`api/v1/utils/tool_setup.py`**) merges local tools with the cached MCP tool definitions. Each MCP tool is marked (e.g. `type: "mcp"`) so that the stream executor knows to call **`call_mcp_tool`** instead of a local function.

### Tool execution: `call_mcp_tool(tool_name, arguments)`

- When the LLM requests an MCP tool, the streaming code (e.g. in **`utils/stream.py`**) calls **`call_mcp_tool(tool_name, arguments)`**. The MCP client sends the tool name and arguments to the Data360 MCP server (in the format required by the MCP protocol), waits for the response, and returns the result. The result is then formatted (e.g. as a tool result message or artifact) and injected into the stream so that **StreamEventProcessor** can turn it into message parts (e.g. chart, search results) for the frontend. Failures (timeout, connection error, MCP error) are handled so that the stream can emit an error tool result or retry according to policy.

### Summary

- The backend is an **MCP client**: it discovers tools from the Data360 MCP server, caches them, and invokes them by name and arguments during chat. It does not store or interpret Data360 data; it only forwards tool calls and streams back results.

---

## LiteLLM and LLM provider

The backend uses **LiteLLM** (or a similar abstraction) to talk to the **LLM provider** (e.g. Azure OpenAI). This keeps the rest of the code independent of the provider: model names and endpoints are configured via **ModelSettings** and environment variables.

### Configuration

- **`ModelSettings`** in **`app/config.py`**:
  - **`MODEL_PROVIDER`** — Provider prefix (e.g. `azure/`).
  - **`CHAT_MODEL`** — Main chat model (e.g. `gpt-4o`).
  - **`CHAT_MODEL_REASONING`** — Model used for RESEARCH / "thinking" (e.g. `o1-mini`).
  - **`TITLE_MODEL`** — Model for generating chat titles.
  - **`ARTIFACT_MODEL`** — Model for artifact generation if used separately.

- **Routing:** **`ROUTING_MODEL`**, **`ROUTING_HISTORY_LIMIT`** for the intent step.

- Azure-specific variables (e.g. **`AZURE_API_KEY`**, **`AZURE_API_BASE`**) are typically set in the environment and read by LiteLLM or the app's **`ai/client.py`** so that the client points to the correct endpoint and authenticates.

### Usage

- **`app/ai/client.py`** — Builds the LiteLLM (or OpenAI-compatible) client and exposes sync/async methods for completion and streaming. The streaming entry point (**`utils/stream.py`**) uses this client to send the conversation and tools and to consume the stream of chunks (text deltas, tool calls). The client handles retries, timeouts, and API key injection so that business logic does not depend on provider details.

---

## Optional external services

- **Azure AD** — Used only when MSAL auth is configured. The backend validates the token (from the MSAL cookie) and optionally looks up or creates a user by `azure_oid`. No outbound call to Azure is required for every request if the token is a JWT that can be validated locally (depending on configuration).
- **Email** — Password reset and possibly other flows may send email via an SMTP or sendgrid-style API; configuration and implementation are outside the scope of this architecture doc. Feedback or notifications could also use an external service.
- **Charts API** — The **Data360 MCP server** (not the chat backend) may POST Vega-Lite specs to an external Charts API; that integration is documented in the Data360 MCP architecture. The chat backend only receives chart references or URLs from MCP tool results.

---

## Summary

- **Data360 MCP** — Backend discovers and caches MCP tools, then calls **`call_mcp_tool`** when the LLM requests a Data360 tool; results are streamed back as tool results and rendered as message parts/artifacts.
- **LiteLLM / LLM provider** — Model and endpoint are configurable; the backend uses a single client abstraction for completions and streaming.
- **Other services** — Azure AD for MSAL validation; optional email or other APIs for password reset and notifications.

The next document, [Deployment and operations](deployment-and-operations.md), covers environment variables, running the app, and deployment.
