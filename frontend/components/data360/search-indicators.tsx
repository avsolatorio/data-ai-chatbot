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

// ─── Build subtitle from parsed result ────────────────────────────────────────

function buildSubtitle(
  parsed: Data360SearchToolResult | Data360MultiQuerySearchToolResult,
  inputQuery?: string | null,
): string | undefined {
  const parts: string[] = [];

  // For multi-query, list the queries
  if ("queries" in parsed && Array.isArray(parsed.queries) && parsed.queries.length > 0) {
    parts.push(parsed.queries.join(" · "));
  } else if (inputQuery) {
    parts.push(inputQuery);
  }

  // Country context
  const country = parsed.required_country;
  if (country) {
    parts.push(country);
  }

  return parts.length > 0 ? parts.join(" — ") : undefined;
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
