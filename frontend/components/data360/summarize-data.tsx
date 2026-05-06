"use client";

import type { CompactGroupSummary, CompactSummarizeOutput } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isCompactSummarizeOutput(v: unknown): v is CompactSummarizeOutput {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.groups) || !("indicator" in o)) return false;
  // Verify at least the first group has the compact shape ("group" key, not "group_key")
  if (o.groups.length > 0) {
    const first = o.groups[0] as Record<string, unknown>;
    if (!("group" in first)) return false;
  }
  return true;
}

function parseSummarizeOutput(output: unknown): CompactSummarizeOutput | null {
  if (isCompactSummarizeOutput(output)) return output;
  if (typeof output === "string") {
    try {
      const parsed = JSON.parse(output);
      if (isCompactSummarizeOutput(parsed)) return parsed;
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

function fmtPct(v: number | null): string {
  if (v === null || v === undefined) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${fmtNum(v, 1)}%`;
}

function trendLabel(trend: string | null): {
  label: string;
  className: string;
} {
  switch (trend?.toLowerCase()) {
    case "increasing":
      return {
        label: "Increasing",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      };
    case "decreasing":
      return {
        label: "Decreasing",
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      };
    case "stable":
      return {
        label: "Stable",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      };
    default:
      return {
        label: trend ?? "—",
        className: "bg-muted text-muted-foreground",
      };
  }
}

/** Derive a human-readable label from a group key dict. */
function groupLabel(groupKey: Record<string, string> | null | undefined): string {
  if (!groupKey || typeof groupKey !== "object") return "Total";
  const parts: string[] = [];
  if (groupKey.ref_area) parts.push(groupKey.ref_area);
  if (groupKey.sex && groupKey.sex !== "_T") parts.push(groupKey.sex);
  if (groupKey.age && groupKey.age !== "_T") parts.push(groupKey.age);
  if (groupKey.urbanisation && groupKey.urbanisation !== "_T")
    parts.push(groupKey.urbanisation);
  // Any remaining dimensions not handled above
  for (const [k, v] of Object.entries(groupKey)) {
    if (
      !["ref_area", "sex", "age", "urbanisation"].includes(k) &&
      v !== "_T"
    ) {
      parts.push(`${k}:${v}`);
    }
  }
  return parts.join(" · ") || "Total";
}

function GroupRow({ group }: { group: CompactGroupSummary }) {
  const { label: trendText, className: trendClass } = trendLabel(group.trend);

  // range is a string like "2004-2023" or null
  const yearSpan = group.range ?? "—";

  return (
    <div className="rounded-lg border border-border bg-background p-3 text-xs">
      {/* Group label + trend badge */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground text-sm">
          {groupLabel(group.group)}
        </span>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${trendClass}`}
        >
          {trendText}
        </span>
      </div>

      {/* Stats grid */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Period</dt>
          <dd className="font-medium text-foreground">{yearSpan}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Latest value</dt>
          <dd className="font-medium text-foreground">
            {fmtNum(group.latest?.value ?? null)}
            {group.latest?.year ? (
              <span className="ml-1 text-muted-foreground text-[10px]">
                ({group.latest.year})
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Change</dt>
          <dd
            className={`font-medium ${
              (group.change.abs ?? 0) > 0
                ? "text-green-700 dark:text-green-400"
                : (group.change.abs ?? 0) < 0
                  ? "text-red-700 dark:text-red-400"
                  : "text-foreground"
            }`}
          >
            {fmtNum(group.change.abs)} ({fmtPct(group.change.pct)})
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Observations</dt>
          <dd className="font-medium text-foreground">{group.n}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Min</dt>
          <dd className="font-medium text-foreground">
            {fmtNum(group.stats.min)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Max</dt>
          <dd className="font-medium text-foreground">
            {fmtNum(group.stats.max)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Mean</dt>
          <dd className="font-medium text-foreground">
            {fmtNum(group.stats.mean)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Median</dt>
          <dd className="font-medium text-foreground">
            {fmtNum(group.stats.median)}
          </dd>
        </div>
      </dl>
    </div>
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

export type SummarizeDataProps = {
  /** Raw tool output — compact object or unparsed JSON string. */
  output: unknown;
};

export function SummarizeData({ output }: SummarizeDataProps) {
  const data = parseSummarizeOutput(output);

  if (data === null) {
    return (
      <ErrorBanner message="Unable to parse summarize_data output. Raw data may be in an unexpected format." />
    );
  }

  if (data.error) {
    return <ErrorBanner message={data.error} />;
  }

  if (data.groups.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
        No summary data available.
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
        <div className="flex items-center gap-2">
          {data.unit && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {data.unit}
            </span>
          )}
          {data.ambiguous_dimensions && data.ambiguous_dimensions.length > 0 && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              Auto-expanded: {data.ambiguous_dimensions.join(", ")}
            </span>
          )}
          <span className="text-muted-foreground text-xs">
            {data.groups.length} group{data.groups.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Group cards */}
      <div className="flex flex-col gap-2">
        {data.groups.map((group, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: groups have no stable id
          <GroupRow group={group} key={i} />
        ))}
      </div>
    </div>
  );
}
