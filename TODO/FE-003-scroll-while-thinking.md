---
id: FE-003
repo: vercel-ai-chatbot
title: Chat scroll — stick to bottom during thinking
status: pending
depends_on: []
blocks: []
---

# FE-003 — Scroll position while thinking

## Goal

Keep the main chat viewport aligned with the latest activity while the system is in the thinking/planning stream (especially when tool parts update without text length changes).

## Context

- `frontend/components/messages.tsx`: `streamingThinkingScrollKey`, `isAtBottom`, virtualizer `scrollToIndex`.
- Inner panel: `frontend/components/message-thinking.tsx` (already scrolls its own content).

## Acceptance criteria

- [ ] Thinking/tool updates bump a scroll key or equivalent so the main list scrolls when content grows and the user was already at the bottom.
- [ ] Document or config flag if product chooses “force bottom during thinking” vs respect user scroll-up.
- [ ] No runaway scroll when the user has intentionally scrolled away (unless forced mode is enabled).

## Dependencies

- Optional product decision (see **CROSS-REPO-GRAPH** scroll policy); can implement conservative behavior first.
