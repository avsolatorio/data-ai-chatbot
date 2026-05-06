/**
 * Custom ToolResultExtractor functions for Data360 aggregation tools.
 *
 * These walk the compact to_compact() output shapes and emit ClaimEntry[]
 * so ClaimsManager can resolve claim_ids for ClaimMark rendering.
 *
 * Usage: register via useClaimsManager().registerExtractor() and wrap the
 * tool output in <IngestToolOutput toolName={TOOL_NAME} output={...} />.
 *
 * Note: data360_summarize_data is excluded — its claim_ids are group-level
 * arrays (not per-cell), so there is no single value to bind to each claim.
 */

import type { ClaimEntry, ToolResultExtractor } from "@pcn-js/core";

// ---------------------------------------------------------------------------
// Tool name constants — must match the MCP tool names used in IngestToolOutput
// ---------------------------------------------------------------------------

export const DATA360_RANK_COUNTRIES_TOOL = "data360_rank_countries";
export const DATA360_COMPARE_COUNTRIES_TOOL = "data360_compare_countries";

// ---------------------------------------------------------------------------
// rank_countries extractor
// Compact shape: { rankings: [{ code, value, claim_id, ... }] }
// ---------------------------------------------------------------------------

export const rankCountriesExtractor: ToolResultExtractor = (
  result: unknown,
): ClaimEntry[] => {
  // Handle raw JSON string (non-thinking / non-normalized path)
  let r: Record<string, unknown>;
  if (typeof result === "string") {
    try {
      r = JSON.parse(result);
    } catch {
      return [];
    }
  } else if (typeof result === "object" && result !== null) {
    r = result as Record<string, unknown>;
  } else {
    return [];
  }
  if (!Array.isArray(r.rankings)) return [];

  const entries: ClaimEntry[] = [];
  for (const row of r.rankings) {
    if (typeof row !== "object" || row === null) continue;
    const { claim_id, value, code } = row as Record<string, unknown>;
    if (typeof claim_id !== "string" || claim_id === "") continue;
    entries.push({
      id: claim_id,
      claim: {
        value: typeof value === "number" ? value : undefined,
        country: typeof code === "string" ? code : undefined,
      },
    });
  }
  return entries;
};

// ---------------------------------------------------------------------------
// compare_countries extractor
// Compact shape:
//   snapshot.rankings: [{ code, value, claim_id, ... }]
//   time_series.series: { [country]: [[time_period, obs_value, claim_id], ...] }
// ---------------------------------------------------------------------------

export const compareCountriesExtractor: ToolResultExtractor = (
  result: unknown,
): ClaimEntry[] => {
  // Handle raw JSON string (non-thinking / non-normalized path)
  let r: Record<string, unknown>;
  if (typeof result === "string") {
    try {
      r = JSON.parse(result);
    } catch {
      return [];
    }
  } else if (typeof result === "object" && result !== null) {
    r = result as Record<string, unknown>;
  } else {
    return [];
  }

  const entries: ClaimEntry[] = [];

  // Snapshot rankings
  const snapshot = r.snapshot as Record<string, unknown> | null | undefined;
  if (snapshot && Array.isArray(snapshot.rankings)) {
    for (const row of snapshot.rankings) {
      if (typeof row !== "object" || row === null) continue;
      const { claim_id, value, code } = row as Record<string, unknown>;
      if (typeof claim_id !== "string" || claim_id === "") continue;
      entries.push({
        id: claim_id,
        claim: {
          value: typeof value === "number" ? value : undefined,
          country: typeof code === "string" ? code : undefined,
        },
      });
    }
  }

  // Time-series positional arrays: [time_period, obs_value, claim_id]
  // series_schema guarantees positions: [0]=time_period, [1]=obs_value, [2]=claim_id
  const ts = r.time_series as Record<string, unknown> | null | undefined;
  if (ts && typeof ts.series === "object" && ts.series !== null) {
    for (const [country, points] of Object.entries(
      ts.series as Record<string, unknown>,
    )) {
      if (!Array.isArray(points)) continue;
      for (const pt of points) {
        if (!Array.isArray(pt) || pt.length < 3) continue;
        const [timePeriod, obsValue, claimId] = pt as [
          string,
          number | null,
          string | null,
        ];
        if (typeof claimId !== "string" || claimId === "") continue;
        entries.push({
          id: claimId,
          claim: {
            value: typeof obsValue === "number" ? obsValue : undefined,
            country,
            date: timePeriod,
          },
        });
      }
    }
  }

  return entries;
};
