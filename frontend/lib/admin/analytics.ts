/**
 * Pure helpers and types for the admin analytics page (Phase 1).
 *
 * Kept side-effect free so they can be unit tested without a DOM.
 */

export type DateRangePreset = "7d" | "30d" | "90d";

export interface DateRange {
  from: Date;
  to: Date;
  preset: DateRangePreset;
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = ["7d", "30d", "90d"];

const PRESET_DAYS: Record<DateRangePreset, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/** Build a [from, to] range ending at the end of `now` (default: today). */
export function buildDateRange(preset: DateRangePreset, now: Date = new Date()): DateRange {
  const to = endOfDay(now);
  const from = startOfDay(addDays(now, -PRESET_DAYS[preset]));
  return { from, to, preset };
}

/** ISO date (YYYY-MM-DD) for a Date, in local time. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Build the `?from=...&to=...` query suffix for the admin analytics endpoints. */
export function dateRangeQuery(range: DateRange): string {
  const from = toIsoDate(range.from);
  const to = toIsoDate(range.to);
  return `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

export interface UserAnalytics {
  totalUsers: number;
  registeredUsers: number;
  guestUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  activeUsers7d: number;
  activeUsers30d: number;
  newUsersByDay?: { date: string; count: number }[];
}

export interface ChatAnalytics {
  totalChats: number;
  totalMessages: number;
  chats7d: number;
  chats30d: number;
  avgMessagesPerChat: number;
  topModels: { model: string; count: number }[];
}

export interface FeedbackAnalytics {
  avgRating: number;
  ratingDistribution: Record<string, number>;
  totalFeedback: number;
  feedback7d: number;
  upvoteRatio: number;
  feedbackTrend: { date: string; avgRating: number; count: number }[];
}

export interface TokensAnalytics {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  tokensByModel: Record<string, number>;
  tokensLast7d: number;
  tokensLast30d: number;
  costEstimate7d: number;
  costEstimate30d: number;
  tokensByDay?: { date: string; tokens: number }[];
}

export interface BarDatum {
  name: string;
  value: number;
}

/** Convert a `{model -> tokens}` record into sorted recharts bar data. */
export function tokensByModelToBars(tokensByModel: Record<string, number> | undefined): BarDatum[] {
  if (!tokensByModel || typeof tokensByModel !== "object") return [];
  return Object.entries(tokensByModel)
    .map(([name, value]) => ({ name, value: Number(value) || 0 }))
    .sort((a, b) => b.value - a.value);
}

/** Convert `topModels` to bar data for the chat volume chart. */
export function topModelsToBars(topModels: ChatAnalytics["topModels"]): BarDatum[] {
  if (!Array.isArray(topModels)) return [];
  return topModels.map((m) => ({ name: m.model, value: m.count }));
}

/** Convert `ratingDistribution` (keys "1".."5") to bar data, ordered high->low. */
export function ratingDistributionToBars(
  distribution: FeedbackAnalytics["ratingDistribution"]
): BarDatum[] {
  if (!distribution || typeof distribution !== "object") return [];
  return [5, 4, 3, 2, 1].map((rating) => ({
    name: String(rating),
    value: Number(distribution[String(rating)]) || 0,
  }));
}

/** New users comparison: 7d vs 30d. */
export function newUsersToBars(u: UserAnalytics): BarDatum[] {
  return [
    { name: "Last 7d", value: u.newUsers7d },
    { name: "Last 30d", value: u.newUsers30d },
  ];
}

/** Format a number with thousands separators. */
export function formatInt(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString("en-US");
}

/** Format a USD cost (2 dp). */
export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

// --- internal date helpers (kept local; no date-fns dependency) ----------------

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
