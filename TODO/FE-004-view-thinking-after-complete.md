---
id: FE-004
repo: vercel-ai-chatbot
title: UI — return to thinking after completion
status: pending
priority: medium
depends_on: []
blocks: []
---

# FE-004 — “View research steps” after response completes

## Goal

After the assistant message finishes, users can easily reopen the thinking protocol (collapsed by default for saved messages) via a visible control.

## Context

- `frontend/components/message-thinking.tsx`: `shouldDefaultOpen`, Collapsible, Sheet, `ReasoningTrigger`.
- Parent: `frontend/components/message.tsx` (splits `data-thinking` parts vs answer).

## Implementation hints
- **Entry point:** `frontend/components/message-thinking.tsx` → `MessageThinking()` line 178, `Reasoning` wrapper component line 242.
- **Current collapse behavior:** `shouldDefaultOpen = !isFromSavedParts` (line 230). Opens when streaming (`isFromSavedParts=false`), **auto-closes** after streaming ends via `hasAutoClosedRef` flag (line 77). Loaded-from-DB messages start collapsed.
- **The problem:** After auto-close, there is no persistent visible control to re-open. `ReasoningTrigger` (imported from `./elements/reasoning`, line 20) serves as the toggle but may be visually unclear when collapsed.
- **Desired behavior:** After streaming ends and collapsible auto-closes, a clearly-labeled persistent control ("View research steps" or similar) remains visible and clickable to re-expand.
- **State to use:** `isOpen` controlled by `useControllableState` (line 244–245). `isLoading` prop (line 164) — false after streaming ends. Use `isLoading === false && isFromSavedParts` to detect the "completed, loaded from history" state.
- **Sheet modal:** A separate full-modal view already exists via `sheetOpen` state (line 185), triggered by Maximize2 button (lines 259–268). This is the "expand to full view" path — may satisfy the requirement.
- **Test file:** `frontend/tests/e2e/chat.test.ts`. No thinking-collapse specific tests.
- **Gotchas:** Auto-close fires only once via `hasAutoClosedRef` (line 77) — any re-open after that is permanent. `ReasoningTrigger` is imported from a separate `./elements/reasoning` file — check that file for the trigger's current label text before changing.

## Acceptance criteria

- [ ] When thinking exists and is collapsed after completion, a labeled control (e.g. “View research steps”) opens the same UX as the live stream (collapsible or sheet).
- [ ] Keyboard and screen-reader accessible.
- [ ] Does not duplicate streaming-only UI in a confusing way.

## Dependencies

- None.
