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
  REF_AREA_NAME?: string;
  SEX: string;
  AGE: string;
  URBANISATION: string;
  COMP_BREAKDOWN_1: string;
  COMP_BREAKDOWN_2: string;
  COMP_BREAKDOWN_3: string;
  TIME_PERIOD: string;
  FREQ: string;
  UNIT_MEASURE: string;
  UNIT_MEASURE_NAME?: string;
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
