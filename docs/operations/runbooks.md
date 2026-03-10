# Runbooks

Operational procedures for common tasks.

---

## Restart services

### Local

```bash
# Backend: Ctrl+C, then
uv run uvicorn app.main:app --reload --port 8001

# Frontend: Ctrl+C, then
pnpm dev
```

### Docker

```bash
docker compose restart backend
docker compose restart frontend
# Or restart all:
docker compose restart
```

---

## Run database migrations

```bash
cd backend
uv run alembic upgrade head
```

For a new migration:

```bash
uv run alembic revision --autogenerate -m "description"
# Edit the generated file if needed, then:
uv run alembic upgrade head
```

Rollback one migration:

```bash
uv run alembic downgrade -1
```

---

## Clear Redis (if used)

```bash
redis-cli FLUSHALL
```

Or connect to the Redis used by the app and clear specific keys. Restart the backend after clearing if needed.

---

## Rotate JWT secret key

1. Generate new key: `openssl rand -hex 32`
2. Set `JWT_SECRET_KEY` to the new value.
3. Set `JWT_SECRET_KEY_OLD` to the current key (for validation during transition).
4. Deploy backend with both keys.
5. After old tokens expire, remove `JWT_SECRET_KEY_OLD`.

---

## Enable maintenance mode

Set `MAINTENANCE_MODE=true` in the frontend environment. The app will show the maintenance page instead of the chat UI.

---

## Invalidate all sessions (deploy-time)

Set `SESSION_VERSION` to a new value (e.g. build ID or timestamp) in the backend environment. The frontend checks `X-Session-Version` from `/api/auth/me` and can force logout when it changes.
