# Data Flow

This document describes how **requests** and **responses** flow through the system for key operations.

---

## Chat message flow

### Request path

1. **User** types a message and submits in the chat input.
2. **Frontend** (`useChat`) builds the request body (chat id, messages, model, visibility) and POSTs to `/api/chat` with `credentials: 'include'` (cookies sent).
3. **Next.js proxy** catches `/api/chat` and forwards the request to the backend at `NEXT_PUBLIC_API_URL` or `SERVER_API_URL`.
4. **Backend** receives the request:
   - **Rate limit** — Middleware checks limits (per user or IP).
   - **Auth** — `get_current_user` resolves the user from JWT, MSAL cookie, or session token.
   - **Chat** — Load or create chat; verify ownership if existing.
   - **Save** — Persist user message to PostgreSQL.
   - **Route** — Classify intent (RESEARCH vs DIRECT).
   - **Tools** — Prepare local + MCP tools.
   - **Stream** — Call LLM, execute tools, emit SSE events.

### Response path

1. **Backend** streams SSE events (text-delta, tool-call, data-thinking, data-stage, finish).
2. **Proxy** pipes the stream to the client without buffering.
3. **Frontend** (`useChat`) consumes the stream, updates messages and status, and `onData` handles special parts (thinking, stages).
4. **UI** re-renders with new message parts and artifacts (e.g. charts).

---

## Auth flow (email/password)

1. **User** submits login form (email, password).
2. **Frontend** POSTs to `/api/auth/login` (or proxy forwards to backend).
3. **Backend** verifies password, creates JWT, sets `auth_token` cookie (httpOnly), returns token payload.
4. **Frontend** redirects or stays on chat; subsequent requests include the cookie automatically.

---

## Auth flow (Azure AD / MSAL)

1. **User** clicks "Sign in with Microsoft".
2. **Frontend** redirects to Azure AD; user authenticates.
3. **Azure AD** redirects back with token; frontend sends token to `/api/auth/msal/set-token` (or equivalent).
4. **Backend** validates token, sets MSAL cookie (httpOnly), returns success.
5. **Frontend** redirects to chat; subsequent requests include the cookie.

---

## MCP tool execution flow

1. **LLM** requests an MCP tool (e.g. `search_indicators`) with arguments.
2. **Backend** stream executor calls `call_mcp_tool(tool_name, arguments)`.
3. **MCP client** sends request to Data360 MCP server (HTTP or SSE).
4. **Data360 MCP** executes the tool (e.g. calls Data360 API), returns result.
5. **Backend** formats result as tool result, injects into stream.
6. **StreamEventProcessor** turns it into message parts (e.g. chart artifact).
7. **Frontend** renders the artifact (e.g. chart preview, search results).
