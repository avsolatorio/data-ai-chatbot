---
id: FE-009
repo: vercel-ai-chatbot
title: Chart and visualization previews respect Next.js basePath
status: pending
priority: medium
depends_on: []
blocks: []
---

# FE-009 — Chart and Visualization Previews Respect Next.js basePath

## Goal

When the app is deployed with a non-empty `NEXT_PUBLIC_BASE_PATH` (matching `next.config.ts` `basePath`), chart and Data360 visualization previews must load through the same-origin API under that prefix. Today, fetches use root-relative paths such as `/api/v1/charts/...`, which resolve to the host root in the browser and bypass the deployed app’s base path, so previews fail or load the wrong resource.

## Context

- **Symptom (feedback):** Visualization output does not use the base path — previews break or request incorrect URLs when the app is not served at `/`.
- **Config:** `frontend/lib/config.ts` → `getBasePath()` reads `NEXT_PUBLIC_BASE_PATH` (trailing slashes stripped). This must stay aligned with `frontend/next.config.ts` `basePath`.
- **Chart loading:** `frontend/components/data360/chart-preview.tsx` — `proxyChartUrl()` normalizes tool and markdown chart URLs to a path used in `fetch(proxiedUrl)` (see ~48–59, ~202–207). Root-relative paths are returned as-is (e.g. `/api/v1/charts/...`), which is incorrect under basePath.
- **Call sites:** Inline chart URLs in assistant text (`frontend/components/message.tsx` — `CHART_URL_REGEX`, `ChartPreview`) and `tool-data360_get_viz_spec` output (`output.url` passed to `ChartPreview`) both funnel through the same component; fixing URL construction in one place should cover both.
- **Prior art:** `message.tsx` already uses `` `${getBasePath()}/chat/${chatId}` `` for in-app links (~1043); the chart fetch path should follow the same prefixing rules.

## Implementation hints

- **Entry point:** `frontend/components/data360/chart-preview.tsx` → `proxyChartUrl()` (and optionally rename/clarify if it becomes “resolve chart fetch URL”).
- **Current behavior:** For non-HTTP(S) input, paths starting with `/` are passed unchanged to `fetch`, so the browser requests `origin + /api/...` instead of `origin + basePath + /api/...`.
- **Desired behavior:** After normalizing to a pathname (including stripping absolute URLs to `pathname + search`), if `getBasePath()` is non-empty and the path is not already under that prefix, prepend it (avoid double-prefixing when the backend already returns `/mybase/api/...`).
- **Edge cases:** Empty base path → unchanged behavior. Full backend URLs: pathname may already include base path — detect before prepending. Query strings must be preserved.
- **Tests:** Search for existing tests touching `ChartPreview`, `chart-preview`, or basePath; add or extend a small unit test for `proxyChartUrl` / URL resolution if a test harness exists (`frontend/**/*.test.ts`, `*.spec.ts`). If none, add a minimal test next to the module or document manual verification: run with `NEXT_PUBLIC_BASE_PATH=/app` and confirm network requests target `/app/api/v1/charts/...`.

## Acceptance criteria

- [ ] With `NEXT_PUBLIC_BASE_PATH` set (e.g. `/app`), `ChartPreview`’s chart JSON request URL is under that prefix (e.g. `/app/api/v1/charts/...`), not only `/api/v1/charts/...`, unless the incoming URL already includes the prefix.
- [ ] With an empty base path, behavior matches current production (requests still go to `/api/v1/charts/...`).
- [ ] `tool-data360_get_viz_spec` chart preview and inline markdown chart URLs both render when the app is served under a subpath.
- [ ] No duplicate path segments when the model or API returns URLs that already contain the base path.

## Out of scope

- Changing backend chart URL format (unless a follow-up is needed for malformed absolute URLs).
- Non-chart artifacts or unrelated routing.

## Dependencies

None.
