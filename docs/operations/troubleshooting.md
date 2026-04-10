# Troubleshooting

Common issues and fixes for Data360 Chat.

---

## Database

### Connection refused / cannot connect

- **Check:** PostgreSQL is running (`pg_isready` or `psql -l`).
- **Check:** `DATABASE_URL` or `POSTGRES_*` variables are correct.
- **Check:** Database exists: `createdb chatbot` if needed.
- **Docker:** Ensure backend uses `db:5432` (service name) when in Docker Compose.

### Permission denied for table

- **Cause:** App user may not have grants on new tables.
- **Fix:** Run migrations with the user that has CREATE/GRANT; migrations using `migration_utils` grant to the app user. Ensure `POSTGRES_USER` matches the app user when running migrations.

### Migration errors

- **Check:** Database is up to date: `uv run alembic upgrade head`.
- **Check:** Migration files are in `backend/alembic/versions/`.
- **Check:** Schema matches models; resolve conflicts manually if needed.

---

## CORS and cookies

### CORS error in browser

- **Cause:** Frontend origin not in `CORS_ORIGINS`.
- **Fix:** Add the exact frontend URL (e.g. `https://chat.example.com`) to `CORS_ORIGINS`. No trailing slash. No wildcard when using credentials.

### Cookies not sent / session lost

- **Cause:** `COOKIE_DOMAIN` may be wrong; or frontend/backend on different origins without correct config.
- **Fix:** Set `COOKIE_DOMAIN` to the parent domain (e.g. `.example.com`) if frontend and backend share it. Ensure cookies use `Secure` in production and `SameSite` is appropriate.

---

## MCP and LLM

### MCP timeout / connection error

- **Cause:** Data360 MCP server unreachable or slow.
- **Fix:** Check `MCP_SERVER_URL` is correct and the backend can reach it. Increase `MCP_TIMEOUT` and `MCP_LOAD_TIMEOUT` if needed. For Docker, ensure `host.docker.internal` or the correct host is used if MCP runs on the host.

### Chat not responding / hanging

- **Cause:** Missing API keys or wrong LLM configuration.
- **Fix:** Ensure `backend/.env` has `OPENAI_API_KEY` (or Azure credentials) and `MODEL_PREFIX` (e.g. `openai/` or `azure/`). Check backend logs for LLM errors.

---

## Docker

### 404 on first access

- **Cause:** Stale browser cookies.
- **Fix:** Use incognito or clear cookies for localhost:3001.

### Database errors after volume deletion

- **Fix:** `docker compose down -v` then `docker compose up -d --build`.

### Missing root .env

- **Fix:** Create `.env` in project root with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.

---

## Ports

| Port | Service |
|------|---------|
| 3000 / 3001 | Frontend |
| 8001 | Backend |
| 5432 / 5433 | PostgreSQL |
| 6379 | Redis |

If a port is in use, change it in the respective config (e.g. `pnpm dev --port 3002`, uvicorn `--port 8002`).
