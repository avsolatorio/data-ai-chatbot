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

export type SearchIndicatorItem = {
  idno: string;
  name: string;
  database_id: string;
  database_name?: string | null;
  truncated_definition: string;
  periodicity: string;
  latest_data: string;
  time_period_range: string;
  /** Per-country boolean map e.g. { KEN: true, GHA: false }. Null when no country was requested. */
  covers_country: Record<string, boolean> | null;
  /** Resolved country code this indicator was evaluated against (set for query_groups per-group country). */
  requested_country: string | null;
  dimensions: string[] | null;
};

/** Per-query result group returned by data360_search_indicators with result_layout="by_query". */
export type QueryGroupResult = {
  query: string;
  country_code?: string | null;
  indicators: SearchIndicatorItem[];
  count: number;
  error?: string | null;
};

/** Tool input for data360_search_indicators (from tool call arguments). */
export type SearchIndicatorsInput = {
  query?: string | null;
  required_country?: string | null;
  limit?: number | null;
  offset?: number | null;
};

export type SearchIndicatorsOutput = {
  count: number;
  total_count: number | null;
  offset: number | null;
  has_more: boolean | null;
  next_offset: number | null;
  indicators: SearchIndicatorItem[];
  required_country: string | null;
  error: string | null;
  /** Query used for single-query path (from tool input). */
  query?: string | null;
  /** Sub-queries used (multi-query paths: queries= or query_groups=). Length > 1 means multi-query was used. */
  queries?: string[] | null;
  /** Layout mode returned by the MCP: 'merged' or 'by_query'. */
  result_layout?: "merged" | "by_query" | null;
  /** Total indicators found before deduplication (multi-query paths only). */
  total_candidates?: number | null;
  /** Number of duplicates removed (multi-query merged layout only). */
  deduplicated_count?: number | null;
  /** Per-query result groups (result_layout="by_query"). Each group has its own indicators list. */
  results?: QueryGroupResult[] | null;
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
