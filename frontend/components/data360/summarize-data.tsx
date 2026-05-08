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

function GroupCard({
  group,
  unit,
}: {
  group: CompactGroupSummary;
  unit: string | null;
}) {
  const hasChange =
    group.change.abs !== null || group.change.pct !== null;

  return (
    <div className="rounded-lg border border-border bg-background p-3 flex flex-col gap-2">
      {/* Group key + claim provenance */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <GroupKeyPills group={group.group} />
        <div className="flex items-center gap-1.5 shrink-0">
          {group.range && (
            <span className="text-muted-foreground text-[10px]">
              {group.range}
            </span>
          )}
          <TrendBadge trend={group.trend} />
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
            Latest
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
      </div>

      {/* Stats row */}
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

      {/* Change row */}
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
          <span className="rounded bg-muted px-1.5 py-0.5">
            {output.groups.length} group{output.groups.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Ambiguous dimensions warning */}
      {output.ambiguous_dimensions && output.ambiguous_dimensions.length > 0 && (
        <AmbiguousDimensionsWarning dimensions={output.ambiguous_dimensions} />
      )}

      {/* Group cards */}
      {output.groups.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
          No groups returned.
        </div>
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
