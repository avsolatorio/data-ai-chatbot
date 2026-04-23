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
import { SearchResultCard } from "@data360/mcp-ui/search-card";

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

  // Error case
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

  const queries = output.queries ?? (output.query ? [output.query] : []);

  // ── query_groups: different indicators searched per country ───────────────
  if (output.result_layout === "by_query" && output.results && output.results.length > 0) {
    // subtitle: "CHN: GDP per capita · JPN: Life expectancy"
    const groupSubtitle = output.results
      .map((g) => (g.country_code ? `${g.country_code}: ${g.query}` : g.query))
      .join(" · ");

    return (
      <div className="flex flex-col gap-3">
        {requestSummary}
        <SearchResultCard
          groups={output.results}
          title="Multi-country Search"
          subtitle={groupSubtitle}
        />
      </div>
    );
  }

  // ── queries: multiple topics, shared country ──────────────────────────────
  if (queries.length > 1) {
    const country = output.required_country ? ` · ${output.required_country}` : "";
    const subtitle = queries.join(" · ") + country;

    return (
      <div className="flex flex-col gap-3">
        {requestSummary}
        <SearchResultCard
          indicators={output.indicators}
          title="Multi-query Search"
          subtitle={subtitle}
        />
      </div>
    );
  }

  // ── query: single topic ───────────────────────────────────────────────────
  const singleQuery = queries[0] ?? output.query ?? "Search";
  const country = output.required_country ? ` · ${output.required_country}` : "";
  const subtitle = `${singleQuery}${country}`;

  return (
    <div className="flex flex-col gap-3">
      {requestSummary}
      <SearchResultCard
        indicators={output.indicators}
        title="Indicator Search"
        subtitle={subtitle}
      />
    </div>
  );
}

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * REFERENCE IMPLEMENTATION (commented out — preserved for comparison)
 *
 * The components below are the original custom search UI built before
 * @data360/mcp-ui/SearchResultCard was available. They implement the same
 * functionality inline using shadcn/ui primitives and Tailwind.
 *
 * Keep these until SearchResultCard is fully validated in production.
 * ──────────────────────────────────────────────────────────────────────────────
 */

/*
const SearchIconComponent = () => (
  <SearchIcon className="size-5 text-muted-foreground" />
);

function getSearchMode(
  output: SearchIndicatorsOutput,
): "query_groups" | "queries" | "query" {
  const queries = output.queries;
  if (!queries || queries.length <= 1) return "query";
  const countries = new Set(
    output.indicators.map((i) => i.requested_country).filter(Boolean),
  );
  if (countries.size > 1) return "query_groups";
  return "queries";
}

function SearchModeBadge({ mode }: { mode: "query_groups" | "queries" | "query" }) {
  if (mode === "query") return null;
  const label = mode === "query_groups" ? "Multi-query (grouped)" : "Multi-query";
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
      <TooltipContent side="top"><p className="max-w-xs text-xs">{title}</p></TooltipContent>
    </Tooltip>
  );
}

function QueryTags({ queries }: { queries: string[] }) {
  if (!queries || queries.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {queries.map((q) => (
        <span key={q} className="inline-flex items-center rounded border border-border bg-muted/40 px-2 py-0.5 font-mono text-muted-foreground text-[10px]">
          {q}
        </span>
      ))}
    </div>
  );
}

function DedupBadge({ totalCandidates, dedupCount }: { totalCandidates: number; dedupCount: number | null | undefined }) {
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

function CoversCountryPills({ coversCountry }: { coversCountry: Record<string, boolean> | null | undefined }) {
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
          <span className={`size-1.5 rounded-full ${covers ? "bg-emerald-400" : "bg-muted-foreground/40"}`} />
          {code}
        </span>
      ))}
    </div>
  );
}

function IndicatorCard({ indicator, index, mode }: {
  indicator: SearchIndicatorsOutput["indicators"][number];
  index: number;
  mode: "query_groups" | "queries" | "query";
}) {
  return (
    <Tooltip>
      <Card className="min-w-[360px] max-w-[420px] shrink-0 border-border transition-colors hover:border-primary/50" key={`${indicator.idno}-${index}`}>
        <CardHeader className="pb-3">
          <CardTitle className="line-clamp-2 font-medium text-sm leading-tight whitespace-normal">{indicator.name}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
              <div><span className="font-medium">ID:</span> {indicator.idno}</div>
              <div><span className="font-medium">Database:</span> {indicator.database_id}</div>
            </div>
            {indicator.covers_country && <CoversCountryPills coversCountry={indicator.covers_country} />}
            {indicator.truncated_definition && (
              <TooltipTrigger asChild>
                <div className="rounded border border-border bg-muted/30 p-2.5 cursor-default">
                  <div className="line-clamp-3 text-muted-foreground text-xs leading-relaxed whitespace-normal">{indicator.truncated_definition}</div>
                </div>
              </TooltipTrigger>
            )}
            {indicator.truncated_definition && (
              <TooltipContent className="max-w-md" side="top">
                <p className="whitespace-normal text-xs">{indicator.truncated_definition}</p>
              </TooltipContent>
            )}
            <div className="grid grid-cols-2 gap-2 rounded border border-border bg-muted/20 p-2">
              {indicator.periodicity && (
                <div className="text-muted-foreground text-xs"><span className="font-medium">Periodicity:</span> <span className="text-foreground">{indicator.periodicity}</span></div>
              )}
              {indicator.latest_data && (
                <div className="text-muted-foreground text-xs"><span className="font-medium">Latest:</span> <span className="text-foreground">{indicator.latest_data}</span></div>
              )}
              {indicator.time_period_range && (
                <div className="col-span-2 text-muted-foreground text-xs"><span className="font-medium">Range:</span> <span className="text-foreground">{indicator.time_period_range}</span></div>
              )}
              {indicator.dimensions && indicator.dimensions.length > 0 && (
                <div className="col-span-2 text-muted-foreground text-xs"><span className="font-medium">Dimensions:</span> <span className="text-foreground">{indicator.dimensions.join(", ")}</span></div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Tooltip>
  );
}

function FlatIndicatorRow({ indicators, mode }: { indicators: SearchIndicatorsOutput["indicators"]; mode: "query_groups" | "queries" | "query" }) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex w-max gap-3 pb-4">
        {indicators.map((indicator, index) => (
          <IndicatorCard key={`${indicator.idno}-${index}`} indicator={indicator} index={index} mode={mode} />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

function GroupedIndicatorRows({ output }: { output: SearchIndicatorsOutput }) {
  const { indicators } = output;
  const countryOrder: string[] = [];
  const groups: Record<string, typeof indicators> = {};
  for (const ind of indicators) {
    const key = ind.requested_country ?? "Unknown";
    if (!groups[key]) { groups[key] = []; countryOrder.push(key); }
    groups[key].push(ind);
  }
  return (
    <div className="flex flex-col gap-5">
      {countryOrder.map((country) => {
        const groupIndicators = groups[country];
        return (
          <div key={country} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono font-semibold text-emerald-400 text-xs">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {country}
              </span>
              <span className="text-muted-foreground text-xs">{groupIndicators.length} indicator{groupIndicators.length !== 1 ? "s" : ""}</span>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max gap-3 pb-3">
                {groupIndicators.map((indicator, index) => (
                  <IndicatorCard key={`${indicator.idno}-${index}`} indicator={indicator} index={index} mode="query_groups" />
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
*/
