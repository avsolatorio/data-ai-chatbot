---
id: FE-006
repo: vercel-ai-chatbot
title: Optional “How to read” presentation
status: pending
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

## Acceptance criteria

- [ ] “How to read” content is visually subordinate to Summary/Analysis.
- [ ] Accessible expand/collapse if implemented.
- [ ] Skipped gracefully when section absent.

## Dependencies

- **FE-005** — base heading/body styles.
