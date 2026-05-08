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
 * Registers claim_ids from each group's claim_ids array. Since summarize_data
 * groups aggregate multiple observations, claim_ids is a flat list — we register
 * each with the group's latest value as context.
 */
export const summarizeDataExtractor: ToolResultExtractor = (output) => {
  const data = parseOutput<CompactSummaryOutput>(output);
  if (!data?.groups) return [];

  const entries: ClaimEntry[] = [];
  for (const group of data.groups) {
    if (!group.claim_ids || group.claim_ids.length === 0) continue;
    // Use the first group key as the geographic context
    const groupKeys = Object.entries(group.group ?? {});
    const refArea = groupKeys.find(([k]) => k === "ref_area")?.[1] ?? undefined;

    for (const claimId of group.claim_ids) {
      entries.push({
        id: claimId,
        claim: {
          value: group.latest?.value ?? undefined,
          country: refArea,
        },
      });
    }
  }
  return entries;
};
