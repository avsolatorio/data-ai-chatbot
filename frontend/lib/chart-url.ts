import { getBasePath } from "@/lib/config";

/**
 * Prepend Next.js `basePath` for app-root-relative API paths so `fetch()` hits the
 * deployed app (e.g. `/app/api/...`) instead of the host root (`/api/...`).
 */
export function applyBasePathToChartPath(
  pathWithQuery: string,
  basePath: string,
): string {
  const base = basePath.replace(/\/+$/, "");
  if (!base) return pathWithQuery;
  const normalized = pathWithQuery.startsWith("/")
    ? pathWithQuery
    : `/${pathWithQuery}`;
  if (normalized === base || normalized.startsWith(`${base}/`)) {
    return normalized;
  }
  return `${base}${normalized}`;
}

/**
 * Normalize chart URL to a same-origin path for `fetch()` (proxy via Next.js).
 * Strips absolute URLs to pathname + search, then applies `basePath` when needed.
 */
export function proxyChartUrlForFetch(url: string, basePath: string): string {
  const trimmed = url.trim();
  let pathPart: string;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      pathPart = `${parsed.pathname}${parsed.search}`;
    } catch {
      return trimmed;
    }
  } else {
    pathPart = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
  return applyBasePathToChartPath(pathPart, basePath);
}

/** True when two chart URLs refer to the same proxied fetch path (inline vs tool output). */
export function chartUrlsReferToSameChart(a: string, b: string): boolean {
  const bp = getBasePath();
  return (
    proxyChartUrlForFetch(a.trim(), bp) === proxyChartUrlForFetch(b.trim(), bp)
  );
}

/**
 * Regexes for detecting chart URLs in assistant text. When `basePath` is set,
 * matches both `/api/v1/charts/...` and `/basePath/api/v1/charts/...`.
 */
export function buildChartUrlRegexes(): {
  bare: RegExp;
  markdownLink: RegExp;
} {
  const base = getBasePath().replace(/\/+$/, "");
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const relativePart = base
    ? `(?:(?:${escapedBase})?/api/v1/charts/[^\\s"'<>)\\]]+)`
    : `(?:/api/v1/charts/[^\\s"'<>)\\]]+)`;
  const bare = new RegExp(
    `(?:${relativePart}|https?:\\/\\/[^\\s]*/api/v1/charts/[^\\s"'<>)\\]]+)`,
  );
  const markdownLink = new RegExp(
    `\\[[^\\]]*\\]\\s*\\(\\s*(${bare.source})\\s*\\)`,
  );
  return { bare, markdownLink };
}
