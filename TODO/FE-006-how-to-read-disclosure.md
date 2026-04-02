---
id: FE-006
repo: vercel-ai-chatbot
title: Optional “How to read” presentation
status: pending
priority: low
depends_on:
  - FE-005
blocks: []
---

# FE-006 — “How to read” block styling

## Goal

If the model emits **How to read** (or equivalent) per BE-001, present it as secondary help: smaller type, collapsible, or muted — per design.

## Context

- Builds on Streamdown styling from **FE-005**.
- May use `<details>`-like pattern or a compact callout; check a11y (expand/collapse).

## Implementation hints
- **Entry point:** `frontend/components/elements/response.tsx` or `frontend/components/message.tsx` (lines 35–36 where `<MessageContent>` wraps `<Response>`).
- **Current behavior:** No "How to read" section exists. Response renders markdown via Streamdown — any "How to read" block emitted by the model is rendered as plain markdown, unstyled.
- **Desired behavior:** Detect a "How to read" heading/section in the model output and render it with secondary styling — smaller type, muted color, optionally collapsible.
- **Approach options:**
  1. Custom remark plugin that detects an `## How to read` heading and wraps its content in a `<details>` element.
  2. Add a `components.h2` override in Streamdown that checks heading text and applies a "how-to-read" class.
  3. Post-render: scan rendered children for headings with matching text.
  - Option 2 is most maintainable — add to `components` prop in response.tsx (alongside existing `p` and `claim` overrides, lines 143–147).
- **Collapsible:** Radix UI `Collapsible` is already used in `message-thinking.tsx` — consistent pattern to follow.
- **Depends on FE-005:** Heading styles must be stable before this component conditionally overrides one heading variant.
- **Test file:** `frontend/tests/e2e/chat.test.ts`. Test that a response containing "## How to read" renders the section collapsed/muted.
- **Gotchas:** Must handle absent section gracefully (most responses won't have it). Model may vary heading text — consider matching case-insensitively or on a list of aliases ("How to read", "How to interpret", "Reading guide").

## Acceptance criteria

- [ ] “How to read” content is visually subordinate to Summary/Analysis.
- [ ] Accessible expand/collapse if implemented.
- [ ] Skipped gracefully when section absent.

## Dependencies

- **FE-005** — base heading/body styles.
