// Shared types for Data360 widgets

export type WdiIndicatorDataPoint = {
  country: string;
  date: string;
  value: number | null;
  claim_id: string;
};

export type Indicator = {
  indicator_id: string;
  indicator_name: string;
  data: WdiIndicatorDataPoint[];
};

export type Data360Output = {
  data: Indicator[];
  note?: Record<string, string>;
};

export type SearchIndicator = {
  idno: string;
  name: string;
};

export type SearchRelevantIndicatorsOutput = {
  indicators: SearchIndicator[];
  note?: string;
};



export type GetDataDataPoint = {
  OBS_VALUE: string;
  TIME_FORMAT: string;
  UNIT_MULT: number;
  COMMENT_OBS: string | null;
  OBS_STATUS: string;
  OBS_CONF: string;
  AGG_METHOD: string;
  DECIMALS: number | null;
  COMMENT_TS: string | null;
  DATA_SOURCE: string | null;
  LATEST_DATA: boolean;
  DATABASE_ID: string;
  INDICATOR: string;
  INDICATOR_NAME?: string;
  REF_AREA: string;
  SEX: string;
  AGE: string;
  URBANISATION: string;
  COMP_BREAKDOWN_1: string;
  COMP_BREAKDOWN_2: string;
  COMP_BREAKDOWN_3: string;
  TIME_PERIOD: string;
  FREQ: string;
  UNIT_MEASURE: string;
  UNIT_TYPE: string | null;
  claim_id: string;
};

/** Tool input for data360_get_data (from tool call arguments). */
export type GetDataInput = {
  database_id?: string;
  indicator_id?: string;
  disaggregation_filters?: Record<string, string | null>;
  start_year?: number | null;
  end_year?: number | null;
  limit?: number | null;
  offset?: number | null;
};

export type GetDataOutput = {
  count: number;
  total_count: number | null;
  offset: number;
  has_more: boolean;
  next_offset: number | null;
  data: GetDataDataPoint[];
  error: string | null;
};

// ---------------------------------------------------------------------------
// Compact aggregation output types (data360-mcp compact serializer, PR #78)
// These mirror the to_compact() output shapes on the server side.
// ---------------------------------------------------------------------------

/** A single ranked country entry from rank_countries compact output. */
export type CompactRankedCountry = {
  rank: number;
  code: string;
  country: string;
  value: number;
  claim_id: string | null;
};

/** Top-level compact output for data360_rank_countries. */
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

/** Stats block inside a compact group summary. */
export type CompactGroupStats = {
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
};

/** A single group entry from summarize_data compact output. */
export type CompactGroupSummary = {
  /** Dimension key, e.g. {ref_area: "KEN"} or {ref_area: "KEN", sex: "F"}. */
  group: Record<string, string>;
  n: number;
  latest: { value: number | null; year: string | null };
  earliest: { value: number | null; year: string | null };
  /** Time range string, e.g. "2004-2023" */
  range: string | null;
  stats: CompactGroupStats;
  change: { abs: number | null; pct: number | null };
  trend: string | null;
  claim_ids: string[];
};

/** Top-level compact output for data360_summarize_data. */
export type CompactSummarizeOutput = {
  indicator: string | null;
  unit: string | null;
  ambiguous_dimensions: string[] | null;
  groups: CompactGroupSummary[];
  error: string | null;
};

/** A snapshot (single-year) ranked entry inside compare_countries output. */
export type CompactSnapshotEntry = {
  rank: number;
  code: string;
  country: string;
  value: number;
  claim_id: string | null;
};

/** Compact snapshot block inside compare_countries output. */
export type CompactSnapshot = {
  year: string | null;
  rankings: CompactSnapshotEntry[];
  spread: Record<string, unknown> | null;
};

/**
 * Compact time-series block inside compare_countries output.
 * series values are positional arrays: [time_period, obs_value, claim_id].
 */
export type CompactTimeSeries = {
  year_range: string | null;
  n_aligned_years: number;
  convergence: string | null;
  series_schema: ["time_period", "obs_value", "claim_id"];
  series: Record<string, [string, number | null, string | null][]>;
  cagr: Record<string, number | null>;
};

/** Top-level compact output for data360_compare_countries. */
export type CompactCompareOutput = {
  indicator: string | null;
  unit: string | null;
  snapshot: CompactSnapshot | null;
  time_series: CompactTimeSeries | null;
  error: string | null;
};
