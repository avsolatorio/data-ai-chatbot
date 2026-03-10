# Deployment Rendering: Markdown and PCN Claim Tags

When deploying to Azure App Service (or similar), you may see nested markdown bullets lose indentation or PCN claim tags not rendering. This document explains causes and fixes.

---

## 1. Streamdown package

Streamdown renders markdown (including raw HTML like `<claim>`). If it is missing or not bundled, responses and PCN claims will not render correctly.

**In this repo:**

- `streamdown` is in `dependencies` in `frontend/package.json`
- `streamdown` is in `transpilePackages` in `frontend/next.config.ts`

**In your deployment:**

1. Run `pnpm install` before `pnpm build` so `node_modules/streamdown` exists.
2. If using standalone output, verify: `ls .next/standalone/node_modules/streamdown`
3. If the app fails to load Streamdown, check DevTools Console for "streamdown" or "Cannot find module" errors.

---

## 2. Nested list indentation

**Cause:** Tailwind v4 picks up list classes from streamdown via `@source '../node_modules/streamdown/dist/index.js'` in `frontend/app/globals.css`. If that path does not resolve during the build, list styling breaks.

**Fixes:**

1. Run the build from the directory that contains `app/` and `node_modules/` (the frontend root).
2. Install dependencies before the build.
3. For pnpm, use `node-linker=hoisted` or `shamefully-hoist=true` in `.npmrc` if Tailwind cannot resolve streamdown.
4. Set `STREAMDOWN_DIST_PATH` to the absolute path to `streamdown/dist/index.js` if the build runs from a different directory.

**Verify after build:**

```bash
pnpm build
grep -l 'list-outside' .next/static/chunks/*.css
```

If you get a match, Tailwind saw streamdown. If not, re-check the steps above.

---

## 3. PCN claim tag not rendering

**Cause:** The `<claim>` tag is raw HTML rendered by Streamdown with `ClaimMarkStreamdown` from `@pcn-js/ui`. If it disappears in production, the tag may be stripped or the component may not run correctly.

**Checks:**

1. **Confirm the API returns `<claim>`** — Inspect the network response for chat messages; the `parts` should contain the literal `<claim id="..." ...>...</claim>` string.
2. **Check the browser console** — Look for React errors or mentions of "claim", "ClaimMark", "pcn", or "ClaimsProvider".
3. **Confirm the chat route uses the correct layout** — `Data360ClaimsProvider` must wrap the chat (in `app/(chat)/layout.tsx`). If the deployed app serves chat at a different path, the provider may not wrap it.
4. **Sanitization / WAF** — If a WAF or proxy sanitizes HTML, allow the `<claim>` tag and its attributes.

---

## Summary

| Issue | Fix |
|-------|-----|
| Nested bullets align left | Build from frontend dir, install deps first, use pnpm hoisting if needed |
| Claim tag missing | Confirm API returns `<claim>`, check console, allow tag through sanitization |
