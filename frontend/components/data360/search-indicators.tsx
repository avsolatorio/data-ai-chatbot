"use client";

import { SearchResultCard } from "@data360/mcp-ui/search-card";
import {
  parseData360SearchToolResult,
  parseData360MultiQuerySearchToolResult,
} from "@data360/tool-types";
import type {
  Data360SearchToolResult,
  Data360MultiQuerySearchToolResult,
} from "@data360/tool-types";
import { alpha3ToName, alpha3ListToNames } from "@/lib/country-names";

// ─── Type guard helpers ───────────────────────────────────────────────────────

/** Check whether the raw output looks like a multi-query response. */
function isMultiQueryShape(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  return (
    "result_layout" in obj ||
    "queries" in obj ||
    ("results" in obj && Array.isArray(obj.results))
  );
}

// ─── Build subtitle from parsed result ────────────────────────────────────────

/**
 * For `by_query` layout: group results by country_code and format as
 * "Japan: GDP per capita, Inflation · Philippines: Population".
 * Results with no country are listed without a prefix.
 */
function subtitleFromByQueryResults(
  results: Array<{ query: string; country_code?: string | null }>,
): string | undefined {
  if (!results.length) return undefined;

  // Group queries by country_code
  const grouped = new Map<string, string[]>();
  for (const r of results) {
    const key = r.country_code ?? "";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r.query);
  }

  const parts: string[] = [];
  for (const [countryCode, queries] of grouped) {
    const queryList = queries.join(", ");
    // Convert alpha-3 code to full name (e.g. "JPN" → "Japan")
    const countryLabel = countryCode ? alpha3ToName(countryCode) : "";
    parts.push(countryLabel ? `${countryLabel}: ${queryList}` : queryList);
  }

  return parts.join(" · ");
}

function buildSubtitle(
  parsed: Data360SearchToolResult | Data360MultiQuerySearchToolResult,
  inputQuery?: string | null,
): string | undefined {
  // by_query layout — derive subtitle from per-group country+query
  if (
    "result_layout" in parsed &&
    parsed.result_layout === "by_query" &&
    Array.isArray(parsed.results) &&
    parsed.results.length > 0
  ) {
    return subtitleFromByQueryResults(
      parsed.results as Array<{ query: string; country_code?: string | null }>,
    );
  }

  // merged multi-query — list queries, append shared country name if present
  if ("queries" in parsed && Array.isArray(parsed.queries) && parsed.queries.length > 0) {
    const queryPart = parsed.queries.join(" · ");
    const country = parsed.required_country;
    // required_country may be semicolon-separated alpha-3 codes e.g. "CHN;JPN"
    const countryLabel = country ? alpha3ListToNames(country) : null;
    return countryLabel ? `${queryPart} — ${countryLabel}` : queryPart;
  }

  // single-query — use the query string from the input or the response
  const country = parsed.required_country;
  const countryLabel = country ? alpha3ListToNames(country) : null;
  if (inputQuery && countryLabel) return `${inputQuery} — ${countryLabel}`;
  if (inputQuery) return inputQuery;
  if (countryLabel) return countryLabel;
  return undefined;
}


// ─── Main component ──────────────────────────────────────────────────────────

export type SearchIndicatorsProps = {
  /** Raw tool output (unparsed JSON object from the AI tool call). */
  output: unknown;
  /** Raw tool input (used to derive subtitle context). */
  input?: Record<string, unknown> | null;
};

/**
 * Thin wrapper around `@data360/mcp-ui` `SearchResultCard`.
 *
 * Handles both single-query and multi-query responses by parsing the raw tool
 * output through `@data360/tool-types` Zod schemas.
 */
export function SearchIndicators({ output, input }: SearchIndicatorsProps) {
  // Try multi-query parse first if shape matches, then single-query
  if (isMultiQueryShape(output)) {
    const parsed = parseData360MultiQuerySearchToolResult(output);
    if (parsed.success) {
      const data = parsed.data;
      if (data.error) {
        return <ErrorBanner message={data.error} />;
      }
      const inputQuery =
        typeof input?.query === "string" ? input.query : null;
      const subtitle = buildSubtitle(data, inputQuery);

      // by_query layout → grouped accordion
      if (data.result_layout === "by_query" && data.results && data.results.length > 0) {
        return (
          <SearchResultCard
            groups={data.results}
            subtitle={subtitle}
            title="Search Results"
          />
        );
      }

      // merged layout → flat rail
      return (
        <SearchResultCard
          indicators={data.indicators}
          subtitle={subtitle}
          title="Search Results"
        />
      );
    }
  }

  // Single-query parse
  const parsed = parseData360SearchToolResult(output);
  if (parsed.success) {
    const data = parsed.data;
    if (data.error) {
      return <ErrorBanner message={data.error} />;
    }
    const inputQuery =
      typeof input?.query === "string" ? input.query : null;
    const subtitle = buildSubtitle(data, inputQuery);

    return (
      <SearchResultCard
        indicators={data.indicators}
        subtitle={subtitle}
        title="Search Results"
      />
    );
  }

  // Parse failure fallback
  return <ErrorBanner message="Failed to parse search results." />;
}

// ─── Small error banner ───────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 8,
        border: "1px solid rgba(183, 28, 28, 0.3)",
        background: "rgba(183, 28, 28, 0.06)",
        color: "#B71C1C",
        fontSize: 13,
      }}
    >
      <strong>Error:</strong> {message}
    </div>
  );
}
