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
 *
 * In development, rewrites /static/... paths (served by the local MCP server) to
 * /api/mcp-static/... so the Next.js dev proxy can serve them from the same origin.
 * This keeps production unaffected — the MCP server in production serves its own
 * static files and the URL returned by the tool is already absolute/resolvable.
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

  // In development: rewrite /static/... → /api/mcp-static/... so Next.js proxies
  // the request to the local MCP server instead of returning 404.
  if (
    process.env.NODE_ENV === "development" &&
    pathPart.startsWith("/static/")
  ) {
    pathPart = `/api/mcp-static/${pathPart.slice("/static/".length)}`;
  }

  return applyBasePathToChartPath(pathPart, basePath);
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
