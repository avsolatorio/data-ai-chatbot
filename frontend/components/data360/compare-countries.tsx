"use client";

import { ClaimMark } from "@pcn-js/ui";
import type {
  CompactCompareOutput,
  CompactSnapshotEntry,
  CompactTimeSeries,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isCompactCompareOutput(v: unknown): v is CompactCompareOutput {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return "snapshot" in o && "time_series" in o && "indicator" in o;
}

function parseCompareOutput(output: unknown): CompactCompareOutput | null {
  if (isCompactCompareOutput(output)) return output;
  if (typeof output === "string") {
    try {
      const parsed = JSON.parse(output);
      if (isCompactCompareOutput(parsed)) return parsed;
    } catch {
      // not valid JSON
    }
  }
  return null;
}

function fmtNum(v: number | null, decimals = 2): string {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

function convergenceBadge(
  convergence: string | null,
): { label: string; className: string } | null {
  switch (convergence?.toLowerCase()) {
    case "converging":
      return {
        label: "Converging",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      };
    case "diverging":
      return {
        label: "Diverging",
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      };
    case "parallel":
      return {
        label: "Parallel",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      };
    default:
      return null;
  }
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <strong>Error:</strong> {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Snapshot table
// ---------------------------------------------------------------------------

function SnapshotTable({
  rankings,
  year,
}: {
  rankings: CompactSnapshotEntry[];
  year: string | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Snapshot{year ? ` · ${year}` : ""}
      </div>
      <div className="rounded-lg border border-border bg-muted/30">
        <table className="w-full text-xs">
          <thead className="bg-muted">
            <tr>
              <th className="w-10 border-border border-b px-3 py-2 text-left font-medium">
                #
              </th>
              <th className="border-border border-b px-3 py-2 text-left font-medium">
                Country
              </th>
              <th className="border-border border-b px-3 py-2 text-right font-medium">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((entry) => (
              <tr className="hover:bg-muted/50" key={entry.code}>
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
                  {entry.claim_id ? (
                    <ClaimMark
                      id={entry.claim_id}
                      policy={{ type: "rounded", decimals: 2 }}
                    >
                      {fmtNum(entry.value)}
                    </ClaimMark>
                  ) : (
                    fmtNum(entry.value)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Time-series table
// Decodes the positional array format: series_schema = [time_period, obs_value, claim_id]
// ---------------------------------------------------------------------------

function TimeSeriesTable({ ts }: { ts: CompactTimeSeries }) {
  const countries = Object.keys(ts.series);

  // Build a sorted, deduplicated list of years across all countries
  const yearSet = new Set<string>();
  for (const pts of Object.values(ts.series)) {
    for (const pt of pts) {
      yearSet.add(pt[0]);
    }
  }
  const years = Array.from(yearSet).sort((a, b) => Number(b) - Number(a)); // newest first

  // Build lookup: country -> year -> { value, claim_id }
  // Positional schema: [0]=time_period, [1]=obs_value, [2]=claim_id
  const lookup: Record<
    string,
    Record<string, { value: number | null; claim_id: string | null }>
  > = {};
  for (const [country, pts] of Object.entries(ts.series)) {
    lookup[country] = {};
    for (const pt of pts) {
      lookup[country][pt[0]] = { value: pt[1], claim_id: pt[2] };
    }
  }

  const conv = convergenceBadge(ts.convergence);

  return (
    <div className="flex flex-col gap-2">
      <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Time Series
      </div>
      {/* Sub-header: range + convergence + CAGR */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="text-muted-foreground text-xs">
          {ts.year_range} · {ts.n_aligned_years} aligned year
          {ts.n_aligned_years !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          {conv && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${conv.className}`}
            >
              {conv.label}
            </span>
          )}
          {Object.keys(ts.cagr).length > 0 && (
            <span className="text-muted-foreground text-[10px]">
              CAGR:{" "}
              {Object.entries(ts.cagr)
                .map(([c, v]) => `${c} ${fmtNum(v, 1)}%`)
                .join(" · ")}
            </span>
          )}
        </div>
      </div>

      {/* Data table */}
      <div className="rounded-lg border border-border bg-muted/30">
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="border-border border-b px-3 py-2 text-left font-medium">
                  Year
                </th>
                {countries.map((c) => (
                  <th
                    className="border-border border-b px-3 py-2 text-right font-medium"
                    key={c}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {years.map((year) => (
                <tr className="hover:bg-muted/50" key={year}>
                  <td className="px-3 py-2 font-medium text-muted-foreground">
                    {year}
                  </td>
                  {countries.map((c) => {
                    const pt = lookup[c]?.[year];
                    return (
                      <td
                        className="px-3 py-2 text-right font-medium"
                        key={c}
                      >
                        {pt !== undefined ? (
                          pt.claim_id ? (
                            <ClaimMark
                              id={pt.claim_id}
                              policy={{ type: "rounded", decimals: 2 }}
                            >
                              {fmtNum(pt.value)}
                            </ClaimMark>
                          ) : (
                            fmtNum(pt.value)
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export type CompareCountriesProps = {
  /** Raw tool output — compact object or unparsed JSON string. */
  output: unknown;
};

export function CompareCountries({ output }: CompareCountriesProps) {
  const data = parseCompareOutput(output);

  if (data === null) {
    return (
      <ErrorBanner message="Unable to parse compare_countries output. Raw data may be in an unexpected format." />
    );
  }

  if (data.error) {
    return <ErrorBanner message={data.error} />;
  }

  const hasSnapshot =
    data.snapshot !== null &&
    data.snapshot !== undefined &&
    data.snapshot.rankings.length > 0;
  const hasTimeSeries =
    data.time_series !== null &&
    data.time_series !== undefined &&
    Object.keys(data.time_series.series).length > 0;

  if (!hasSnapshot && !hasTimeSeries) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
        No comparison data available.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {data.indicator && (
          <div className="font-semibold text-foreground text-sm">
            {data.indicator}
          </div>
        )}
        {data.unit && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {data.unit}
          </span>
        )}
      </div>

      {/* Snapshot */}
      {hasSnapshot && data.snapshot && (
        <SnapshotTable
          rankings={data.snapshot.rankings}
          year={data.snapshot.year}
        />
      )}

      {/* Time series */}
      {hasTimeSeries && data.time_series && (
        <TimeSeriesTable ts={data.time_series} />
      )}
    </div>
  );
}
