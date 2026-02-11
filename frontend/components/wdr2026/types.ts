/** Types for WDR2026 MCP tool outputs (aligned with backend Wdr2026SearchSegment). */

export type Wdr2026SegmentType = "text" | "figure";

export type Wdr2026SearchSegment = {
  segment_type: Wdr2026SegmentType;
  path: string[];
  segment_index: number;
  text: string;
  token_count: number;
  page_start: number;
  page_end: number;
  page: number;
  figure_image_path: string | null;
};

export type Wdr2026SearchResponse = {
  result: Wdr2026SearchSegment[];
};

/** Table of contents: recursive sections (from wdr2026_get_toc). */
export type Wdr2026TocSection = {
  title: string;
  page: number;
  number?: string;
  subsections?: Wdr2026TocSection[];
};

export type Wdr2026TocOutput = {
  document_title: string;
  sections: Wdr2026TocSection[];
};
