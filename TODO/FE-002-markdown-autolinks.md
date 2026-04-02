---
id: FE-002
repo: vercel-ai-chatbot
title: Assistant markdown — autolink bare URLs
status: pending
depends_on: []
blocks: []
---

# FE-002 — Bare URL autolinking in assistant responses

## Goal

Ensure raw URLs in assistant markdown render as clickable links when the model does not use `[text](url)` syntax.

## Context

- Pipeline: `frontend/components/elements/response.tsx` (Streamdown + `rehype-sanitize`).
- Writer prompt in BE-001 also asks for explicit markdown links; this task covers the fallback.

## Acceptance criteria

- [ ] Remark/rehype pipeline autolinks `http(s)://...` safely.
- [ ] `rehype-sanitize` schema still allows `a[href]` for allowed URL schemes.
- [ ] Tests or manual checklist for: link text, code blocks (no autolink inside code), existing markdown links unchanged.

## Dependencies

- None.
