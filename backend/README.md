# Backend API

FastAPI backend for AI Chatbot application.

## Setup

See `SETUP.md` for detailed setup instructions.

## Quick Start

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload --port 8001
```

## Tests

From this directory, run the full suite or a subset:

```bash
uv run pytest
uv run pytest tests/test_stream_processor.py tests/test_stream_text.py -v
```

`tests/test_stream_processor.py` covers persisted assistant parts from SSE. `tests/test_stream_text.py` mocks `client.chat.completions.create` to lock in live streaming behavior (delimiter, fallback, holdback, tool ordering).

## Documentation

- API docs available at `/docs` when server is running
- See individual migration guides in the `plans/` directory
