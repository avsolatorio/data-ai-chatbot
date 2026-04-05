---
id: FE-003
repo: vercel-ai-chatbot
title: Chat scroll — stick to bottom during thinking
status: done
priority: medium
depends_on: []
blocks: []
---

# FE-003 — Scroll position while thinking

## Goal

Keep the main chat viewport aligned with the latest activity while the system is in the thinking/planning stream (especially when tool parts update without text length changes).

## Context

- `frontend/components/messages.tsx`: `streamingThinkingScrollKey`, `isAtBottom`, virtualizer `scrollToIndex`.
- Inner panel: `frontend/components/message-thinking.tsx` (already scrolls its own content).

## Implementation hints
- **Entry point:** `frontend/hooks/use-scroll-to-bottom.tsx` — `useScrollToBottom()` hook manages `isAtBottom` state (line 7) and scroll-to-bottom triggers.
- **Scroll logic:** `isAtBottom` detected via `scrollTop + clientHeight >= scrollHeight - 20` threshold (line 17–23). Auto-scroll fires when streaming content changes AND `isAtBottom` is true (messages.tsx lines 212–231).
- **Current behavior:** During thinking/streaming, scroll-to-bottom only fires if user was already at bottom. If user scrolls up to read earlier content while thinking streams, the view stays put. **This is the correct behavior** — the issue is the initial jump when thinking first appears.
- **Virtualizer:** `useVirtualizer` (TanStack) in `messages.tsx` line 88. Scroll-to-index via `virtualizer.scrollToIndex(index, { align, behavior })` lines 109, 133, 143, 177, 220.
- **What "submitted" triggers:** Status change to `"submitted"` fires `virtualizer.scrollToIndex(virtualItemCount - 1)` (lines 104–114) — smooth scroll to last item.
- **Test file:** `frontend/tests/e2e/chat.test.ts`. No scroll-specific tests exist.
- **Gotchas:** Firefox special case — `measureElement` callback disabled (lines 96–100), uses estimate only. Virtual list height mismatch between `estimateSize()` and actual height causes scroll jumps. `isAtBottom` uses 20px threshold (not exact) for subpixel rendering tolerance. `hasSentMessage` flag (from useMessages) distinguishes user-sent vs loaded messages — use this to only auto-scroll on user-initiated messages.

## Acceptance criteria

- [x] Thinking/tool updates bump a scroll key or equivalent so the main list scrolls when content grows and the user was already at the bottom.
- [x] Document or config flag if product chooses “force bottom during thinking” vs respect user scroll-up.
- [x] No runaway scroll when the user has intentionally scrolled away (unless forced mode is enabled).

## Dependencies

- Optional product decision (see **CROSS-REPO-GRAPH** scroll policy); can implement conservative behavior first.
