# Logging

This document describes how logging is configured and where logs go.

---

## Backend logging

### Configuration

| Variable | Purpose |
|----------|---------|
| `LOG_LEVEL` | DEBUG, INFO, WARNING, ERROR |
| `LOG_FILE` | Optional file path for app logger |
| `LOG_MAX_BYTES` | Rotating file handler max size |
| `LOG_BACKUP_COUNT` | Number of backup files to keep |

### Behavior

- **stdout** — All loggers (app, uvicorn, platform) write to stdout by default.
- **File** — When `LOG_FILE` is set, only the `app` logger is attached to the file. Uvicorn and platform logs stay on stdout so that container/orchestrator logs remain usable.
- **Format** — Structured logging with timestamps, levels, and message.

### Security

- Auth routes use hashed email and user ID in logs where possible.
- Tokens and full cookies are not logged.
- Reduce verbosity in production (`LOG_LEVEL=INFO` or `WARNING`).

---

## Frontend

Next.js and React logs go to the browser console in development. In production, configure your hosting platform for access logs and error tracking.
