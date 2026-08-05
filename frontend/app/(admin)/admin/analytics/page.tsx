"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  DATE_RANGE_PRESETS,
  buildDateRange,
  dateRangeQuery,
  formatInt,
  formatUsd,
  newUsersToBars,
  ratingDistributionToBars,
  tokensByModelToBars,
  topModelsToBars,
  type ChatAnalytics,
  type DateRangePreset,
  type FeedbackAnalytics,
  type TokensAnalytics,
  type UserAnalytics,
} from "@/lib/admin/analytics";

const CHART_PALETTE = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 67%, 50%)",
  "hsl(199, 89%, 48%)",
  "hsl(0, 84%, 60%)",
  "hsl(330, 81%, 60%)",
  "hsl(160, 60%, 45%)",
];

const AXIS_STYLE = {
  fontSize: 10,
  fill: "hsl(var(--muted-foreground))",
} as const;

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
  fontSize: "11px",
} as const;

export default function AdminAnalyticsPage() {
  const [preset, setPreset] = useState<DateRangePreset>("30d");
  const range = useMemo(() => buildDateRange(preset), [preset]);

  const [userData, setUserData] = useState<UserAnalytics | null>(null);
  const [chatData, setChatData] = useState<ChatAnalytics | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackAnalytics | null>(
    null,
  );
  const [tokensData, setTokensData] = useState<TokensAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      const qs = dateRangeQuery(range);
      try {
        const [users, chats, feedback, tokens] = await Promise.all([
          fetchJson<UserAnalytics>(`/api/admin/analytics/users${qs}`),
          fetchJson<ChatAnalytics>(`/api/admin/analytics/chats${qs}`),
          fetchJson<FeedbackAnalytics>(`/api/admin/analytics/feedback${qs}`),
          fetchJson<TokensAnalytics>(`/api/admin/analytics/tokens${qs}`),
        ]);
        if (cancelled) return;
        setUserData(users);
        setChatData(chats);
        setFeedbackData(feedback);
        setTokensData(tokens);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [range]);

  if (loading && !userData && !chatData && !feedbackData && !tokensData) {
    return <LoadingSkeleton />;
  }

  if (error && !userData && !chatData && !feedbackData && !tokensData) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => setPreset((p) => p)} // forces refetch via no-op
      />
    );
  }

  const newUsersBars = userData ? newUsersToBars(userData) : [];
  const ratingBars = feedbackData
    ? ratingDistributionToBars(feedbackData.ratingDistribution)
    : [];
  const topModelsBars = chatData ? topModelsToBars(chatData.topModels) : [];
  const tokensByModelBars = tokensData
    ? tokensByModelToBars(tokensData.tokensByModel)
    : [];
  const tokensByDay = tokensData?.tokensByDay ?? [];
  const feedbackTrend = feedbackData?.feedbackTrend ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <DateRangeFilter value={preset} onChange={setPreset} />
      </div>

      {/* Top-line stat cards */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-200 mb-3">Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={userData ? formatInt(userData.totalUsers) : "0"}
            sub={
              userData
                ? `${formatInt(userData.registeredUsers)} registered, ${formatInt(userData.guestUsers)} guests`
                : "—"
            }
          />
          <StatCard
            label="Total Chats"
            value={chatData ? formatInt(chatData.totalChats) : "0"}
            sub={
              chatData
                ? `${formatInt(chatData.totalMessages)} messages`
                : "—"
            }
          />
          <StatCard
            label="Total Tokens"
            value={tokensData ? formatInt(tokensData.totalTokens) : "0"}
            sub={
              tokensData
                ? `${formatInt(tokensData.tokensLast30d)} last 30d`
                : "—"
            }
          />
          <StatCard
            label="Cost (30d)"
            value={tokensData ? formatUsd(tokensData.costEstimate30d) : "$0.00"}
            sub={tokensData ? `7d: ${formatUsd(tokensData.costEstimate7d)}` : "—"}
          />
        </div>
      </section>

      {/* User Stats */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-200 mb-3">Users</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Users"
            value={userData ? formatInt(userData.totalUsers) : "0"}
            sub={
              userData
                ? `${formatInt(userData.registeredUsers)} registered, ${formatInt(userData.guestUsers)} guests`
                : "—"
            }
          />
          <StatCard
            label="New (7d)"
            value={userData ? formatInt(userData.newUsers7d) : "0"}
          />
          <StatCard
            label="New (30d)"
            value={userData ? formatInt(userData.newUsers30d) : "0"}
          />
          <StatCard
            label="Active (7d)"
            value={userData ? formatInt(userData.activeUsers7d) : "0"}
          />
          <StatCard
            label="Active (30d)"
            value={userData ? formatInt(userData.activeUsers30d) : "0"}
          />
        </div>
        <ChartCard title="User Growth" subtitle="New users in window">
          {newUsersBars.every((b) => b.value === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={newUsersBars}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  opacity={0.3}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                />
                <XAxis dataKey="name" tick={AXIS_STYLE} />
                <YAxis
                  tick={AXIS_STYLE}
                  width={40}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {newUsersBars.map((bar, i) => (
                    <Cell key={bar.name} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* Chat Stats */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-200 mb-3">Chats</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Chats"
            value={chatData ? formatInt(chatData.totalChats) : "0"}
          />
          <StatCard
            label="Total Messages"
            value={chatData ? formatInt(chatData.totalMessages) : "0"}
          />
          <StatCard
            label="New Chats (7d)"
            value={chatData ? formatInt(chatData.chats7d) : "0"}
          />
          <StatCard
            label="New Chats (30d)"
            value={chatData ? formatInt(chatData.chats30d) : "0"}
          />
          <StatCard
            label="Avg Msg / Chat"
            value={
              chatData && typeof chatData.avgMessagesPerChat === "number"
                ? chatData.avgMessagesPerChat.toFixed(1)
                : "0.0"
            }
          />
        </div>
        <ChartCard
          title="Chat Volume by Model"
          subtitle="Chats per model in window"
        >
          {topModelsBars.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, topModelsBars.length * 36)}>
              <BarChart
                data={topModelsBars}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  opacity={0.3}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                />
                <XAxis type="number" tick={AXIS_STYLE} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={AXIS_STYLE}
                  width={140}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Bar dataKey="value" fill={CHART_PALETTE[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* Feedback Stats */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-200 mb-3">Feedback</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Avg Rating"
            value={
              feedbackData && feedbackData.totalFeedback > 0
                ? feedbackData.avgRating.toFixed(1)
                : "—"
            }
          />
          <StatCard
            label="Total Feedback"
            value={feedbackData ? formatInt(feedbackData.totalFeedback) : "0"}
          />
          <StatCard
            label="Feedback (7d)"
            value={feedbackData ? formatInt(feedbackData.feedback7d) : "0"}
          />
          <StatCard
            label="Upvote Ratio"
            value={
              feedbackData && typeof feedbackData.upvoteRatio === "number"
                ? `${Math.round(feedbackData.upvoteRatio * 100)}%`
                : "—"
            }
          />
        </div>
        <ChartCard title="Rating Distribution" subtitle="Count per star rating">
          {ratingBars.every((b) => b.value === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={ratingBars}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  opacity={0.3}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                />
                <XAxis dataKey="name" tick={AXIS_STYLE} />
                <YAxis tick={AXIS_STYLE} width={40} allowDecimals={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Bar dataKey="value" fill={CHART_PALETTE[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard
          title="Feedback Trend"
          subtitle="Avg rating per day (window)"
        >
          {feedbackTrend.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={feedbackTrend}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  opacity={0.3}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                />
                <XAxis dataKey="date" tick={AXIS_STYLE} />
                <YAxis
                  domain={[0, 5]}
                  tick={AXIS_STYLE}
                  width={40}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="avgRating"
                  stroke={CHART_PALETTE[2]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* Token Usage */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-200 mb-3">Token Usage</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Tokens"
            value={tokensData ? formatInt(tokensData.totalTokens) : "0"}
          />
          <StatCard
            label="Prompt Tokens"
            value={tokensData ? formatInt(tokensData.promptTokens) : "0"}
          />
          <StatCard
            label="Completion Tokens"
            value={tokensData ? formatInt(tokensData.completionTokens) : "0"}
          />
          <StatCard
            label="Tokens (7d)"
            value={tokensData ? formatInt(tokensData.tokensLast7d) : "0"}
          />
          <StatCard
            label="Tokens (30d)"
            value={tokensData ? formatInt(tokensData.tokensLast30d) : "0"}
          />
          <StatCard
            label="Cost (7d)"
            value={tokensData ? formatUsd(tokensData.costEstimate7d) : "$0.00"}
          />
          <StatCard
            label="Cost (30d)"
            value={tokensData ? formatUsd(tokensData.costEstimate30d) : "$0.00"}
          />
        </div>
        <ChartCard
          title="Tokens by Model"
          subtitle="Total tokens per model"
        >
          {tokensByModelBars.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, tokensByModelBars.length * 36)}>
              <BarChart
                data={tokensByModelBars}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  opacity={0.3}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                />
                <XAxis type="number" tick={AXIS_STYLE} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={AXIS_STYLE}
                  width={140}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  formatter={(v: number) => formatInt(v)}
                />
                <Bar dataKey="value" fill={CHART_PALETTE[3]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Tokens / Day" subtitle="Daily token volume (window)">
          {tokensByDay.length === 0 ? (
            <EmptyChart message="No daily token data in window" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={tokensByDay}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  opacity={0.3}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                />
                <XAxis dataKey="date" tick={AXIS_STYLE} />
                <YAxis tick={AXIS_STYLE} width={50} allowDecimals={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number) => formatInt(v)}
                />
                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke={CHART_PALETTE[4]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>
    </div>
  );
}

// --- subcomponents ------------------------------------------------------------

function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRangePreset;
  onChange: (next: DateRangePreset) => void;
}) {
  return (
    <fieldset
      aria-label="Date range"
      className="inline-flex rounded-md border border-zinc-800 bg-zinc-900 p-0.5"
    >
      {DATE_RANGE_PRESETS.map((p) => {
        const active = p === value;
        return (
          <button
            key={p}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(p)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              active
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {p === "7d" ? "Last 7d" : p === "30d" ? "Last 30d" : "Last 90d"}
          </button>
        );
      })}
    </fieldset>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="text-3xl font-bold text-white mt-1">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ message = "No data in window" }: { message?: string }) {
  return (
    <div className="flex h-32 items-center justify-center text-xs text-zinc-500">
      {message}
    </div>
  );
}

function SkeletonCard({ uniqueKey }: { uniqueKey: string }) {
  return (
    <div
      key={uniqueKey}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
    >
      <div className="h-4 w-20 bg-zinc-800 rounded mb-2" />
      <div className="h-8 w-16 bg-zinc-800 rounded" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-40 bg-zinc-800 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard uniqueKey="ovw-0" />
        <SkeletonCard uniqueKey="ovw-1" />
        <SkeletonCard uniqueKey="ovw-2" />
        <SkeletonCard uniqueKey="ovw-3" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SkeletonCard uniqueKey="usr-0" />
        <SkeletonCard uniqueKey="usr-1" />
        <SkeletonCard uniqueKey="usr-2" />
        <SkeletonCard uniqueKey="usr-3" />
        <SkeletonCard uniqueKey="usr-4" />
      </div>
    </div>
  );
}

function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
      <p className="text-red-400 mb-3">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 bg-red-800 text-red-100 rounded-md hover:bg-red-700 text-sm"
      >
        Retry
      </button>
    </div>
  );
}

// --- helpers ------------------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}
