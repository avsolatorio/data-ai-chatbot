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
  truncated_definition: string;
  periodicity: string;
  latest_data: string;
  time_period_range: string;
  covers_country: string | null;
  dimensions: string[] | null;
};

export type SearchIndicatorsOutput = {
  count: number;
  total_count: number;
  offset: number;
  has_more: boolean;
  next_offset: number;
  indicators: SearchIndicatorItem[];
  required_country: string | null;
  error: string | null;
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

export type GetDataOutput = {
  count: number;
  total_count: number | null;
  offset: number;
  has_more: boolean;
  next_offset: number | null;
  data: GetDataDataPoint[];
  error: string | null;
};
