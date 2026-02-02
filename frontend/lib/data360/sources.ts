/**
 * Extracts Data360 source entries from chat message parts for display in the
 * "Sources" block. Supports tool-data360_get_data, tool-data360_get_viz_spec,
 * and tool-ai4data_ai4data_mcpget_wdi_data.
 */

/** Base URL for Data360 indicator pages (opens in new tab). */
const DATA360_INDICATOR_BASE_URL =
  "https://data360.worldbank.org/en/int/indicator";

export type Data360SourceEntry = {
  title: string;
  href?: string;
};

type PartLike = {
  type?: string;
  output?: unknown;
  data?: unknown;
};

/**
 * Flattens message parts so that both top-level parts and parts nested inside
 * data-thinking wrappers are included.
 */
function flattenParts(parts: PartLike[]): PartLike[] {
  return parts.flatMap((p) => {
    const type = typeof p.type === "string" ? p.type : "";
    if (type.startsWith("data-thinking") && p.data != null) {
      const inner = p.data as PartLike;
      return inner && typeof inner === "object" ? [inner] : [];
    }
    return [p];
  });
}

function isToolPartWithOutput(
  p: PartLike,
): p is PartLike & { type: string; output: unknown } {
  return (
    typeof p === "object" &&
    p !== null &&
    typeof (p as PartLike).type === "string" &&
    (p as PartLike).output !== undefined
  );
}

/**
 * Collects unique Data360 source entries from tool outputs.
 * Deduplicates by title (and href when present).
 */
export function getData360SourcesFromParts(parts: PartLike[]): Data360SourceEntry[] {
  const seen = new Set<string>();
  const entries: Data360SourceEntry[] = [];

  for (const part of flattenParts(parts)) {
    if (!isToolPartWithOutput(part)) {
      continue;
    }

    const { type, output } = part;
    if (typeof output !== "object" || output === null) {
      continue;
    }

    const out = output as Record<string, unknown>;

    if (type === "tool-data360_get_data") {
      const data = Array.isArray(out.data) ? out.data : [];
      for (const row of data) {
        const r = row as Record<string, unknown>;
        const databaseId = typeof r.DATABASE_ID === "string" ? r.DATABASE_ID : "";
        const indicator = typeof r.INDICATOR === "string" ? r.INDICATOR : "";
        const indicatorName =
          typeof r.INDICATOR_NAME === "string" ? r.INDICATOR_NAME : "";
        const title = indicatorName.trim() || indicator || databaseId || "Data360 data";
        const key = `${databaseId}:${indicator}`;
        if (key && !seen.has(key)) {
          seen.add(key);
          const indicatorSlug = [databaseId, indicator].filter(Boolean).join("_");
          const href = indicatorSlug
            ? `${DATA360_INDICATOR_BASE_URL}/${indicatorSlug}`
            : undefined;
          entries.push({ title, href });
        }
      }
      if (data.length === 0 && (out.error == null || out.error === null)) {
        const key = "data360_get_data:empty";
        if (!seen.has(key)) {
          seen.add(key);
          entries.push({ title: "Data360 (no data returned)" });
        }
      }
    }

    if (type === "tool-data360_get_viz_spec") {
      const url = typeof out.url === "string" && out.url ? out.url : null;
      if (url) {
        const key = `viz:${url}`;
        if (!seen.has(key)) {
          seen.add(key);
          entries.push({ title: "Chart / visualization", href: url });
        }
      }
    }

    if (type === "tool-ai4data_ai4data_mcpget_wdi_data") {
      const data = Array.isArray(out.data) ? out.data : [];
      for (const item of data) {
        const d = item as Record<string, unknown>;
        const indicatorName =
          typeof d.indicator_name === "string" ? d.indicator_name : "";
        const indicatorId =
          typeof d.indicator_id === "string" ? d.indicator_id : "";
        const title = indicatorName.trim() || indicatorId || "WDI indicator";
        const key = `wdi:${indicatorId}`;
        if (key && !seen.has(key)) {
          seen.add(key);
          entries.push({ title });
        }
      }
    }
  }

  return entries;
}
