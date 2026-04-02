---
id: FE-004
repo: vercel-ai-chatbot
title: UI — return to thinking after completion
status: pending
depends_on: []
blocks: []
---

# FE-004 — “View research steps” after response completes

## Goal

After the assistant message finishes, users can easily reopen the thinking protocol (collapsed by default for saved messages) via a visible control.

## Context

- `frontend/components/message-thinking.tsx`: `shouldDefaultOpen`, Collapsible, Sheet, `ReasoningTrigger`.
- Parent: `frontend/components/message.tsx` (splits `data-thinking` parts vs answer).

## Acceptance criteria

- [ ] When thinking exists and is collapsed after completion, a labeled control (e.g. “View research steps”) opens the same UX as the live stream (collapsible or sheet).
- [ ] Keyboard and screen-reader accessible.
- [ ] Does not duplicate streaming-only UI in a confusing way.

## Dependencies

- None.
