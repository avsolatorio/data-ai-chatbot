"use client";

import { ClaimMark } from "@pcn-js/ui";
import { formatNum, signedPct, ErrorBanner } from "./shared";
import type {
  CompactRankedEntry,
  CompactComparisonSnapshot,
  CompactTimeSeries,
  CompactComparisonOutput,
} from "@pcn-js/data360";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------



const CONVERGENCE_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  converging: {
    label: "Converging",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  diverging: {
    label: "Diverging",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  parallel: {
    label: "Parallel",
    className: "bg-muted text-muted-foreground",
  },
};

// Default positional schema — used as fallback if series_schema is missing
const DEFAULT_SERIES_SCHEMA = ["time_period", "obs_value", "claim_id"];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------



function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      {children}
    </div>
  );
}

function SnapshotTable({
  snapshot,
  unit,
}: {
  snapshot: CompactComparisonSnapshot;
  unit: string | null | undefined;
}) {
  const year = snapshot.year ?? "\u2014";
  const rankings = snapshot.rankings ?? [];
  const spread = snapshot.spread ?? {};

  const spreadItems = Object.entries(spread).filter(
    ([, v]) => v !== null && v !== undefined && Number.isFinite(v),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <SectionLabel>Snapshot — {year}</SectionLabel>
        {spreadItems.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
            {spreadItems.map(([key, val]) => (
              <span key={key}>
                <span className="capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                <span className="font-medium text-foreground">
                  {formatNum(val)}
                  {unit ? ` ${unit}` : ""}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {rankings.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
          No ranking data for this snapshot.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="border-border border-b px-3 py-2 text-left font-medium w-8">
                  #
                </th>
                <th className="border-border border-b px-3 py-2 text-left font-medium">
                  Country
                </th>
                <th className="border-border border-b px-3 py-2 text-right font-medium">
                  Value{" "}
                  {unit ? (
                    <span className="font-normal text-muted-foreground">
                      ({unit})
                    </span>
                  ) : null}
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((entry, idx) => (
                <tr
                  className="hover:bg-muted/50 border-border border-b last:border-b-0"
                  key={`${entry.code ?? idx}-${idx}`}
                >
                  <td className="px-3 py-2 text-muted-foreground font-mono">
                    {entry.rank ?? idx + 1}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {entry.country ?? entry.code ?? "\u2014"}
                    </div>
                    {entry.country && entry.code && entry.country !== entry.code && (
                      <div className="text-muted-foreground text-[10px] font-mono">
                        {entry.code}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {entry.claim_id ? (
                      <ClaimMark
                        id={entry.claim_id}
                        policy={{ type: "rounded", decimals: 2 }}
                      >
                        {formatNum(entry.value)}
                      </ClaimMark>
                    ) : (
                      formatNum(entry.value)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TimeSeriesSection({
  timeSeries,
  unit,
}: {
  timeSeries: CompactTimeSeries;
  unit: string | null | undefined;
}) {
  const year_range = timeSeries.year_range ?? null;
  const n_aligned_years = timeSeries.n_aligned_years ?? 0;
  const convergence = timeSeries.convergence ?? null;
  const cagr = timeSeries.cagr ?? {};
  // Fall back to default schema if field is missing (non-compact payload)
  const series_schema =
    timeSeries.series_schema && timeSeries.series_schema.length > 0
      ? timeSeries.series_schema
      : DEFAULT_SERIES_SCHEMA;
  const series = timeSeries.series ?? {};

  // Decode positional indices from series_schema (never hard-code)
  const colYear = series_schema.indexOf("time_period");
  const colValue = series_schema.indexOf("obs_value");
  const colClaim = series_schema.indexOf("claim_id");

  const countries = Object.keys(series);
  const cagrKeys = Object.keys(cagr);

  const convergenceCfg = convergence
    ? (CONVERGENCE_CONFIG[convergence] ?? {
        label: convergence,
        className: "bg-muted text-muted-foreground",
      })
    : null;

  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <SectionLabel>
          Time series
          {year_range ? ` \u2014 ${year_range}` : ""}
          {n_aligned_years > 0 ? ` (${n_aligned_years} aligned years)` : ""}
        </SectionLabel>
        {convergenceCfg && (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${convergenceCfg.className}`}
          >
            {convergenceCfg.label}
          </span>
        )}
      </div>

      {/* CAGR table */}
      {cagrKeys.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {cagrKeys.map((country) => {
            const rate = cagr[country];
            return (
              <div
                key={country}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs min-w-[100px]"
              >
                <div className="text-muted-foreground text-[10px] uppercase tracking-wide mb-0.5">
                  {country} CAGR
                </div>
                <div
                  className={`font-semibold tabular-nums ${
                    rate !== null && rate !== undefined && rate >= 0
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {signedPct(rate)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-country series tables */}
      {countries.map((country) => {
        const points = series[country];
        if (!points || points.length === 0) return null;

        return (
          <div key={country} className="flex flex-col gap-1">
            <div className="text-xs font-medium text-foreground px-0.5">
              {country}
            </div>
            <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <div className="overflow-auto max-h-48">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="border-border border-b px-3 py-1.5 text-left font-medium">
                        Year
                      </th>
                      <th className="border-border border-b px-3 py-1.5 text-right font-medium">
                        Value{" "}
                        {unit ? (
                          <span className="font-normal text-muted-foreground">
                            ({unit})
                          </span>
                        ) : null}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...points]
                      .sort((a, b) => {
                        const ya =
                          colYear >= 0 ? String(a[colYear] ?? "") : "";
                        const yb =
                          colYear >= 0 ? String(b[colYear] ?? "") : "";
                        return yb.localeCompare(ya);
                      })
                      .map((pt, i) => {
                        const yearVal =
                          colYear >= 0
                            ? String(pt[colYear] ?? "?")
                            : "?";
                        const value =
                          colValue >= 0 && pt[colValue] !== undefined
                            ? (pt[colValue] as number)
                            : null;
                        const claimId =
                          colClaim >= 0
                            ? ((pt[colClaim] as string | null | undefined) ??
                              null)
                            : null;

                        return (
                          <tr
                            className="hover:bg-muted/50 border-border border-b last:border-b-0"
                            key={`${yearVal}-${i}`}
                          >
                            <td className="px-3 py-1.5 font-mono">{yearVal}</td>
                            <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                              {claimId && value !== null ? (
                                <ClaimMark
                                  id={claimId}
                                  policy={{ type: "rounded", decimals: 2 }}
                                >
                                  {formatNum(value)}
                                </ClaimMark>
                              ) : value !== null ? (
                                formatNum(value)
                              ) : (
                                "\u2014"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}

      {countries.length === 0 && (
        <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
          No time series data available.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function CompareCountries({
  output,
}: {
  output: CompactComparisonOutput;
}) {
  const error = (output.error ?? null) as string | null;

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <ErrorBanner message={error} />
      </div>
    );
  }

  const indicator = (output.indicator ?? null) as string | null;
  const unit = (output.unit ?? null) as string | null;
  const snapshot =
    (output.snapshot ?? null) as CompactComparisonSnapshot | null;
  const timeSeries =
    (output.time_series ?? null) as CompactTimeSeries | null;

  // Graceful fallback: if neither snapshot nor time_series is present the
  // payload is likely non-compact or unexpected — show a neutral message
  if (!snapshot && !timeSeries) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-muted-foreground text-sm">
        <div className="font-medium text-foreground mb-1">
          {indicator ?? "Comparison"}
        </div>
        <div className="text-[11px]">
          No structured comparison data available.
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 overflow-hidden rounded-sm bg-background px-4 pb-4">
      {/* Header */}
      <div className="flex flex-col gap-1 pb-1">
        {indicator && (
          <div className="font-semibold text-sm text-foreground leading-snug">
            {indicator}
          </div>
        )}
        {unit && (
          <div className="text-muted-foreground text-xs">{unit}</div>
        )}
      </div>

      {/* Snapshot */}
      {snapshot ? (
        <SnapshotTable snapshot={snapshot} unit={unit} />
      ) : (
        <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
          No snapshot data available.
        </div>
      )}

      {/* Time series */}
      {timeSeries && (
        <TimeSeriesSection timeSeries={timeSeries} unit={unit} />
      )}
    </div>
  );
}
