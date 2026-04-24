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

// ─── Subtitle helpers ─────────────────────────────────────────────────────────

type InputQueryGroup = {
  queries?: string[];
  query?: string;
  country?: string | null;
};

/**
 * For `by_query` layout: prefer the original human-readable country names from
 * `input.query_groups` (e.g. "Japan") over the resolved alpha-3 codes in the
 * output (e.g. "JPN"). Falls back to country_code from the output if input is
 * unavailable.
 *
 * Output format: "Japan: GDP per capita, Inflation · Philippines: Population"
 */
function subtitleFromByQuery(
  results: Array<{ query: string; country_code?: string | null }>,
  inputQueryGroups: InputQueryGroup[] | null,
): string | undefined {
  if (!results.length) return undefined;

  if (inputQueryGroups && inputQueryGroups.length > 0) {
    // Use input groups directly — country name is already human-readable
    const parts = inputQueryGroups
      .filter((g) => {
        const qs = g.queries ?? (g.query ? [g.query] : []);
        return qs.length > 0;
      })
      .map((g) => {
        const qs = g.queries ?? (g.query ? [g.query] : []);
        const queryList = qs.join(", ");
        return g.country ? `${g.country}: ${queryList}` : queryList;
      });
    return parts.join(" · ") || undefined;
  }

  // Fallback: group output results by country_code (raw code, e.g. "JPN")
  const grouped = new Map<string, string[]>();
  for (const r of results) {
    const key = r.country_code ?? "";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r.query);
  }
  const parts: string[] = [];
  for (const [code, queries] of grouped) {
    parts.push(code ? `${code}: ${queries.join(", ")}` : queries.join(", "));
  }
  return parts.join(" · ") || undefined;
}

function buildSubtitle(
  parsed: Data360SearchToolResult | Data360MultiQuerySearchToolResult,
  input?: Record<string, unknown> | null,
): string | undefined {
  // by_query layout — use input.query_groups for human-readable country names
  if (
    "result_layout" in parsed &&
    parsed.result_layout === "by_query" &&
    Array.isArray(parsed.results) &&
    parsed.results.length > 0
  ) {
    const inputGroups = Array.isArray(input?.query_groups)
      ? (input.query_groups as InputQueryGroup[])
      : null;
    return subtitleFromByQuery(
      parsed.results as Array<{ query: string; country_code?: string | null }>,
      inputGroups,
    );
  }

  // merged multi-query — list the queries; use input.required_country for the
  // country label (preserves the original string the LLM passed, e.g. "China")
  if ("queries" in parsed && Array.isArray(parsed.queries) && parsed.queries.length > 0) {
    const queryPart = parsed.queries.join(" · ");
    // Prefer input country string (human-readable) over the resolved code in output
    const country =
      typeof input?.required_country === "string"
        ? input.required_country
        : parsed.required_country;
    return country ? `${queryPart} — ${country}` : queryPart;
  }

  // single-query — use input.query and input.required_country directly
  const query =
    typeof input?.query === "string" ? input.query : null;
  const country =
    typeof input?.required_country === "string"
      ? input.required_country
      : parsed.required_country;
  if (query && country) return `${query} — ${country}`;
  if (query) return query;
  if (country) return country;
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
      const subtitle = buildSubtitle(data, input);

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
    const subtitle = buildSubtitle(data, input);

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
