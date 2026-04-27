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

export type ChartInlineSegment =
  | { kind: "text"; text: string; startOffset: number }
  | { kind: "chart"; chartUrl: string; startOffset: number };

/**
 * Split assistant message text into alternating prose and chart URL segments so each
 * chart can render as an inline {@link ChartPreview}. Preserves first-match behavior:
 * when a markdown link and a bare URL start at the same index, the markdown link wins.
 */
export function splitAssistantTextIntoChartSegments(
  text: string,
  regexes: { bare: RegExp; markdownLink: RegExp } = buildChartUrlRegexes(),
): ChartInlineSegment[] {
  const { bare, markdownLink } = regexes;
  const segments: ChartInlineSegment[] = [];
  let pos = 0;

  while (pos < text.length) {
    const remainder = text.slice(pos);
    const mdMatch = remainder.match(markdownLink);
    const bareMatch = remainder.match(bare);

    const mdCand =
      mdMatch && mdMatch.index !== undefined
        ? {
            start: mdMatch.index,
            end: mdMatch.index + mdMatch[0].length,
            url: (mdMatch[1] ?? mdMatch[0]).trim(),
          }
        : null;
    const bareCand =
      bareMatch && bareMatch.index !== undefined
        ? {
            start: bareMatch.index,
            end: bareMatch.index + bareMatch[0].length,
            url: bareMatch[0].trim(),
          }
        : null;

    let chosen: { start: number; end: number; url: string } | null = null;
    if (mdCand && bareCand) {
      if (mdCand.start < bareCand.start) {
        chosen = mdCand;
      } else if (bareCand.start < mdCand.start) {
        chosen = bareCand;
      } else {
        chosen = mdCand;
      }
    } else {
      chosen = mdCand ?? bareCand;
    }

    if (!chosen) {
      segments.push({ kind: "text", text: text.slice(pos), startOffset: pos });
      break;
    }

    if (chosen.start > 0) {
      segments.push({
        kind: "text",
        text: text.slice(pos, pos + chosen.start),
        startOffset: pos,
      });
    }
    const chartStart = pos + chosen.start;
    segments.push({
      kind: "chart",
      chartUrl: chosen.url,
      startOffset: chartStart,
    });
    pos = pos + chosen.end;
  }

  if (segments.length === 0) {
    return [{ kind: "text", text, startOffset: 0 }];
  }

  return segments;
}
