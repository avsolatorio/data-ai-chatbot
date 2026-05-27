"use client";

import { ClaimMark } from "@pcn-js/ui";
import { formatNum, ErrorBanner } from "./shared";
import type { CompactRankedCountry, CompactRankingOutput } from "@pcn-js/data360";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------



function RankingHeader({ output }: { output: CompactRankingOutput }) {
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
  year,
}: {
  rankings: CompactRankedCountry[];
  unit: string | null;
  year: string | null;
}) {
  if (rankings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
        No ranking data available.
      </div>
    );
  }

  const maxAbsValue = rankings.reduce(
    (max, entry) => Math.max(max, entry.value ? Math.abs(entry.value) : 0),
    0,
  );

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
                Value{" "}
                {unit ? (
                  <span className="font-normal text-muted-foreground">
                    ({unit})
                  </span>
                ) : null}
              </th>
              <th className="border-border border-b px-3 py-2 w-28 sr-only">
                Bar
              </th>
              <th className="border-border border-b px-3 py-2 text-right font-medium">
                Year
              </th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((entry, idx) => {
              const barPct =
                maxAbsValue !== 0 && entry.value
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        (Math.abs(entry.value) / maxAbsValue) * 100,
                      ),
                    )
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
                    <div className="font-medium">{entry.country ?? entry.code ?? "\u2014"}</div>
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
                        {formatNum(entry.value, 2, 4)}
                      </ClaimMark>
                    ) : (
                      formatNum(entry.value, 2, 4)
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
                  <td className="px-3 py-2 text-right text-muted-foreground font-mono">
                    {year ?? "\u2014"}
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

  const sampleNames = sample.map((e) => e.name ?? e.code).join(", ");

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
      <RankingTable rankings={output.rankings} unit={output.unit} year={output.year} />
      <ExcludedFooter
        count={output.excluded_count}
        sample={output.excluded_sample}
        year={output.year}
      />
    </div>
  );
}
