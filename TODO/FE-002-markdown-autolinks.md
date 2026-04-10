---
github_issue: 92
id: FE-002
repo: vercel-ai-chatbot
title: Assistant markdown — autolink bare URLs
status: pending
priority: low
depends_on: []
blocks: []
---

# FE-002 — Bare URL autolinking in assistant responses

## Goal

Ensure raw URLs in assistant markdown render as clickable links when the model does not use `[text](url)` syntax.

## Context

- Pipeline: `frontend/components/elements/response.tsx` (Streamdown + `rehype-sanitize`).
- Writer prompt in BE-001 also asks for explicit markdown links; this task covers the fallback.

## Implementation hints
- **Entry point:** `frontend/components/elements/response.tsx` — Streamdown plugin chain at lines 31–40.
- **Current plugin chain:** `rehype-raw` → `rehype-sanitize(SANITIZE_SCHEMA)` → rehype-harden → rehype-katex. remark-gfm is installed (`package.json` line 102: `"remark-gfm": "^4.0.1"`) but NOT added to Streamdown's remark plugin list.
- **Desired behavior:** Add `remarkGfm` to Streamdown's remark plugins so bare URLs auto-link. For rehype-based approach, add `rehype-autolink-headings` (not yet installed — `npm install rehype-autolink-headings`).
- **Preferred approach:** Add `remark-gfm` (already installed, zero cost) to the Streamdown remark plugin array. Verify it doesn't conflict with existing rehype-sanitize schema.
- **Sanitize schema:** `SANITIZE_SCHEMA` defined at lines 20–27 — adds `claim` tag to allowed elements. Ensure `<a>` tags with `href` remain in schema after adding remark-gfm.
- **Test file:** `frontend/tests/e2e/chat.test.ts` (general e2e). No component-level tests. Add a test that renders a message with a bare URL and asserts it renders as `<a>`.
- **Gotchas:** `ResponseParagraph` wraps in `<div>` not `<p>` (line 102) to avoid React hydration errors with block children. remark-gfm also enables tables/strikethrough — confirm no visual regressions on existing responses.

## Acceptance criteria

- [ ] Remark/rehype pipeline autolinks `http(s)://...` safely.
- [ ] `rehype-sanitize` schema still allows `a[href]` for allowed URL schemes.
- [ ] Tests or manual checklist for: link text, code blocks (no autolink inside code), existing markdown links unchanged.

## Dependencies

- None.
