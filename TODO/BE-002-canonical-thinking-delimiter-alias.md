---
github_issue: 86
id: BE-002
repo: vercel-ai-chatbot
title: Canonical thinking delimiter with optional LLM-facing alias normalization
status: pending
priority: medium
depends_on: []
blocks: []
soft_depends_on:
  - FE-010
---

# BE-002 — Canonical thinking delimiter with optional LLM-facing alias normalization

## Goal

Keep **`^ANSWER^`** as the single **invariant canonical delimiter** everywhere persisted and parsed (stream split, `StreamEventProcessor`, reload), while allowing **prompts** to instruct the model to emit a **different** string (alias) for maintainability. At generation time, the streaming layer should **normalize** alias → canonical so downstream code and historical messages stay consistent.

## Context

- **Canonical token (fixed for app lifetime):** `THINKING_TO_ANSWER_TOKEN` in `backend/app/ai/prompts.py` — currently `^ANSWER^`. This must remain the wire-format constant so stored assistant parts and FE assumptions do not drift.
- **Stream splitting:** `backend/app/utils/stream.py` — `stream_text()` buffers text and detects the delimiter (holdback, no-token fallback, tool boundaries). Any alias must be folded into this path **before** or **within** the same buffering rules.
- **Persistence:** `backend/app/utils/stream_processor.py` — consumes SSE after the model stream; normalized SSE should still expose the canonical split behavior (FE-010).
- **Chat wiring:** `backend/app/api/v1/chat.py` passes `thinking_to_answer_token=THINKING_TO_ANSWER_TOKEN` into `process_stream`.
- **Tests:** `backend/tests/test_stream_text.py`, `backend/tests/test_stream_processor.py` — extend with alias→canonical cases.
- **Related UX doc:** `TODO/FE-010-narrative-vs-thinking-separation.md` (soft dependency: same product area).

## Implementation hints

- **Entry point:** `stream_text()` in `backend/app/utils/stream.py`, in the `thinking_to_answer_token` branch where `text_buffer` accumulates (same area as FE-010 holdback).
- **Current behavior:** Only the literal `thinking_to_answer_token` (canonical) triggers phase switch; model output is streamed as-is.
- **Desired behavior:** Define one or more **LLM-facing alias strings** (e.g. in `prompts.py` or a small constant tuple next to `THINKING_TO_ANSWER_TOKEN`). While buffering, **replace occurrences of each alias with the canonical token** (longest-match-first if aliases overlap), then run existing delimiter detection on the result. Alternatively normalize each incoming `word_chunk` before append—evaluate which preserves holdback correctness.
- **Prompts:** `get_combined_system_prompt()` may tell the model to emit the **alias** only; document that the server rewrites to canonical. Keep canonical `^ANSWER^` documented for any code path that reads raw logs.
- **Safety:** Aliases must be **rare** strings to avoid accidental replacement inside user-visible prose; add unit tests for chunk-split aliases and false-positive avoidance.
- **Config:** Prefer **code constants** (tuple of aliases) over env toggles for the canonical token, to avoid the “old chats don’t parse” problem; optional env for **alias list only** is acceptable if defaults are safe.
- **Test command:** `uv run pytest backend/tests/test_stream_text.py backend/tests/test_stream_processor.py -v`

## Acceptance criteria

- [ ] Canonical delimiter used for splitting and persisted stream shape remains **`^ANSWER^`** (or explicitly renamed in one migration — default is keep literal).
- [ ] At least one **alias** can be configured in code and is **normalized to canonical** during streaming before delimiter logic runs.
- [ ] Existing `stream_text` tests still pass; new tests cover alias emitted across chunks and verify canonical split / no token in user stream for delimiter.
- [ ] Combined system prompt (or adjacent comment) documents: model may emit alias X; server normalizes to `^ANSWER^`.
- [ ] `uv run pytest backend/tests/test_stream_text.py backend/tests/test_stream_processor.py` passes.

## Out of scope

- Changing the frontend split helper (`frontend/lib/split-thinking-parts.ts`) unless SSE shape changes (it should not if normalization is server-side only).
- Migrating historical DB rows (already stored with `^ANSWER^` in body text).

## Dependencies

- **FE-010** (soft) — same narrative/thinking separation goals; this task refines how delimiter strings are managed without breaking stored messages.
