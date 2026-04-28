/**
 * Extracts Data360 source entries from chat message parts for display in the
 * "Sources" block. Supports tool-data360_get_data, tool-data360_get_viz_spec,
 * tool-data360_get_multi_indicator_viz_spec,
 * and tool-ai4data_ai4data_mcpget_wdi_data.
 */

import { appConfig } from "@/lib/config";

export type Data360SourceEntry = {
  title: string;
  href?: string;
};

type PartLike = {
  type?: string;
  output?: unknown;
  data?: unknown;
  input?: unknown;
};

/**
 * MCP `data360_get_data` strips DATABASE_ID / INDICATOR from each row (`_strip_data_row`
 * in data360-mcp) to save tokens. IDs still appear on the tool call input.
 */
function readGetDataToolInputIds(part: PartLike): {
  databaseId: string;
  indicatorId: string;
} {
  const raw = part.input;
  if (raw === null || typeof raw !== "object") {
    return { databaseId: "", indicatorId: "" };
  }
  const inp = raw as Record<string, unknown>;
  const databaseId =
    typeof inp.database_id === "string"
      ? inp.database_id
      : typeof inp.databaseId === "string"
        ? inp.databaseId
        : "";
  const indicatorId =
    typeof inp.indicator_id === "string"
      ? inp.indicator_id
      : typeof inp.indicatorId === "string"
        ? inp.indicatorId
        : "";
  return { databaseId, indicatorId };
}

/** Indicator display name from `get_data` response metadata when rows omit INDICATOR_NAME. */
function readGetDataMetadataName(out: Record<string, unknown>): string {
  const meta = out.metadata;
  if (meta === null || typeof meta !== "object") {
    return "";
  }
  const m = meta as Record<string, unknown>;
  if (typeof m.name === "string") {
    return m.name.trim();
  }
  return "";
}

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
export function getData360SourcesFromParts(
  parts: PartLike[],
): Data360SourceEntry[] {
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
      const { databaseId: inputDb, indicatorId: inputInd } =
        readGetDataToolInputIds(part);
      const metaName = readGetDataMetadataName(out);
      const data = Array.isArray(out.data) ? out.data : [];

      const pushSource = (
        databaseId: string,
        indicator: string,
        indicatorName: string,
      ) => {
        const title =
          indicatorName.trim() ||
          indicator ||
          databaseId ||
          "Data360 data";
        const key = `${databaseId}:${indicator}`;
        if (!databaseId && !indicator) {
          return;
        }
        if (seen.has(key)) {
          return;
        }
        seen.add(key);
        const base = appConfig.data360IndicatorBaseUrl.replace(/\/+$/, "");
        const href = indicator ? `${base}/${indicator}` : undefined;
        entries.push({ title, href });
      };

      for (const row of data) {
        const r = row as Record<string, unknown>;
        const databaseId =
          typeof r.DATABASE_ID === "string" ? r.DATABASE_ID : inputDb;
        const indicator =
          typeof r.INDICATOR === "string" ? r.INDICATOR : inputInd;
        const indicatorName =
          typeof r.INDICATOR_NAME === "string" ? r.INDICATOR_NAME : metaName;
        pushSource(databaseId, indicator, indicatorName);
      }

      if (data.length === 0 && (out.error == null || out.error === null)) {
        const key = `empty:${inputDb}:${inputInd}`;
        if (!seen.has(key) && (inputDb || inputInd)) {
          seen.add(key);
          const title =
            metaName ||
            inputInd ||
            inputDb ||
            "Data360 (no data returned)";
          const base = appConfig.data360IndicatorBaseUrl.replace(/\/+$/, "");
          const href = inputInd ? `${base}/${inputInd}` : undefined;
          entries.push({ title, href });
        } else if (!seen.has("data360_get_data:empty_fallback")) {
          seen.add("data360_get_data:empty_fallback");
          entries.push({ title: "Data360 (no data returned)" });
        }
      }
    }

    if (
      type === "tool-data360_get_viz_spec" ||
      type === "tool-data360_get_multi_indicator_viz_spec"
    ) {
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
