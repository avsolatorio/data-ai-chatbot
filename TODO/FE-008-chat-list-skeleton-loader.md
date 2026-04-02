---
id: FE-008
repo: vercel-ai-chatbot
title: Chat messages — skeleton loader on initial load
status: pending
priority: medium
depends_on: []
blocks: []
---

# FE-008 — Skeleton Loader for Chat History List on First Load

## Goal

When the sidebar chat history list is fetching its first page of data, it shows a blank white area for 1–2 seconds before chat items appear. Replace the static/invisible area with an animated skeleton loader so the UI communicates that content is loading.

## Context

- **Primary file:** `frontend/components/sidebar-history.tsx` — the `SidebarHistory` component.
- The loading state is tracked via `isLoading` from `useSWRInfinite` (line 108). When `isLoading` is `true`, the component renders a rudimentary skeleton at lines 170–196, but the skeleton rows use plain `div` elements with `bg-sidebar-accent-foreground/10` background — there is no animation or pulse effect.
- The `Skeleton` component exists at `frontend/components/ui/skeleton.tsx` — it applies `animate-pulse rounded-md bg-muted`. It is **not currently imported** in `sidebar-history.tsx`.
- The existing skeleton (lines 177–192) renders five rows at varying widths (44%, 32%, 28%, 64%, 52%) using a CSS custom property `--skeleton-width`. This structure is correct but needs to use the `Skeleton` component for the animation.
- `frontend/components/document-skeleton.tsx` — prior art for a multi-element animated skeleton in this codebase.
- The `LoaderIcon` spinner (lines 349–355) handles the paginated/infinite-scroll load beyond page 1 — this should remain unchanged.
- The sidebar uses `SidebarGroup` / `SidebarGroupContent` / `SidebarMenu` from `@/components/ui/sidebar`.

## Implementation hints

- **Entry point:** `frontend/components/sidebar-history.tsx` → `SidebarHistory()` → `isLoading` branch, lines 170–196.
- **Current behavior:** When `isLoading === true`, the component renders five static muted rows. No animation. The layout is correct but silent — users may think the page is broken.
- **Desired behavior:** Replace the inner `div` elements (lines 182–191) with `<Skeleton>` from `@/components/ui/skeleton`. Each row should pulse with the `animate-pulse` shimmer.
- **Minimal change:**
  ```tsx
  import { Skeleton } from '@/components/ui/skeleton';

  // Replace lines 182–191 in the isLoading branch:
  {[44, 32, 28, 64, 52].map((item) => (
    <div className="flex h-8 items-center gap-2 rounded-md px-2" key={item}>
      <Skeleton className="h-4 flex-1" style={{ maxWidth: `${item}%` }} />
    </div>
  ))}
  ```
- **Test file:** No e2e tests currently exist. Manual verification is sufficient. If adding a Playwright test, see `frontend/playwright.config.ts` for project configuration.
- **Prior art:** `frontend/components/document-skeleton.tsx` demonstrates skeleton usage. `frontend/components/sidebar-history.tsx` already has the correct structure — only the inner `div`s need replacing.
- **Gotchas:**
  - `isLoading` from `useSWRInfinite` is only `true` during the very first fetch (before any data). Subsequent page fetches use `isValidating`. Do not change the paginated loading spinner at lines 349–355.
  - `bg-muted` (used by `<Skeleton>`) and `bg-sidebar-accent-foreground/10` (used currently) may look different inside the sidebar panel — check that the pulse color looks reasonable in both light and dark mode. If not, pass `className="h-4 flex-1 bg-sidebar-accent-foreground/10"` to override.
  - The "Today" group label at line 173 is hardcoded in the skeleton — this is fine since we're just showing a loading state.

## Acceptance criteria

- [ ] When the sidebar chat history is loading (first fetch, `isLoading === true`), the rows show an animated pulse shimmer instead of a static background color.
- [ ] The skeleton uses `<Skeleton>` from `frontend/components/ui/skeleton.tsx` (i.e., rows carry the `animate-pulse` class).
- [ ] At least 4–5 skeleton rows are shown at varying widths.
- [ ] After loading completes, the skeleton is replaced by real chat items with no visible flash or layout shift.
- [ ] The "Loading Chats..." spinner at the bottom (for paginated loads beyond page 1) is unchanged.
- [ ] Dark mode: the pulsing skeleton is visible against the sidebar background in dark mode.
- [ ] Visual check: on Chrome DevTools "Slow 3G" throttling, the skeleton animates for ~1–2 seconds before real chat items appear.

## Out of scope

- Skeleton loaders for paginated loads beyond page 1 (spinner already handles that).
- Changes to the `Skeleton` component itself.
- Skeleton loaders for other sidebar sections (user nav, sidebar header).
- Skeleton for the main messages area (separate task if needed).
