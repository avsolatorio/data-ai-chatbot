"use client";

import { ClaimMark } from "@pcn-js/ui";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TimeSeriesChart } from "./charts";
import type { GetDataInput, GetDataOutput } from "./types";

const ChartIcon = ({ size = 24 }: { size?: number }) => (
  <svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
    <path
      d="M3 3v18h18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M7 16l4-4 4 4 6-6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

/** Human-readable dimension names for disaggregation filters */
const DIMENSION_LABELS: Record<string, string> = {
  REF_AREA: "Countries/areas",
  SEX: "Sex",
  AGE: "Age",
  URBANISATION: "Urbanisation",
  UNIT_MEASURE: "Unit",
};

export function GetDataRequestSummary({
  input,
  indicatorName,
}: {
  input: GetDataInput;
  indicatorName?: string | null;
}) {
  const hasDatabase =
    input.database_id != null && String(input.database_id).trim() !== "";
  const hasIndicator =
    input.indicator_id != null && String(input.indicator_id).trim() !== "";
  const hasIndicatorName =
    indicatorName != null && String(indicatorName).trim() !== "";
  const filters = input.disaggregation_filters
    ? Object.entries(input.disaggregation_filters).filter(
        ([, v]) => v != null && String(v).trim() !== "",
      )
    : [];
  const hasYears =
    (input.start_year != null && Number.isFinite(Number(input.start_year))) ||
    (input.end_year != null && Number.isFinite(Number(input.end_year)));
  const hasPagination =
    (input.limit != null && Number.isFinite(Number(input.limit))) ||
    (input.offset != null && Number.isFinite(Number(input.offset)));

  if (
    !hasDatabase &&
    !hasIndicator &&
    !hasIndicatorName &&
    filters.length === 0 &&
    !hasYears &&
    !hasPagination
  ) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Request
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
        {hasDatabase && (
          <>
            <dt className="font-medium text-muted-foreground">Database</dt>
            <dd className="font-mono text-foreground">{input.database_id}</dd>
          </>
        )}
        {hasIndicatorName && (
          <>
            <dt className="font-medium text-muted-foreground">
              Indicator name
            </dt>
            <dd className="text-foreground">{indicatorName}</dd>
          </>
        )}
        {hasIndicator && (
          <>
            <dt className="font-medium text-muted-foreground">Indicator ID</dt>
            <dd className="break-all font-mono text-foreground">
              {input.indicator_id}
            </dd>
          </>
        )}
        {hasYears && (
          <>
            <dt className="font-medium text-muted-foreground">Years</dt>
            <dd className="text-foreground">
              {input.start_year != null && input.end_year != null
                ? `${input.start_year} – ${input.end_year}`
                : input.start_year != null
                  ? `From ${input.start_year}`
                  : input.end_year != null
                    ? `Through ${input.end_year}`
                    : ""}
            </dd>
          </>
        )}
        {filters.length > 0 && (
          <>
            <dt className="font-medium text-muted-foreground">Filters</dt>
            <dd className="text-foreground">
              <span className="flex flex-wrap gap-x-2 gap-y-1">
                {filters.map(([dim, val]) => (
                  <span key={dim} className="rounded bg-muted px-1.5 py-0.5">
                    <span className="text-muted-foreground">
                      {DIMENSION_LABELS[dim] ?? dim}:
                    </span>{" "}
                    {val}
                  </span>
                ))}
              </span>
            </dd>
          </>
        )}
        {hasPagination && (
          <>
            <dt className="font-medium text-muted-foreground">Page</dt>
            <dd className="text-foreground">
              Limit {input.limit ?? "—"}, offset {input.offset ?? 0}
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}

export function GetData({
  input,
  output,
}: {
  input?: GetDataInput | null;
  output: GetDataOutput;
}) {
  // Group data by indicator
  const groupedByIndicator = useMemo(() => {
    if (!output.data || output.data.length === 0) {
      return new Map<string, typeof output.data>();
    }
    const groups = new Map<string, typeof output.data>();
    for (const point of output.data) {
      const key = point.INDICATOR;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(point);
    }
    return groups;
  }, [output.data]);

  // Get unique indicators
  const indicators = Array.from(groupedByIndicator.keys());

  // Indicator name(s) from data (for Request summary and header)
  const indicatorNamesFromData = useMemo(() => {
    if (!output.data || output.data.length === 0) {
      return [];
    }
    const nameByIndicator = new Map<string, string>();
    for (const point of output.data) {
      const name = point.INDICATOR_NAME?.trim();
      if (name && !nameByIndicator.has(point.INDICATOR)) {
        nameByIndicator.set(point.INDICATOR, name);
      }
    }
    return Array.from(nameByIndicator.values());
  }, [output.data]);
  const firstIndicatorName =
    indicatorNamesFromData.length > 0 ? indicatorNamesFromData[0] : null;

  // Get all unique countries/areas
  const areas = useMemo(() => {
    if (!output.data || output.data.length === 0) {
      return [];
    }
    const areaSet = new Set<string>();
    for (const point of output.data) {
      if (point.REF_AREA && point.REF_AREA !== "_T") {
        areaSet.add(point.REF_AREA);
      }
    }
    return Array.from(areaSet);
  }, [output.data]);

  // Check if we have time series data (multiple time periods)
  const hasTimeSeries = useMemo(() => {
    if (!output.data || output.data.length === 0) {
      return false;
    }
    const timePeriods = new Set(output.data.map((d) => d.TIME_PERIOD));
    return timePeriods.size > 1;
  }, [output.data]);

  // Prepare time series data for chart
  const timeSeriesData = useMemo(() => {
    if (!hasTimeSeries || !output.data) {
      return [];
    }
    return output.data
      .map((point) => ({
        country: point.REF_AREA,
        date: point.TIME_PERIOD,
        value: point.OBS_VALUE ? Number.parseFloat(point.OBS_VALUE) : null,
      }))
      .sort(
        (a, b) => Number.parseInt(a.date, 10) - Number.parseInt(b.date, 10),
      );
  }, [output.data, hasTimeSeries]);

  // Get min/max values for chart
  const { minValue, maxValue } = useMemo(() => {
    if (!output.data || output.data.length === 0) {
      return { minValue: 0, maxValue: 0 };
    }
    const values = output.data
      .map((d) => (d.OBS_VALUE ? Number.parseFloat(d.OBS_VALUE) : null))
      .filter((v): v is number => v !== null);
    return {
      minValue: values.length > 0 ? Math.min(...values) : 0,
      maxValue: values.length > 0 ? Math.max(...values) : 0,
    };
  }, [output.data]);

  // Handle error case
  if (output.error) {
    return (
      <div className="flex flex-col gap-3">
        {input != null && (
          <GetDataRequestSummary
            input={input}
            indicatorName={firstIndicatorName}
          />
        )}
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          <div className="font-medium">Error</div>
          <div className="mt-1">{output.error}</div>
        </div>
      </div>
    );
  }

  // Handle empty results
  if (!output.data || output.data.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {input != null && (
          <GetDataRequestSummary
            input={input}
            indicatorName={firstIndicatorName}
          />
        )}
        <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
          No data available
        </div>
      </div>
    );
  }

  // Format value with proper decimals
  const formatValue = (value: string, decimals: number | null) => {
    const num = Number.parseFloat(value);
    if (Number.isNaN(num)) {
      return value;
    }
    const dec = decimals !== null ? decimals : 2;
    return num.toLocaleString("en-US", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  };

  // Single data point view
  if (output.data.length === 1) {
    const point = output.data[0];
    return (
      <div className="flex flex-col gap-3">
        {input != null && (
          <GetDataRequestSummary
            input={input}
            indicatorName={point.INDICATOR_NAME ?? firstIndicatorName}
          />
        )}
        <Card className="w-full border-border shadow-sm">
          <CardHeader className="border-border border-b pb-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ChartIcon size={18} />
                <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Indicator Data
                </span>
              </div>
              <CardTitle className="font-semibold text-xl leading-snug">
                {point.INDICATOR_NAME || point.INDICATOR}
              </CardTitle>
              <CardDescription>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {point.INDICATOR_NAME && (
                    <span>
                      <span className="font-medium">ID:</span> {point.INDICATOR}
                    </span>
                  )}
                  <span>
                    <span className="font-medium">Database:</span>{" "}
                    {point.DATABASE_ID}
                  </span>
                  {point.REF_AREA && point.REF_AREA !== "_T" && (
                    <span>
                      <span className="font-medium">Area:</span>{" "}
                      {point.REF_AREA_NAME || point.REF_AREA}
                    </span>
                  )}
                  {point.TIME_PERIOD && (
                    <span>
                      <span className="font-medium">Period:</span>{" "}
                      {point.TIME_PERIOD}
                    </span>
                  )}
                </div>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-6">
            {/* Value Display */}
            <div className="rounded-lg border border-border bg-muted/30 p-6">
              <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Value
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-3xl text-foreground">
                  <ClaimMark
                    id={point.claim_id}
                    policy={{
                      type: "rounded",
                      decimals: point.DECIMALS ?? 2,
                    }}
                  >
                    {formatValue(point.OBS_VALUE, point.DECIMALS)}
                  </ClaimMark>
                </span>
                {point.UNIT_MEASURE && (
                  <span className="text-muted-foreground text-sm">
                    {point.UNIT_MEASURE_NAME || point.UNIT_MEASURE}
                  </span>
                )}
              </div>
              {point.LATEST_DATA && (
                <div className="mt-2 text-muted-foreground text-xs">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                    Latest Data
                  </span>
                </div>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              {point.FREQ && (
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Frequency
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {point.FREQ}
                  </div>
                </div>
              )}
              {point.OBS_STATUS && (
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Status
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {point.OBS_STATUS === "A"
                      ? "Actual"
                      : point.OBS_STATUS === "E"
                        ? "Estimated"
                        : "Others"}
                  </div>
                </div>
              )}
              {point.SEX && point.SEX !== "_T" && (
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Sex
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {point.SEX}
                  </div>
                </div>
              )}
              {point.AGE && point.AGE !== "_T" && (
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Age
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {point.AGE}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Multiple data points view
  return (
    <div className="flex w-full flex-col gap-4 overflow-hidden rounded-sm bg-background px-4 pb-4">
      {input != null && (
        <GetDataRequestSummary
          input={input}
          indicatorName={firstIndicatorName}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">
              <ChartIcon size={20} />
            </div>
            <div className="font-semibold text-sm">Indicator Data</div>
          </div>
          {indicatorNamesFromData.length > 0 && (
            <div className="text-muted-foreground text-xs">
              {indicatorNamesFromData.length === 1
                ? indicatorNamesFromData[0]
                : indicatorNamesFromData.slice(0, 3).join(" · ") +
                  (indicatorNamesFromData.length > 3
                    ? ` · +${indicatorNamesFromData.length - 3} more`
                    : "")}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground text-xs">
            {output.count} data point{output.count !== 1 ? "s" : ""}
          </div>
          {indicators.length > 1 && (
            <div className="text-muted-foreground text-xs">
              {indicators.length} indicator{indicators.length !== 1 ? "s" : ""}
            </div>
          )}
          {areas.length > 0 && (
            <div className="text-muted-foreground text-xs">
              {areas.length} area{areas.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Time Series Chart */}
      {/* {hasTimeSeries && timeSeriesData.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-3 font-medium text-sm">Trend Over Time</div>
          <TimeSeriesChart
            data={timeSeriesData}
            dateFormatter={(date) => date}
            height={200}
            maxValue={maxValue}
            minValue={minValue}
            showLegend={areas.length > 1}
            showStats
            title=""
          />
        </div>
      )} */}

      {/* Data Table */}
      <div className="rounded-lg border border-border bg-muted/30">
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="border-border border-b px-3 py-2 text-left font-medium">
                  Indicator
                </th>
                <th className="border-border border-b px-3 py-2 text-left font-medium">
                  Area
                </th>
                <th className="border-border border-b px-3 py-2 text-left font-medium">
                  Period
                </th>
                <th className="border-border border-b px-3 py-2 text-right font-medium">
                  Value
                </th>
                <th className="border-border border-b px-3 py-2 text-left font-medium">
                  Unit
                </th>
                <th className="border-border border-b px-3 py-2 text-left font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {output.data
                .sort((a, b) => {
                  // Sort by time period, then by area
                  const timeCompare =
                    Number.parseInt(b.TIME_PERIOD, 10) -
                    Number.parseInt(a.TIME_PERIOD, 10);
                  if (timeCompare !== 0) {
                    return timeCompare;
                  }
                  return (a.REF_AREA || "").localeCompare(b.REF_AREA || "");
                })
                .map((point, index) => (
                  <tr
                    className="hover:bg-muted/50"
                    key={`${point.claim_id}-${index}`}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium">
                        {point.INDICATOR_NAME || point.INDICATOR}
                      </div>
                      {point.INDICATOR_NAME && (
                        <div className="text-muted-foreground text-[10px]">
                          {point.INDICATOR}
                        </div>
                      )}
                      <div className="text-muted-foreground text-[10px]">
                        {point.DATABASE_ID}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {point.REF_AREA && point.REF_AREA !== "_T"
                        ? point.REF_AREA_NAME || point.REF_AREA
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {point.TIME_PERIOD}
                        {point.LATEST_DATA && (
                          <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] text-primary">
                            Latest
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      <ClaimMark
                        id={point.claim_id}
                        policy={{
                          type: "rounded",
                          decimals: point.DECIMALS ?? 2,
                        }}
                      >
                        {formatValue(point.OBS_VALUE, point.DECIMALS)}
                      </ClaimMark>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-[10px]">
                      {point.UNIT_MEASURE_NAME || point.UNIT_MEASURE || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                          point.OBS_STATUS === "A"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {point.OBS_STATUS === "A"
                          ? "Actual"
                          : point.OBS_STATUS === "E"
                            ? "Estimated"
                            : "Others"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Info */}
      {output.has_more && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 text-blue-600 dark:text-blue-400">
              <svg
                fill="none"
                height="16"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="text-blue-800 text-xs leading-relaxed dark:text-blue-200">
              Showing {output.count} of{" "}
              {output.total_count?.toLocaleString() || "many"} data points.
              {output.has_more &&
                output.next_offset !== null &&
                ` Next page starts at offset ${output.next_offset}.`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
