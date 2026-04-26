/** Default chart footer when MCP does not return attribution fields. */
export const DATA360_CHART_SOURCE_FALLBACK = "World Bank — Data360";

function readOptionalString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v !== "string") {
    return "";
  }
  return v.trim();
}

/**
 * One-line attribution for Data360 viz tool results (Vega chart card "Source").
 * Accepts unknown so it stays compatible with `parseData360VizToolResult` output
 * before optional attribution fields exist on the published `@data360/tool-types`.
 */
export function formatData360VizChartSource(result: unknown): string {
  if (!result || typeof result !== "object") {
    return DATA360_CHART_SOURCE_FALLBACK;
  }
  const r = result as Record<string, unknown>;
  const db =
    readOptionalString(r, "database_name") ||
    readOptionalString(r, "database_id");
  const ind =
    readOptionalString(r, "indicator_name") ||
    readOptionalString(r, "indicator_id");
  if (db && ind) {
    return `World Bank — ${db} — ${ind}`;
  }
  if (ind) {
    return `World Bank — ${ind}`;
  }
  if (db) {
    return `World Bank — ${db}`;
  }
  return DATA360_CHART_SOURCE_FALLBACK;
}
