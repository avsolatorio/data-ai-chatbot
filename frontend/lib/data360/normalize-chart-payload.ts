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
  if (typeof obj.$schema === "string" && /\bvega\b/i.test(obj.$schema)) {
    return true;
  }
  if ("mark" in obj) {
    return true;
  }
  if ("encoding" in obj && isRecord(obj.encoding as unknown)) {
    return true;
  }
  // Composite / faceted specs (no top-level mark)
  if ("layer" in obj) {
    return true;
  }
  if ("concat" in obj || "hconcat" in obj || "vconcat" in obj) {
    return true;
  }
  if ("facet" in obj || "repeat" in obj) {
    return true;
  }
  // Note: do not treat bare `{ spec: ... }` as VL — that pattern is also Charts API envelopes.
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

function isLikelyChartsApiEnvelope(data: Record<string, unknown>): boolean {
  return typeof data.id === "string" || typeof data.createdAt === "string";
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

  // Charts API: explicit metadata — unwrap nested `spec` only.
  if (isRecord(nested) && isLikelyChartsApiEnvelope(data)) {
    const title =
      typeof data.title === "string" && data.title.trim()
        ? data.title
        : titleFromSpec(nested);
    return { spec: nested, title };
  }

  // Raw Vega-Lite document at root (MCP static JSON, facet, layer, concat, …).
  if (looksLikeVegaLiteSpec(data)) {
    return { spec: data, title: titleFromSpec(data) };
  }

  // Charts-style `{ title, spec }` without id/createdAt (unwrap nested VL only).
  if (
    isRecord(nested) &&
    typeof data.title === "string" &&
    data.title.trim() &&
    looksLikeVegaLiteSpec(nested)
  ) {
    return { spec: nested, title: data.title.trim() };
  }

  // Nested `spec` that is clearly VL (legacy / loose envelopes).
  if (isRecord(nested) && looksLikeVegaLiteSpec(nested)) {
    const title =
      typeof data.title === "string" && data.title.trim()
        ? data.title.trim()
        : titleFromSpec(nested);
    return { spec: nested, title };
  }

  throw new Error("Chart JSON did not contain a Vega-Lite spec");
}
