/**
 * Chart URLs may return either a Charts API envelope `{ spec, title, ... }`
 * or a raw Vega-Lite spec object (e.g. Data360 MCP static JSON).
 */

export type NormalizedChartPayload = {
  spec: Record<string, unknown>;
  title: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function looksLikeVegaLiteSpec(obj: Record<string, unknown>): boolean {
  if (typeof obj.$schema === "string" && obj.$schema.includes("vega")) {
    return true;
  }
  if ("mark" in obj) {
    return true;
  }
  if ("encoding" in obj && isRecord(obj.encoding as unknown)) {
    return true;
  }
  return false;
}

function titleFromSpec(spec: Record<string, unknown>): string {
  const raw = spec.title;
  if (typeof raw === "string") {
    return raw;
  }
  if (isRecord(raw) && typeof raw.text === "string") {
    return raw.text;
  }
  return "Chart";
}

/**
 * @throws Error if the JSON is not a supported chart payload
 */
export function normalizeChartPayloadFromJson(
  data: unknown,
): NormalizedChartPayload {
  if (!isRecord(data)) {
    throw new Error("Chart JSON must be an object");
  }

  const nested = data.spec;
  if (isRecord(nested) && looksLikeVegaLiteSpec(nested)) {
    const title =
      typeof data.title === "string" && data.title.trim()
        ? data.title
        : titleFromSpec(nested);
    return { spec: nested, title };
  }

  if (looksLikeVegaLiteSpec(data)) {
    return { spec: data, title: titleFromSpec(data) };
  }

  throw new Error("Chart JSON did not contain a Vega-Lite spec");
}
