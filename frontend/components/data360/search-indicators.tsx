"use client";

import { SearchIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SearchIndicatorsInput, SearchIndicatorsOutput } from "./types";

const SearchIconComponent = () => (
  <SearchIcon className="size-5 text-muted-foreground" />
);

/** Derives whether the result came from query_groups, queries (shared country), or a single query. */
function getSearchMode(
  output: SearchIndicatorsOutput,
): "query_groups" | "queries" | "query" {
  const queries = output.queries;
  if (!queries || queries.length <= 1) return "query";

  // query_groups: indicators have per-indicator requested_country that differ across results
  const countries = new Set(
    output.indicators.map((i) => i.requested_country).filter(Boolean),
  );
  if (countries.size > 1) return "query_groups";

  return "queries";
}

export function SearchIndicatorsRequestSummary({
  input,
}: {
  input: SearchIndicatorsInput;
}) {
  const hasQuery = input.query != null && String(input.query).trim() !== "";
  const hasCountry =
    input.required_country != null &&
    String(input.required_country).trim() !== "";
  const hasLimit =
    input.limit != null && Number.isFinite(Number(input.limit));
  const hasOffset =
    input.offset != null && Number.isFinite(Number(input.offset));

  if (!hasQuery && !hasCountry && !hasLimit && !hasOffset) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Request
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
        {hasQuery && (
          <>
            <dt className="font-medium text-muted-foreground">Query</dt>
            <dd className="text-foreground">&ldquo;{input.query}&rdquo;</dd>
          </>
        )}
        {hasCountry && (
          <>
            <dt className="font-medium text-muted-foreground">
              Required country
            </dt>
            <dd className="font-mono text-foreground">
              {input.required_country}
            </dd>
          </>
        )}
        {hasLimit && (
          <>
            <dt className="font-medium text-muted-foreground">Limit</dt>
            <dd className="text-foreground">{input.limit}</dd>
          </>
        )}
        {hasOffset && (
          <>
            <dt className="font-medium text-muted-foreground">Offset</dt>
            <dd className="text-foreground">{input.offset}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

/** Badge showing search mode. */
function SearchModeBadge({
  mode,
}: {
  mode: "query_groups" | "queries" | "query";
}) {
  if (mode === "query") return null;

  const label =
    mode === "query_groups" ? "Multi-query (grouped)" : "Multi-query";
  const title =
    mode === "query_groups"
      ? "Different indicators searched per country group"
      : "Multiple indicators searched with shared country scope";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-medium text-blue-400 text-[10px] leading-tight cursor-default">
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="max-w-xs text-xs">{title}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** Sub-query tags shown for multi-query results. */
function QueryTags({ queries }: { queries: string[] }) {
  if (!queries || queries.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {queries.map((q) => (
        <span
          key={q}
          className="inline-flex items-center rounded border border-border bg-muted/40 px-2 py-0.5 font-mono text-muted-foreground text-[10px]"
        >
          {q}
        </span>
      ))}
    </div>
  );
}

/** Dedup summary shown for merged multi-query results. */
function DedupBadge({
  totalCandidates,
  dedupCount,
}: {
  totalCandidates: number;
  dedupCount: number | null | undefined;
}) {
  if (!dedupCount) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-400 text-[10px] leading-tight cursor-default">
          {dedupCount} deduped
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="max-w-xs text-xs">
          {totalCandidates} total candidates found across all sub-queries.{" "}
          {dedupCount} duplicate{dedupCount !== 1 ? "s" : ""} removed.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

/** Renders the covers_country map as colored country code pills. */
function CoversCountryPills({
  coversCountry,
}: {
  coversCountry: Record<string, boolean> | null | undefined;
}) {
  if (!coversCountry) return null;
  const entries = Object.entries(coversCountry);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([code, covers]) => (
        <span
          key={code}
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] leading-tight ${
            covers
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border border-muted bg-muted/30 text-muted-foreground"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${covers ? "bg-emerald-400" : "bg-muted-foreground/40"}`}
          />
          {code}
        </span>
      ))}
    </div>
  );
}

export function SearchIndicators({
  input,
  output,
}: {
  input?: SearchIndicatorsInput | null;
  output: SearchIndicatorsOutput;
}) {
  const requestSummary =
    input != null ? <SearchIndicatorsRequestSummary input={input} /> : null;

  // Handle error case
  if (output.error) {
    return (
      <div className="flex flex-col gap-3">
        {requestSummary}
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          <div className="font-medium">Error</div>
          <div className="mt-1">{output.error}</div>
        </div>
      </div>
    );
  }

  // Handle empty results
  if (!output.indicators || output.indicators.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {requestSummary}
        <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
          No indicators found
        </div>
      </div>
    );
  }

  const mode = getSearchMode(output);
  const isMultiQuery = mode !== "query";
  const queries = output.queries ?? [];

  return (
    <TooltipProvider>
      <div className="flex w-full flex-col gap-4 overflow-hidden rounded-sm bg-background px-4 pb-4">
        {requestSummary}

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <SearchIconComponent />
              <div className="font-semibold text-sm">Search Results</div>
              <SearchModeBadge mode={mode} />
              {isMultiQuery && output.total_candidates != null && output.deduplicated_count != null && (
                <DedupBadge
                  totalCandidates={output.total_candidates}
                  dedupCount={output.deduplicated_count}
                />
              )}
            </div>
            {/* Sub-query tags for multi-query */}
            {isMultiQuery && queries.length > 0 && (
              <QueryTags queries={queries} />
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="text-muted-foreground text-xs">
              {output.total_count != null ? (
                <>
                  Showing {output.count} of {output.total_count.toLocaleString()}{" "}
                  indicator{output.total_count !== 1 ? "s" : ""}
                </>
              ) : (
                <>
                  Showing {output.indicators.length} indicator
                  {output.indicators.length !== 1 ? "s" : ""}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cards — grouped by country for query_groups, flat for query/queries */}
        {mode === "query_groups" ? (
          <GroupedIndicatorRows output={output} />
        ) : (
          <FlatIndicatorRow indicators={output.indicators} mode={mode} />
        )}
      </div>
    </TooltipProvider>
  );
}

/** Renders a single indicator card (shared between flat and grouped layouts). */
function IndicatorCard({
  indicator,
  index,
  mode,
}: {
  indicator: SearchIndicatorsOutput["indicators"][number];
  index: number;
  mode: "query_groups" | "queries" | "query";
}) {
  return (
    <Tooltip>
      <Card
        className="min-w-[360px] max-w-[420px] shrink-0 border-border transition-colors hover:border-primary/50"
        key={`${indicator.idno}-${index}`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="line-clamp-2 font-medium text-sm leading-tight whitespace-normal">
            {indicator.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            {/* ID and Database */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
              <div>
                <span className="font-medium">ID:</span> {indicator.idno}
              </div>
              <div>
                <span className="font-medium">Database:</span>{" "}
                {indicator.database_id}
              </div>
            </div>

            {/* Country coverage pills — for queries (shared country) shows green/grey per country */}
            {indicator.covers_country && (
              <CoversCountryPills coversCountry={indicator.covers_country} />
            )}

            {/* Definition */}
            {indicator.truncated_definition && (
              <TooltipTrigger asChild>
                <div className="rounded border border-border bg-muted/30 p-2.5 cursor-default">
                  <div className="line-clamp-3 text-muted-foreground text-xs leading-relaxed whitespace-normal">
                    {indicator.truncated_definition}
                  </div>
                </div>
              </TooltipTrigger>
            )}
            {indicator.truncated_definition && (
              <TooltipContent className="max-w-md" side="top">
                <p className="whitespace-normal text-xs">
                  {indicator.truncated_definition}
                </p>
              </TooltipContent>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 rounded border border-border bg-muted/20 p-2">
              {indicator.periodicity && (
                <div className="text-muted-foreground text-xs">
                  <span className="font-medium">Periodicity:</span>{" "}
                  <span className="text-foreground">{indicator.periodicity}</span>
                </div>
              )}
              {indicator.latest_data && (
                <div className="text-muted-foreground text-xs">
                  <span className="font-medium">Latest:</span>{" "}
                  <span className="text-foreground">{indicator.latest_data}</span>
                </div>
              )}
              {indicator.time_period_range && (
                <div className="col-span-2 text-muted-foreground text-xs">
                  <span className="font-medium">Range:</span>{" "}
                  <span className="text-foreground">{indicator.time_period_range}</span>
                </div>
              )}
              {indicator.dimensions && indicator.dimensions.length > 0 && (
                <div className="col-span-2 text-muted-foreground text-xs">
                  <span className="font-medium">Dimensions:</span>{" "}
                  <span className="text-foreground">
                    {indicator.dimensions.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Tooltip>
  );
}

/** Flat single-row horizontal scroll — used for `query` and `queries` modes. */
function FlatIndicatorRow({
  indicators,
  mode,
}: {
  indicators: SearchIndicatorsOutput["indicators"];
  mode: "query_groups" | "queries" | "query";
}) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex w-max gap-3 pb-4">
        {indicators.map((indicator, index) => (
          <IndicatorCard
            key={`${indicator.idno}-${index}`}
            indicator={indicator}
            index={index}
            mode={mode}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

/** Grouped layout for `query_groups` — one horizontal scroll row per country. */
function GroupedIndicatorRows({
  output,
}: {
  output: SearchIndicatorsOutput;
}) {
  const { indicators } = output;

  // Group indicators by requested_country; preserve insertion order of countries
  const countryOrder: string[] = [];
  const groups: Record<string, typeof indicators> = {};

  for (const ind of indicators) {
    const key = ind.requested_country ?? "Unknown";
    if (!groups[key]) {
      groups[key] = [];
      countryOrder.push(key);
    }
    groups[key].push(ind);
  }

  return (
    <div className="flex flex-col gap-5">
      {countryOrder.map((country) => {
        const groupIndicators = groups[country];
        return (
          <div key={country} className="flex flex-col gap-2">
            {/* Country section header */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono font-semibold text-emerald-400 text-xs">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {country}
              </span>
              <span className="text-muted-foreground text-xs">
                {groupIndicators.length} indicator{groupIndicators.length !== 1 ? "s" : ""}
              </span>
            </div>
            {/* Horizontal scroll row for this country's indicators */}
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max gap-3 pb-3">
                {groupIndicators.map((indicator, index) => (
                  <IndicatorCard
                    key={`${indicator.idno}-${index}`}
                    indicator={indicator}
                    index={index}
                    mode="query_groups"
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
