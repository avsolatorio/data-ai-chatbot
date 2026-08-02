"use client";

import { useEffect, useState, useCallback } from "react";

interface HealthData {
  status: string;
  db: string;
  mcp: string;
  uptimeSeconds: number;
}

interface MetricsData {
  errorRate24h: number;
  avgResponseTimeMs: number;
  rateLimitHits24h: number;
  activeSessions: number;
  dbPoolSize: { size: number; checkedOut: number };
  totalTokens24h?: number;
  tokenRate24h?: number;
  costEstimate24h?: number;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "connected" || status === "ok"
      ? "bg-green-500"
      : status === "degraded" || status === "not_configured"
        ? "bg-yellow-500"
        : "bg-red-500";
  return <div className={`w-3 h-3 rounded-full ${color} shrink-0`} />;
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [healthRes, metricsRes] = await Promise.all([
        fetch("/api/admin/health"),
        fetch("/api/admin/health/metrics"),
      ]);
      if (!healthRes.ok) throw new Error("Failed to fetch health");
      const healthJson = await healthRes.json();
      setHealth(healthJson);
      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }
      setError(null);
      setLastUpdated(new Date());
      setSecondsSinceUpdate(0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load health data",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    const ticker = setInterval(
      () => setSecondsSinceUpdate((s) => s + 1),
      1000,
    );
    return () => {
      clearInterval(interval);
      clearInterval(ticker);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-zinc-800 rounded" />
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 h-24" />
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 h-24" />
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 h-24" />
        </div>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-400 mb-3">{error || "No data"}</p>
        <button
          type="button"
          onClick={fetchData}
          className="px-4 py-2 bg-red-800 text-red-100 rounded-md hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const overallOk = health.status === "ok";
  const dbOk = health.db === "connected";
  const mcpOk = health.mcp === "connected";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            Auto-refreshes every 30s | Last updated: {secondsSinceUpdate}s ago
          </span>
          <button
            type="button"
            onClick={fetchData}
            disabled={refreshing}
            className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-200 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`bg-zinc-900 border rounded-lg p-5 ${overallOk ? "border-l-green-500" : "border-l-yellow-500"} border-l-4 border-r-zinc-800 border-t-zinc-800 border-b-zinc-800`}
        >
          <div className="flex items-center gap-2 mb-2">
            <StatusDot status={health.status} />
            <span className="text-sm font-medium text-zinc-300">
              API Status
            </span>
          </div>
          <div
            className={`text-lg font-bold ${overallOk ? "text-green-400" : "text-yellow-400"}`}
          >
            {overallOk ? "Healthy" : "Degraded"}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Uptime: {formatUptime(health.uptimeSeconds)}
          </div>
        </div>

        <div
          className={`bg-zinc-900 border rounded-lg p-5 ${dbOk ? "border-l-green-500" : "border-l-red-500"} border-l-4 border-r-zinc-800 border-t-zinc-800 border-b-zinc-800`}
        >
          <div className="flex items-center gap-2 mb-2">
            <StatusDot status={health.db} />
            <span className="text-sm font-medium text-zinc-300">
              Database
            </span>
          </div>
          <div
            className={`text-lg font-bold ${dbOk ? "text-green-400" : "text-red-400"}`}
          >
            {dbOk ? "Connected" : "Error"}
          </div>
        </div>

        <div
          className={`bg-zinc-900 border rounded-lg p-5 ${mcpOk ? "border-l-green-500" : health.mcp === "not_configured" ? "border-l-yellow-500" : "border-l-red-500"} border-l-4 border-r-zinc-800 border-t-zinc-800 border-b-zinc-800`}
        >
          <div className="flex items-center gap-2 mb-2">
            <StatusDot status={health.mcp} />
            <span className="text-sm font-medium text-zinc-300">
              MCP Server
            </span>
          </div>
          <div
            className={`text-lg font-bold ${mcpOk ? "text-green-400" : health.mcp === "not_configured" ? "text-yellow-400" : "text-red-400"}`}
          >
            {health.mcp === "connected"
              ? "Connected"
              : health.mcp === "not_configured"
                ? "Not Configured"
                : "Error"}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-200 mb-3">
            Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Error Rate (24h)"
              value={`${((metrics.errorRate24h ?? 0) * 100).toFixed(1)}%`}
            />
            <MetricCard
              label="Avg Response Time"
              value={`${metrics.avgResponseTimeMs ?? 0}ms`}
            />
            <MetricCard
              label="Rate Limit Hits (24h)"
              value={String(metrics.rateLimitHits24h ?? 0)}
            />
            <MetricCard
              label="Active Sessions"
              value={String(metrics.activeSessions ?? 0)}
            />
            <MetricCard
              label="DB Pool Size"
              value={`${metrics.dbPoolSize.size} / ${metrics.dbPoolSize.checkedOut}`}
            />
            <MetricCard
              label="Total Tokens (24h)"
              value={formatNumber(metrics.totalTokens24h ?? 0)}
            />
            <MetricCard
              label="Token Rate (24h)"
              value={`${formatNumber(metrics.tokenRate24h ?? 0)}/min`}
            />
            <MetricCard
              label="Cost Estimate (24h)"
              value={`$${(metrics.costEstimate24h ?? 0).toFixed(2)}`}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
