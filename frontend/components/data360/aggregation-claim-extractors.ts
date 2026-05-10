/**
 * Custom ToolResultExtractor functions for aggregation tools.
 *
 * The compact serializer (_compact_aggregation_serializer) sends a space-efficient
 * payload as the tool output. These extractors walk the compact structure and
 * return ClaimEntry[] so the ClaimsManager can register them before ClaimMark
 * components render.
 *
 * Both extractors defensively handle the case where `output` arrives as a raw
 * JSON string (non-normalised pipeline paths) rather than a pre-parsed object.
 *
 * Compact output shapes (from to_compact() on the MCP server):
 *
 * rank_countries:
 *   { rankings: [{ rank, code, country, value, claim_id }, ...] }
 *
 * compare_countries:
 *   { snapshot: { rankings: [{ rank, code, country, value, claim_id }] },
 *     time_series: { series_schema: ["time_period","obs_value","claim_id"],
 *                    series: { "KEN": [[year, value, claim_id], ...] } } }
 *
 * summarize_data:
 *   { groups: [{ claim_ids: [id, ...], ... }] }
 */

import type { ClaimEntry, ToolResultExtractor } from "@pcn-js/core";
import type { CompactRankingOutput } from "./rank-countries";
import type { CompactComparisonOutput, CompactTimeSeries } from "./compare-countries";
import type { CompactSummaryOutput } from "./summarize-data";

function parseOutput<T>(output: unknown): T | null {
  if (output === null || output === undefined) return null;
  if (typeof output === "string") {
    try {
      return JSON.parse(output) as T;
    } catch {
      return null;
    }
  }
  if (typeof output === "object") return output as T;
  return null;
}

/**
 * Extractor for data360_rank_countries compact output.
 * Registers { id: claim_id, claim: { value } } for every entry in rankings[].
 */
export const rankCountriesExtractor: ToolResultExtractor = (output) => {
  const data = parseOutput<CompactRankingOutput>(output);
  if (!data?.rankings) return [];

  const entries: ClaimEntry[] = [];
  for (const entry of data.rankings) {
    if (entry.claim_id && entry.value !== undefined && entry.value !== null) {
      entries.push({
        id: entry.claim_id,
        claim: { value: entry.value, country: entry.code },
      });
    }
  }
  return entries;
};

/**
 * Extractor for data360_compare_countries compact output.
 * Registers claim_ids from both the snapshot rankings and time-series entries.
 *
 * Time series uses positional arrays: series_schema defines the column order,
 * defaulting to ["time_period", "obs_value", "claim_id"]. We read column
 * indices from series_schema — never hard-code offsets.
 */
export const compareCountriesExtractor: ToolResultExtractor = (output) => {
  const data = parseOutput<CompactComparisonOutput>(output);
  if (!data) return [];

  const entries: ClaimEntry[] = [];

  // Snapshot rankings — same shape as rank_countries entries
  if (data.snapshot?.rankings) {
    for (const entry of data.snapshot.rankings) {
      if (entry.claim_id && entry.value !== undefined && entry.value !== null) {
        entries.push({
          id: entry.claim_id,
          claim: { value: entry.value, country: entry.code, date: data.snapshot.year },
        });
      }
    }
  }

  // Time-series — positional arrays keyed by country code
  const ts = data.time_series as CompactTimeSeries | null | undefined;
  if (ts?.series) {
    const schema = ts.series_schema ?? ["time_period", "obs_value", "claim_id"];
    const colValue = schema.indexOf("obs_value");
    const colClaim = schema.indexOf("claim_id");
    const colYear = schema.indexOf("time_period");

    for (const [countryCode, points] of Object.entries(ts.series)) {
      if (!Array.isArray(points)) continue;
      for (const pt of points) {
        if (!Array.isArray(pt)) continue;
        const claimId = colClaim >= 0 ? (pt[colClaim] as string | null) : null;
        const value = colValue >= 0 ? (pt[colValue] as number | null) : null;
        const year = colYear >= 0 ? String(pt[colYear] ?? "") : undefined;
        if (claimId && value !== null && value !== undefined) {
          entries.push({
            id: claimId,
            claim: { value, country: countryCode, date: year },
          });
        }
      }
    }
  }

  return entries;
};

/**
 * Extractor for data360_summarize_data compact output.
 *
 * The compact format only exposes per-observation values for two data points:
 *   - group.earliest → claim_ids[0]  (chronologically first observation)
 *   - group.latest   → claim_ids[-1] (chronologically last observation)
 *
 * All intermediate claim_ids in between map to observations whose values are
 * not present in the compact payload. Per the Writer prompt rule, those IDs
 * should never appear in prose — so we do not register them here.
 *
 * Registering every claim_id with latest.value (the prior behaviour) caused
 * ClaimMark tooltips to show the wrong value for the earliest observation.
 */
export const summarizeDataExtractor: ToolResultExtractor = (output) => {
  const data = parseOutput<CompactSummaryOutput>(output);
  if (!data?.groups) return [];

  const entries: ClaimEntry[] = [];
  for (const group of data.groups) {
    if (!group.claim_ids || group.claim_ids.length === 0) continue;

    const groupKeys = Object.entries(group.group ?? {});
    const refArea = groupKeys.find(([k]) => k === "ref_area")?.[1] ?? undefined;

    const ids = group.claim_ids;
    const earliestId = ids[0];
    const latestId = ids[ids.length - 1];

    // Register earliest observation
    if (
      earliestId &&
      group.earliest?.value !== null &&
      group.earliest?.value !== undefined
    ) {
      entries.push({
        id: earliestId,
        claim: {
          value: group.earliest.value,
          country: refArea,
          date: group.earliest.year ?? undefined,
        },
      });
    }

    // Register latest observation (only if it's a different ID from earliest)
    if (
      latestId &&
      latestId !== earliestId &&
      group.latest?.value !== null &&
      group.latest?.value !== undefined
    ) {
      entries.push({
        id: latestId,
        claim: {
          value: group.latest.value,
          country: refArea,
          date: group.latest.year ?? undefined,
        },
      });
    }
  }
  return entries;
};

/**
 * Extractor for data360_get_data output.
 * Extracts claim_id from standard data rows.
 */
export const getDataExtractor: ToolResultExtractor = (output) => {
  const data = parseOutput<{ data?: any[] }>(output);
  if (!data?.data || !Array.isArray(data.data)) return [];

  const entries: ClaimEntry[] = [];
  for (const row of data.data) {
    if (
      row.claim_id &&
      row.OBS_VALUE !== undefined &&
      row.OBS_VALUE !== null
    ) {
      entries.push({
        id: row.claim_id,
        claim: {
          value: row.OBS_VALUE,
          country: row.REF_AREA,
          date: row.TIME_PERIOD ? String(row.TIME_PERIOD) : undefined,
        },
      });
    }
  }
  return entries;
};
