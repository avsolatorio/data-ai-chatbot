"use client";

import { ClaimMark } from "@pcn-js/ui";

// ---------------------------------------------------------------------------
// Types — mirrors DataSummaryResponse.to_compact() on the MCP server
// ---------------------------------------------------------------------------

export type CompactGroupSummary = {
  group: Record<string, string>;
  n: number;
  latest: { value: number | null; year: string | null };
  earliest: { value: number | null; year: string | null };
  range: string | null;
  stats: {
    min: number | null;
    max: number | null;
    mean: number | null;
    median: number | null;
  };
  change: { abs: number | null; pct: number | null };
  trend: string | null;
  claim_ids: string[];
};

export type CompactSummaryOutput = {
  indicator: string | null;
  unit: string | null;
  ambiguous_dimensions: string[] | null;
  groups: CompactGroupSummary[];
  error: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNum(v: number | null, decimals = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "\u2014";
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(decimals)}B`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(decimals)}M`;
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

const TREND_ICONS: Record<string, { icon: string; className: string }> = {
  increasing: { icon: "\u2191", className: "text-green-600 dark:text-green-400" },
  decreasing: { icon: "\u2193", className: "text-red-600 dark:text-red-400" },
  stable: { icon: "\u2192", className: "text-muted-foreground" },
  volatile: { icon: "\u2922", className: "text-yellow-600 dark:text-yellow-400" },
};

const DIMENSION_LABELS: Record<string, string> = {
  ref_area: "Area",
  time_period: "Year",
  sex: "Sex",
  age: "Age",
  urbanisation: "Urbanisation",
  unit_measure: "Unit",
  comp_breakdown_1: "Breakdown 1",
  comp_breakdown_2: "Breakdown 2",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
      <div className="font-medium">Error</div>
      <div className="mt-1">{message}</div>
    </div>
  );
}

function AmbiguousDimensionsWarning({
  dimensions,
}: {
  dimensions: string[];
}) {
  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50/70 px-3 py-2 text-yellow-800 text-xs dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300">
      <span className="font-medium">Ambiguous dimensions:</span>{" "}
      {dimensions.map((d) => DIMENSION_LABELS[d] ?? d).join(", ")}. Stats may
      mix multiple disaggregation values. Consider refining{" "}
      <code className="font-mono">group_by</code> or{" "}
      <code className="font-mono">disaggregation_filters</code>.
    </div>
  );
}

function GroupKeyPills({ group }: { group: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(group).map(([dim, val]) => (
        <span
          key={dim}
          className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px]"
        >
          <span className="text-muted-foreground">
            {DIMENSION_LABELS[dim] ?? dim}:
          </span>{" "}
          <span className="font-medium text-foreground">{val}</span>
        </span>
      ))}
    </div>
  );
}

