---
github_issue: 98
id: FE-011
repo: vercel-ai-chatbot
title: Main narrative streaming must not override user scroll-up
status: pending
priority: high
depends_on: []
blocks: []
soft_depends_on:
  - FE-003
---

# FE-011 — Main narrative streaming must not override user scroll-up

## Goal

When the assistant streams the main answer text (outside the thinking UI), users who scroll up to read earlier messages must not be pulled back to the bottom on every token or chunk. The chat should respect “user has left the bottom” reliably, matching the intended FE-003 behavior.

## Context

- **Symptom:** Users report they cannot scroll up while the main narrative streams; the viewport keeps jumping to the bottom.
- **Stick-to-bottom (FE-003):** `frontend/components/messages.tsx` — `useEffect` (~203–222) calls `virtualizer.scrollToIndex(virtualItemCount - 1)` when `status` is `streaming` or `submitted`, `isAtBottom` is true, and dependencies such as `lastMessageTextLength` or `streamingThinkingScrollKey` change. Comments state that if the user scrolls up, we should not force the viewport down.
- **Gating signal:** `isAtBottom` comes from `frontend/hooks/use-messages.tsx` → `frontend/hooks/use-scroll-to-bottom.tsx`. Scroll position is reflected in React state via `setIsAtBottom` only after a **200ms** debounce when scrolling settles (`handleScroll` → `setTimeout(..., 200)`). `isAtBottomRef` is updated on the next animation frame when the user scrolls, but **`PureMessages` does not read the ref** — it only uses `isAtBottom` state.
- **Why main narrative matters:** When the model streams plain text into the last assistant message, `lastMessageTextLength` changes often, so the effect re-runs frequently. Any window where `isAtBottom` state is still `true` after the user has scrolled up will re-trigger stick-to-bottom.
- **Related:** FE-003 added `streamingThinkingScrollKey` for thinking/tool updates; this task addresses the same scroll pipeline when **text** (main narrative) is what changes.

## Implementation hints

- **Entry point:** `frontend/components/messages.tsx` — stick-to-bottom `useEffect` (deps include `lastMessageTextLength`, `streamingThinkingScrollKey`, `isAtBottom`).
- **Root cause hypothesis:** Stale `isAtBottom` **state** vs. **ref** after scroll-up; or the 20px “at bottom” threshold in `checkIfAtBottom()` keeping users classified as “at bottom” when they intended to read above the fold.
- **Directions to evaluate:** (1) Gate stick-to-bottom on `isAtBottomRef.current` (expose from hook) or sync state immediately when `checkIfAtBottom()` flips to false; (2) shorten or split debounce so “left bottom” updates immediately while “reached bottom” can stay debounced; (3) add an explicit “user scrolled up” latch for the duration of the current assistant stream; (4) E2E test that scrolls up mid-stream and asserts scroll position is not forced back.
- **Test file:** `frontend/tests/e2e/chat.test.ts` (extend) or unit/integration tests around scroll behavior if faster to stabilize.

## Acceptance criteria

- [ ] While the last assistant message is **streaming plain text** (main narrative, not only thinking parts), if the user scrolls the main chat viewport **up** away from the bottom, the list **does not** programmatically scroll back to the last message on subsequent stream updates for that turn (until the user explicitly scrolls to bottom or uses the “scroll to bottom” control).
- [ ] When the user remains at the bottom, the viewport still follows new tokens (stick-to-bottom preserved for the default case).
- [ ] Automated test covers “scroll up mid-stream → content continues streaming → viewport stays where the user scrolled” (Playwright or equivalent in this repo).
- [ ] Existing FE-003 behavior for thinking/tool fingerprint updates remains coherent (no regression: still scrolls when at bottom).

## Out of scope

- Changing markdown or narrative rendering; backend token pacing.
- Replacing the virtualizer (unless a minimal change is required for measurement).

## Dependencies

- **FE-003** — same scroll/stick-to-bottom area; coordinate so acceptance criteria for “respect scroll-up” are consistent across thinking and main text phases.
