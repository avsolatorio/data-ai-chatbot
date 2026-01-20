// Shared types for Data360 widgets

export type IndicatorDataPoint = {
  country: string;
  date: string;
  value: number | null;
  claim_id: string;
};

export type Indicator = {
  indicator_id: string;
  indicator_name: string;
  data: IndicatorDataPoint[];
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
  definition_long: string;
};

export type SearchIndicatorsOutput = {
  count: number;
  total_count: number;
  offset: number;
  has_more: boolean;
  next_offset: number;
  items: SearchIndicatorItem[];
  error: string | null;
};
