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

// ─── Country name resolution ──────────────────────────────────────────────────
// Maps ISO 3166-1 alpha-3 → alpha-2 for Intl.DisplayNames (which uses alpha-2).
// Covers the most common World Bank research countries.
const ISO3_TO_ISO2: Record<string, string> = {
  AFG:"AF",AGO:"AO",ALB:"AL",ARE:"AE",ARG:"AR",ARM:"AM",AUS:"AU",AUT:"AT",
  AZE:"AZ",BDI:"BI",BEL:"BE",BEN:"BJ",BFA:"BF",BGD:"BD",BGR:"BG",BHR:"BH",
  BIH:"BA",BLR:"BY",BLZ:"BZ",BOL:"BO",BRA:"BR",BTN:"BT",BWA:"BW",CAF:"CF",
  CAN:"CA",CHE:"CH",CHL:"CL",CHN:"CN",CIV:"CI",CMR:"CM",COD:"CD",COG:"CG",
  COL:"CO",COM:"KM",CPV:"CV",CRI:"CR",CUB:"CU",CYP:"CY",CZE:"CZ",DEU:"DE",
  DJI:"DJ",DNK:"DK",DOM:"DO",DZA:"DZ",ECU:"EC",EGY:"EG",ERI:"ER",ESP:"ES",
  EST:"EE",ETH:"ET",FIN:"FI",FJI:"FJ",FRA:"FR",GAB:"GA",GBR:"GB",GEO:"GE",
  GHA:"GH",GIN:"GN",GMB:"GM",GNB:"GW",GRC:"GR",GTM:"GT",GUY:"GY",HND:"HN",
  HRV:"HR",HTI:"HT",HUN:"HU",IDN:"ID",IND:"IN",IRL:"IE",IRN:"IR",IRQ:"IQ",
  ISL:"IS",ISR:"IL",ITA:"IT",JAM:"JM",JOR:"JO",JPN:"JP",KAZ:"KZ",KEN:"KE",
  KGZ:"KG",KHM:"KH",KIR:"KI",KOR:"KR",KWT:"KW",LAO:"LA",LBN:"LB",LBR:"LR",
  LBY:"LY",LCA:"LC",LKA:"LK",LSO:"LS",LTU:"LT",LUX:"LU",LVA:"LV",MAR:"MA",
  MDA:"MD",MDG:"MG",MDV:"MV",MEX:"MX",MKD:"MK",MLI:"ML",MLT:"MT",MMR:"MM",
  MNG:"MN",MOZ:"MZ",MRT:"MR",MUS:"MU",MWI:"MW",MYS:"MY",NAM:"NA",NER:"NE",
  NGA:"NG",NIC:"NI",NLD:"NL",NOR:"NO",NPL:"NP",NZL:"NZ",OMN:"OM",PAK:"PK",
  PAN:"PA",PER:"PE",PHL:"PH",PNG:"PG",POL:"PL",PRK:"KP",PRT:"PT",PRY:"PY",
  PSE:"PS",QAT:"QA",ROU:"RO",RUS:"RU",RWA:"RW",SAU:"SA",SDN:"SD",SEN:"SN",
  SLB:"SB",SLE:"SL",SLV:"SV",SOM:"SO",SRB:"RS",SSD:"SS",STP:"ST",SUR:"SR",
  SVK:"SK",SVN:"SI",SWE:"SE",SWZ:"SZ",SYC:"SC",SYR:"SY",TCD:"TD",TGO:"TG",
  THA:"TH",TJK:"TJ",TKM:"TM",TLS:"TL",TON:"TO",TTO:"TT",TUN:"TN",TUR:"TR",
  TZA:"TZ",UGA:"UG",UKR:"UA",URY:"UY",USA:"US",UZB:"UZ",VEN:"VE",VNM:"VN",
  VUT:"VU",WSM:"WS",YEM:"YE",ZAF:"ZA",ZMB:"ZM",ZWE:"ZW",
};

let _displayNames: Intl.DisplayNames | null = null;
function getDisplayNames(): Intl.DisplayNames | null {
  try {
    if (!_displayNames) _displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return _displayNames;
  } catch {
    return null;
  }
}

/** Resolve an ISO-3 code to a human-readable English name, e.g. "JPN" → "Japan". */
function resolveCountryName(code: string): string {
  const alpha2 = ISO3_TO_ISO2[code.toUpperCase()];
  if (!alpha2) return code;
  try {
    return getDisplayNames()?.of(alpha2) ?? code;
  } catch {
    return code;
  }
}

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

  // ── query_groups with result_layout="by_query": grouped accordion ────────
  if (output.result_layout === "by_query" && output.results && output.results.length > 0) {
    // Group results by country, then format as:
    // "Japan: inflation rate · China: population, GDP per capita"
    type CountryGroup = { name: string; queries: string[] };
    const byCountry = new Map<string, CountryGroup>();

    for (const g of output.results) {
      const code = g.country_code ?? "__none__";
      if (!byCountry.has(code)) {
        byCountry.set(code, {
          name: g.country_code ? resolveCountryName(g.country_code) : "",
          queries: [],
        });
      }
      byCountry.get(code)!.queries.push(g.query);
    }

    const groupSubtitle = Array.from(byCountry.values())
      .map((c) => (c.name ? `${c.name}: ${c.queries.join(", ")}` : c.queries.join(", ")))
      .join(" · ");

    // Attach resolved country names onto the groups for GroupHeader to display
    const groupsWithNames = output.results.map((g) => ({
      ...g,
      country_name: g.country_code ? resolveCountryName(g.country_code) : undefined,
    }));

    return (
      <div className="flex flex-col gap-3">
        {requestSummary}
        <SearchResultCard
          groups={groupsWithNames}
          title="Multi-country Search"
          subtitle={groupSubtitle}
        />
      </div>
    );
  }

  // ── query_groups fallback: merged layout but multiple countries ───────────
  // Detected by semicolon in required_country (e.g. "CHN;JPN") or query count
  const isCrossCountry =
    output.required_country?.includes(";") ||
    output.required_country?.includes(",");

  if (queries.length > 1 && isCrossCountry) {
    const rawCodes = (output.required_country ?? "").split(/[;,]/).map((c) => c.trim()).filter(Boolean);
    const countryNames = rawCodes.map(resolveCountryName).join(", ");
    const subtitle = `${queries.join(", ")} · ${countryNames}`;

    return (
      <div className="flex flex-col gap-3">
        {requestSummary}
        <SearchResultCard
          indicators={output.indicators}
          title="Multi-country Search"
          subtitle={subtitle}
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
