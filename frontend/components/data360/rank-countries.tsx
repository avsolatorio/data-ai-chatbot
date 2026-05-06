"use client";

import type { CompactRankingOutput } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isCompactRankingOutput(v: unknown): v is CompactRankingOutput {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return Array.isArray(o.rankings) && "excluded_count" in o;
}

function parseRankingOutput(output: unknown): CompactRankingOutput | null {
  // Already a parsed object (normalizer decoded it from TextContent)
  if (isCompactRankingOutput(output)) return output;
  // Fallback: raw JSON string (pre-compact server versions)
  if (typeof output === "string") {
    try {
      const parsed = JSON.parse(output);
      if (isCompactRankingOutput(parsed)) return parsed;
    } catch {
      // not valid JSON — fall through
    }
  }
  return null;
}

function fmt(value: number, unit: string | null): string {
  const n = Number.isFinite(value)
    ? value.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : String(value);
  return unit ? `${n} ${unit}` : n;
}

function TrendBadge({ order }: { order: "asc" | "desc" }) {
  const label = order === "desc" ? "Highest first" : "Lowest first";
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {label}
    </span>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <strong>Error:</strong> {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export type RankCountriesProps = {
  /** Raw tool output — compact object or unparsed JSON string. */
  output: unknown;
};

export function RankCountries({ output }: RankCountriesProps) {
  const data = parseRankingOutput(output);

  if (data === null) {
    return (
      <ErrorBanner message="Unable to parse rank_countries output. Raw data may be in an unexpected format." />
    );
  }

  if (data.error) {
    return <ErrorBanner message={data.error} />;
  }

  if (data.rankings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
        No ranking data available.
      </div>
    );
  }

  const unit = data.unit ?? "";

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col gap-0.5">
          {data.indicator && (
            <div className="font-semibold text-foreground text-sm">
              {data.indicator}
            </div>
          )}
          {data.year && (
            <div className="text-muted-foreground text-xs">Year: {data.year}</div>
          )}
          {data.year_selection_note && (
            <div className="text-muted-foreground text-[10px] italic">
              {data.year_selection_note}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TrendBadge order={data.order} />
          <span className="text-muted-foreground text-xs">
            {data.counts.with_data} of {data.counts.requested} countries
          </span>
        </div>
      </div>

      {/* Rankings table */}
      <div className="rounded-lg border border-border bg-muted/30">
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="border-border border-b px-3 py-2 text-left font-medium w-10">
                  #
                </th>
                <th className="border-border border-b px-3 py-2 text-left font-medium">
                  Country
                </th>
                <th className="border-border border-b px-3 py-2 text-right font-medium">
                  Value{unit ? ` (${unit})` : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.rankings.map((entry) => (
                <tr
                  className="hover:bg-muted/50"
                  key={`${entry.code}-${entry.rank}`}
                >
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {entry.rank}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{entry.country}</div>
                    <div className="text-muted-foreground text-[10px]">
                      {entry.code}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {fmt(entry.value, null)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excluded footnote */}
      {data.excluded_count > 0 && (
        <div className="text-muted-foreground text-[10px]">
          {data.excluded_count} countr{data.excluded_count === 1 ? "y" : "ies"}{" "}
          excluded (no data){data.excluded_sample.length > 0 && ": "}
          {data.excluded_sample
            .map((e) => e.name ?? e.code)
            .join(", ")}
          {data.excluded_count > data.excluded_sample.length &&
            ` +${data.excluded_count - data.excluded_sample.length} more`}
          .
        </div>
      )}
    </div>
  );
}
