import {
  isData360VizToolSuccess,
  parseData360VizToolResult,
} from "@data360/tool-types";

import { chartUrlsReferToSameChart } from "@/lib/chart-url";

const VIZ_TOOL_TYPES = new Set([
  "tool-data360_get_viz_spec",
  "tool-data360_get_multi_indicator_viz_spec",
]);

/**
 * Flatten top-level parts plus one level inside `data-thinking` wrappers so viz
 * tools that ran in the thinking stream are visible for URL matching.
 */
function partsForVizAttributionLookup(
  parts: readonly { type?: string; data?: unknown }[] | undefined,
): Array<{ type: string; output?: unknown; state?: string }> {
  const out: Array<{ type: string; output?: unknown; state?: string }> = [];
  if (!parts) {
    return out;
  }
  for (const p of parts) {
    if (!p || typeof p !== "object" || typeof p.type !== "string") {
      continue;
    }
    if (p.type.startsWith("data-thinking") && p.data && typeof p.data === "object") {
      const inner = p.data as { type?: string; output?: unknown; state?: string };
      if (typeof inner.type === "string") {
        out.push(inner as { type: string; output?: unknown; state?: string });
      }
      continue;
    }
    out.push(p as { type: string; output?: unknown; state?: string });
  }
  return out;
}

/**
 * When the assistant embeds a chart URL in text, find the matching viz tool output
 * on the same message so the inline chart card can show the same source line as the tool panel.
 */
export function findVizOutputMatchingChartUrl(
  parts: readonly { type?: string; data?: unknown }[] | undefined,
  chartUrl: string,
): unknown | null {
  for (const p of partsForVizAttributionLookup(parts)) {
    if (!VIZ_TOOL_TYPES.has(p.type)) {
      continue;
    }
    if (p.state !== "output-available") {
      continue;
    }
    const parsed = parseData360VizToolResult(p.output ?? {});
    if (!parsed.success) {
      continue;
    }
    const data = parsed.data;
    if (!isData360VizToolSuccess(data)) {
      continue;
    }
    if (chartUrlsReferToSameChart(chartUrl, data.url)) {
      return data;
    }
  }
  return null;
}
