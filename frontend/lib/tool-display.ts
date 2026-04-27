import { getData360ToolDefaultOpen } from "@/lib/config";

const DATA360_EXPAND_BY_DEFAULT = new Set([
  "tool-data360_search_indicators",
  // "tool-data360_get_data",
]);

/**
 * When `NEXT_PUBLIC_DATA360_TOOL_DEFAULT_OPEN` is true, all Data360-style tools expand.
 * Otherwise only selected tools (e.g. search indicators) expand; charts and plumbing start collapsed.
 */
export function defaultOpenForData360Tool(toolType: string): boolean {
  if (getData360ToolDefaultOpen()) {
    return true;
  }
  return DATA360_EXPAND_BY_DEFAULT.has(toolType);
}

const TOOL_DISPLAY_LABELS: Record<string, string> = {
  "tool-data360_search_indicators": "Search indicators",
  "tool-data360_get_data": "Get indicator data",
  "tool-data360_get_metadata": "Get metadata",
  "tool-data360_get_viz_spec": "Chart",
  "tool-data360_get_multi_indicator_viz_spec": "Multi-indicator chart",
  "tool-data360_find_codelist_value": "Find codelist value",
  "tool-data360_list_indicators": "List indicators",
  "tool-data360_get_data_api_url": "Data API URL",
  "tool-data360_get_disaggregation": "Get disaggregation",
  "tool-data360_get_supported_chart_types": "Chart types",
  "tool-data360_analyze_development_topic": "Analyze topic",
  "tool-ai4data_ai4data_mcpget_wdi_data": "WDI data",
  "tool-ai4data_ai4data_mcpsearch_relevant_indicators":
    "Search relevant indicators",
};

function titleCaseWords(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Short label for the tool header (replaces raw `tool-data360_*` strings).
 */
export function getToolDisplayName(type: string): string {
  const mapped = TOOL_DISPLAY_LABELS[type];
  if (mapped) {
    return mapped;
  }
  if (type.startsWith("tool-data360_")) {
    const rest = type.slice("tool-data360_".length).replace(/_/g, " ");
    return titleCaseWords(rest);
  }
  if (type.startsWith("tool-ai4data_")) {
    const rest = type.slice("tool-ai4data_".length).replace(/_/g, " ");
    return titleCaseWords(rest);
  }
  if (type.startsWith("tool-")) {
    const rest = type.slice(5).replace(/_/g, " ");
    return titleCaseWords(rest);
  }
  return type;
}
