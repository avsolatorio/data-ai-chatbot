import type { LanguageModelUsage } from "ai";
import type { UsageData } from "tokenlens/helpers";

// Server-merged usage: base usage + TokenLens summary + optional modelId
export type AppUsage = LanguageModelUsage & UsageData & { modelId?: string };

/** Chat lastContext: legacy (plain usage) or per-message shape from backend */
export type LastContext =
  | AppUsage
  | { latest?: AppUsage; byMessageId?: Record<string, AppUsage> };

/** Get the single "latest" usage from lastContext (for initial state / backward compat). */
export function getLatestUsage(
  lastContext: LastContext | null | undefined,
): AppUsage | undefined {
  if (lastContext == null) return undefined;
  if (
    typeof lastContext === "object" &&
    "latest" in lastContext &&
    lastContext.latest != null
  )
    return lastContext.latest as AppUsage;
  if (typeof lastContext === "object" && "totalTokens" in lastContext)
    return lastContext as AppUsage;
  return undefined;
}

/** Get per-message usage map from lastContext. */
export function getUsageByMessageId(
  lastContext: LastContext | null | undefined,
): Record<string, AppUsage> | undefined {
  if (lastContext == null || typeof lastContext !== "object") return undefined;
  if ("byMessageId" in lastContext && lastContext.byMessageId != null)
    return lastContext.byMessageId as Record<string, AppUsage>;
  return undefined;
}

const NUMERIC_USAGE_KEYS = [
  "prompt_tokens",
  "completion_tokens",
  "totalTokens",
  "inputTokens",
  "outputTokens",
  "cachedInputTokens",
  "reasoningTokens",
] as const;

/** Canonical cost keys used by the UI. Map aliases into these when aggregating. */
const COST_CANONICAL: Record<string, keyof typeof COST_KEYS> = {
  inputUSD: "inputUSD",
  inputTokenUSD: "inputUSD",
  input_token_usd: "inputUSD",
  outputUSD: "outputUSD",
  outputTokenUSD: "outputUSD",
  output_token_usd: "outputUSD",
  cacheReadUSD: "cacheReadUSD",
  cacheReadsUSD: "cacheReadUSD",
  cache_read_usd: "cacheReadUSD",
  reasoningUSD: "reasoningUSD",
  reasoning_usd: "reasoningUSD",
  totalUSD: "totalUSD",
  total_usd: "totalUSD",
};

const COST_KEYS = {
  inputUSD: true,
  outputUSD: true,
  cacheReadUSD: true,
  reasoningUSD: true,
  totalUSD: true,
} as const;

function addCostInto(
  acc: Record<string, number>,
  cost: Record<string, unknown>,
): void {
  for (const [k, v] of Object.entries(cost)) {
    if (typeof v !== "number") continue;
    const canonical =
      COST_CANONICAL[k] ??
      (k in COST_KEYS ? (k as keyof typeof COST_KEYS) : null);
    if (canonical) acc[canonical] = (acc[canonical] ?? 0) + v;
  }
}

/** Sum numeric usage fields across multiple AppUsage objects (for full-chat total). */
export function aggregateUsage(usages: AppUsage[]): AppUsage {
  const result: Record<string, unknown> = {};
  const costAcc: Record<string, number> = {};
  let contextPreserved: Record<string, unknown> | undefined;
  for (const u of usages) {
    for (const key of NUMERIC_USAGE_KEYS) {
      const v = (u as Record<string, unknown>)[key];
      if (typeof v === "number") {
        result[key] = ((result[key] as number | undefined) ?? 0) + v;
      }
    }
    const cost = (u as Record<string, unknown>).costUSD;
    if (cost && typeof cost === "object" && !Array.isArray(cost)) {
      addCostInto(costAcc, cost as Record<string, unknown>);
    }
    if (!contextPreserved) {
      const ctx = (u as Record<string, unknown>).context;
      if (ctx && typeof ctx === "object" && !Array.isArray(ctx))
        contextPreserved = ctx as Record<string, unknown>;
    }
  }
  if (Object.keys(costAcc).length > 0) result.costUSD = costAcc;
  if (contextPreserved) result.context = contextPreserved;
  return result as AppUsage;
}