function TrendBadge({ trend }: { trend: string | null }) {
  if (!trend) return null;
  const cfg = TREND_ICONS[trend] ?? { icon: "?", className: "text-muted-foreground" };
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted ${cfg.className}`}
      title={`Trend: ${trend}`}
    >
      <span>{cfg.icon}</span>
      <span className="capitalize">{trend}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Degenerate time-series table
// Rendered when ALL groups have n=1 — the result of group_by=["time_period"].
// Shows a compact year → value table sorted newest-first.
// ---------------------------------------------------------------------------

function DegenerateTimeSeriesTable({
  groups,
  unit,
}: {
  groups: CompactGroupSummary[];
  unit: string | null;
}) {
  // Each group's "latest" is the single observation for that period.
  const rows = [...groups].sort((a, b) => {
    const ya = a.latest.year ?? "";
    const yb = b.latest.year ?? "";
    return yb.localeCompare(ya); // newest first
  });

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-1.5 text-left text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Year
            </th>
            <th className="px-3 py-1.5 text-right text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Value{unit ? ` (${unit})` : ""}
            </th>
            <th className="px-3 py-1.5 text-right text-[10px] uppercase tracking-wide text-muted-foreground font-medium w-8">
              {/* claim */}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((group, idx) => {
            const year = group.latest.year ?? Object.values(group.group)[0] ?? "—";
            const value = group.latest.value;
            const claimId = group.claim_ids[0] ?? null;
            return (
              <tr
                key={idx}
                className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-3 py-1.5 tabular-nums font-medium text-foreground">
                  {year}
                </td>
                <td className="px-3 py-1.5 tabular-nums text-right text-foreground">
                  {value !== null ? formatNum(value) : "—"}
                </td>
                <td className="px-3 py-1.5 text-right">
                  {claimId && (
                    <ClaimMark
                      id={claimId}
                      policy={{ type: "rounded", decimals: 2 }}
                    >
                      {""}
                    </ClaimMark>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Normal group card — used when n > 1 (multi-observation groups)
// ---------------------------------------------------------------------------

function GroupCard({
  group,
  unit,
}: {
  group: CompactGroupSummary;
  unit: string | null;
}) {
  // n=1 guard: suppress degenerate stats on individual cards when only some
  // groups are single-observation (mixed grouping edge case).
  const isDegenerate = group.n <= 1;
  const hasChange =
    !isDegenerate &&
    (group.change.abs !== null || group.change.pct !== null);

  return (
    <div className="rounded-lg border border-border bg-background p-3 flex flex-col gap-2">
      {/* Group key + claim provenance */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <GroupKeyPills group={group.group} />
        <div className="flex items-center gap-1.5 shrink-0">
          {group.range && !isDegenerate && (
            <span className="text-muted-foreground text-[10px]">
              {group.range}
            </span>
          )}
          {!isDegenerate && <TrendBadge trend={group.trend} />}
          {/*
            claim_ids is a flat list of ALL source observation IDs for this group —
            order is not guaranteed to match temporal order. Render as a batch
            provenance mark at the group level; do not index by position.
          */}
          {group.claim_ids.length > 0 && (
            <ClaimMark
              id={group.claim_ids[0]}
              policy={{ type: "rounded", decimals: 2 }}
            >
              {""}
            </ClaimMark>
          )}
        </div>
      </div>

      {/* Latest & earliest — values only, no per-value claim attribution */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-muted/40 p-2">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wide mb-0.5">
            {isDegenerate ? "Value" : "Latest"}
          </div>
          <div className="font-semibold text-foreground">
            {group.latest.value !== null ? (
              <>
                {formatNum(group.latest.value)}
                {unit && (
                  <span className="ml-1 font-normal text-muted-foreground text-[10px]">
                    {unit}
                  </span>
                )}
              </>
            ) : (
              "\u2014"
            )}
          </div>
          {group.latest.year && (
            <div className="text-muted-foreground text-[10px]">
              {group.latest.year}
            </div>
          )}
        </div>

        {!isDegenerate && (
          <div className="rounded bg-muted/40 p-2">
            <div className="text-muted-foreground text-[10px] uppercase tracking-wide mb-0.5">
              Earliest
            </div>
            <div className="font-semibold text-foreground">
              {group.earliest.value !== null ? (
                <>
                  {formatNum(group.earliest.value)}
                  {unit && (
                    <span className="ml-1 font-normal text-muted-foreground text-[10px]">
                      {unit}
                    </span>
                  )}
                </>
              ) : (
                "\u2014"
              )}
            </div>
            {group.earliest.year && (
              <div className="text-muted-foreground text-[10px]">
                {group.earliest.year}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats row — suppressed for degenerate single-observation groups */}
      {!isDegenerate && (
        <div className="grid grid-cols-4 gap-1 text-[10px]">
          {(["min", "max", "mean", "median"] as const).map((key) => (
            <div key={key} className="flex flex-col items-center rounded bg-muted/30 px-1 py-1">
              <span className="text-muted-foreground uppercase tracking-wide text-[9px]">
                {key}
              </span>
              <span className="font-medium text-foreground tabular-nums">
                {formatNum(group.stats[key], 2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Change row — suppressed for degenerate groups */}
      {hasChange && (
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>
            Change:{" "}
            <span className="font-medium text-foreground">
              {group.change.abs !== null
                ? `${group.change.abs >= 0 ? "+" : ""}${formatNum(group.change.abs)}`
                : "\u2014"}
            </span>
          </span>
          {group.change.pct !== null && (
            <span>
              (
              <span className="font-medium text-foreground">
                {group.change.pct >= 0 ? "+" : ""}
                {formatNum(group.change.pct, 1)}%
              </span>
              )
            </span>
          )}
        </div>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function SummarizeData({ output }: { output: CompactSummaryOutput }) {
  if (output.error) {
    return (
      <div className="flex flex-col gap-3">
        <ErrorBanner message={output.error} />
      </div>
    );
  }

  // Detect degenerate output: ALL groups have n=1.
  // This happens when group_by=["time_period"] is used for a single-country
  // trend query — it produces one group per year with exactly one observation,
  // making all stats (min/max/mean/median/change/trend) mathematically trivial.
  // In this case we render a compact time-series table instead of per-year cards.
  const allDegenerate =
    output.groups.length > 1 && output.groups.every((g) => g.n <= 1);

  return (
    <div className="flex w-full flex-col gap-3 overflow-hidden rounded-sm bg-background px-4 pb-4">
      {/* Header */}
      <div className="flex flex-col gap-1 pb-1">
        {output.indicator && (
          <div className="font-semibold text-sm text-foreground leading-snug">
            {output.indicator}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
          {output.unit && <span>{output.unit}</span>}
          {allDegenerate ? (
            <span className="rounded bg-muted px-1.5 py-0.5">
              {output.groups.length} observations
            </span>
          ) : (
            <span className="rounded bg-muted px-1.5 py-0.5">
              {output.groups.length} group{output.groups.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Ambiguous dimensions warning */}
      {output.ambiguous_dimensions && output.ambiguous_dimensions.length > 0 && (
        <AmbiguousDimensionsWarning dimensions={output.ambiguous_dimensions} />
      )}

      {/* Body */}
      {output.groups.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
          No groups returned.
        </div>
      ) : allDegenerate ? (
        // Fallback: compact time-series table when every group has n=1
        <DegenerateTimeSeriesTable groups={output.groups} unit={output.unit} />
      ) : (
        <div className="flex flex-col gap-2">
          {output.groups.map((group, idx) => (
            <GroupCard
              group={group}
              key={idx}
              unit={output.unit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
