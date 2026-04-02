---
id: FE-007
repo: vercel-ai-chatbot
title: Mobile — chat input jumps behind keyboard on iOS Safari
status: pending
priority: high
depends_on: []
blocks: []
---

# FE-007 — iOS Safari Keyboard Pushes Chat Input Off-Screen

## Goal

On iPhone (~390px viewport, iOS Safari), tapping the chat input field causes the soft keyboard to appear and push the entire layout upward, leaving the input field hidden behind the keyboard. The chat is essentially unusable on mobile until this is fixed.

## Context

- **Main layout:** `frontend/components/chat.tsx` — outer container (line 606) uses `flex h-dvh min-w-0 touch-pan-y flex-col bg-background`. The sticky input bar (line 683) is `sticky bottom-0 z-1` inside that container.
- **Input component:** `frontend/components/multimodal-input.tsx` — renders a `<PromptInputTextarea>` (`frontend/components/elements/prompt-input.tsx`) with a `ref`; focus is triggered programmatically (line 496 has `autoFocus`).
- **Root layout:** `frontend/app/layout.tsx` — `<html>` uses `h-dvh overflow-hidden` (line 59); `<body>` uses `antialiased flex h-full flex-col overflow-hidden` (line 69). The `viewport` export (line 26) sets `maximumScale: 1`.
- **Root issue:** iOS Safari resizes the visual viewport when the keyboard appears but does **not** resize `window.innerHeight` / `100dvh` in the same tick, causing `h-dvh` containers to temporarily overflow and the `sticky bottom-0` element to scroll out of view behind the keyboard.
- The greeting/empty-state in `chat.tsx` (lines 619–638) uses hardcoded `pb-24`/`pb-32` — the same issue occurs there when the user opens the app fresh on mobile.

## Implementation hints

- **Entry point:** `frontend/components/chat.tsx` → line 683, the `sticky bottom-0` input wrapper div. `frontend/app/layout.tsx` → `export const viewport` (line 26).
- **Current behavior:** `position: sticky; bottom: 0` keeps the input at the bottom of the scroll container. iOS Safari's soft keyboard shrinks the visual viewport but the layout's `dvh` sizing doesn't update synchronously, so the input scrolls behind the keyboard.
- **Desired behavior:** The input should always remain above the keyboard when it opens.
- **Recommended approach (try in order):**
  1. **CSS meta tag (lowest effort):** Add `interactiveWidget: 'resizes-content'` to the `viewport` export in `frontend/app/layout.tsx`. This tells iOS Safari to resize the layout viewport when the keyboard appears, making `dvh` and `sticky bottom-0` work correctly. Next.js renders this as `<meta name="viewport" content="..., interactive-widget=resizes-content">`. Supported on iOS Safari 16+ and Chrome Android.
  2. **JS `visualViewport` fallback:** If option 1 is insufficient on iOS 15, create a `useVisualViewport` hook that listens to `window.visualViewport` resize/scroll events and applies `bottom: window.innerHeight - visualViewport.height - visualViewport.offsetTop` as an inline style override on the input wrapper div.
- **Test file:** No Playwright e2e tests currently exist for this (see `frontend/playwright.config.ts` for config). Add a test at `frontend/tests/e2e/mobile-input.spec.ts` using a 390×844 viewport with `hasTouch: true`, asserting the input bounding box is within the visual viewport after a tap.
- **Prior art:** `multimodal-input.tsx` line 224 already has a `width > 768` guard for auto-focus — mobile awareness is present in the codebase.
- **Gotchas:**
  - `interactive-widget=resizes-content` is only supported on iOS Safari 16+. For iOS 15, the JS `visualViewport` approach is needed.
  - Do not remove `maximumScale: 1` from the viewport config — it prevents double-tap zoom on input fields.
  - Validate that `overflow-hidden` on `<html>` and `<body>` does not interfere with the fix (the inner `chat.tsx` container handles scroll via `absolute inset-0 overflow-y-auto`).

## Acceptance criteria

- [ ] On iPhone (Safari, ~390px / 390×844), tapping the chat input opens the keyboard and the input field remains fully visible above the keyboard — it does not jump behind it.
- [ ] On the greeting/empty state (no messages yet), the same behavior holds when tapping the input.
- [ ] Desktop layout (≥768px) is visually unchanged.
- [ ] No layout shift when the keyboard is dismissed.
- [ ] `frontend/app/layout.tsx` `viewport` export is updated (e.g. `interactiveWidget: 'resizes-content'`) or a `useVisualViewport` JS hook is implemented.
- [ ] Playwright test at `frontend/tests/e2e/mobile-input.spec.ts` passes on a 390×844 viewport with `hasTouch: true`, asserting input is in the visible viewport after tap.

## Out of scope

- Font scaling / zoom on input focus (already handled by `maximumScale: 1`).
- Android Chrome layout issues (validate incidentally but iOS Safari is primary).
- Styling changes to the input component itself.

## Dependencies

- None.
