"use client";

import { ClaimMark } from "@pcn-js/ui";

// ---------------------------------------------------------------------------
// Types — mirrors RankingResponse.to_compact() on the MCP server
// ---------------------------------------------------------------------------

export type CompactRankedCountry = {
  rank: number;
  code: string;
  country: string;
  value: number;
  claim_id: string | null;
};

export type CompactRankingOutput = {
  year: string | null;
  year_selection_note: string | null;
  order: "asc" | "desc";
  counts: { with_data: number; requested: number };
  unit: string | null;
  indicator: string | null;
  rankings: CompactRankedCountry[];
  excluded_count: number;
  excluded_sample: Array<{ code: string; name: string | null }>;
  error: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

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

function RankingHeader({
  output,
}: {
  output: CompactRankingOutput;
}) {
  const coverage =
    output.counts.requested > 0
      ? `${output.counts.with_data} / ${output.counts.requested} countries`
      : `${output.counts.with_data} countries`;

  return (
    <div className="flex flex-col gap-1 pb-3">
      {output.indicator && (
        <div className="font-semibold text-sm text-foreground leading-snug">
          {output.indicator}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
        {output.year && (
          <span>
            <span className="font-medium text-foreground">{output.year}</span>
          </span>
        )}
        {output.unit && <span>{output.unit}</span>}
        <span
          className="rounded bg-muted px-1.5 py-0.5"
          title="Countries with data / countries requested"
        >
          {coverage}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5">
          {output.order === "desc" ? "Highest first" : "Lowest first"}
        </span>
      </div>
      {output.year_selection_note && (
        <div className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">
          {output.year_selection_note}
        </div>
      )}
    </div>
  );
}

function RankingTable({
  rankings,
  unit,
}: {
  rankings: CompactRankedCountry[];
  unit: string | null;
}) {
  if (rankings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
        No ranking data available.
      </div>
    );
  }

  const topValue = rankings[0]?.value ?? 0;

  return (
    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
      <div className="overflow-auto max-h-96">
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
                Value {unit ? <span className="font-normal text-muted-foreground">({unit})</span> : null}
              </th>
              <th className="border-border border-b px-3 py-2 w-28 sr-only">
                Bar
              </th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((entry, idx) => {
              const barPct =
                topValue !== 0
                  ? Math.max(0, Math.min(100, (Math.abs(entry.value) / Math.abs(topValue)) * 100))
                  : 0;

              return (
                <tr
                  className="hover:bg-muted/50 border-border border-b last:border-b-0"
                  key={`${entry.code}-${idx}`}
                >
                  <td className="px-3 py-2 text-muted-foreground font-mono">
                    {entry.rank}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{entry.country}</div>
                    {entry.country !== entry.code && (
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
                        {formatValue(entry.value)}
                      </ClaimMark>
                    ) : (
                      formatValue(entry.value)
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExcludedFooter({
  count,
  sample,
  year,
}: {
  count: number;
  sample: Array<{ code: string; name: string | null }>;
  year: string | null;
}) {
  if (count === 0) return null;

  const sampleNames = sample
    .map((e) => e.name ?? e.code)
    .join(", ");

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-muted-foreground text-xs">
      <span className="font-medium">{count}</span>{" "}
      {count === 1 ? "country" : "countries"} had no data
      {year ? ` for ${year}` : ""}.
      {sampleNames && (
        <span className="ml-1">
          Includes: {sampleNames}
          {count > sample.length && ` (+${count - sample.length} more)`}.
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function RankCountries({ output }: { output: CompactRankingOutput }) {
  if (output.error) {
    return (
      <div className="flex flex-col gap-3">
        <ErrorBanner message={output.error} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 overflow-hidden rounded-sm bg-background px-4 pb-4">
      <RankingHeader output={output} />
      <RankingTable rankings={output.rankings} unit={output.unit} />
      <ExcludedFooter
        count={output.excluded_count}
        sample={output.excluded_sample}
        year={output.year}
      />
    </div>
  );
}
