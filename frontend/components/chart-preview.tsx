"use client";

import type { MouseEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { useArtifact } from "@/hooks/use-artifact";
import type { UIArtifact } from "./artifact";
import { FullscreenIcon, LoaderIcon } from "./icons";

type ChartApiResponse = {
  id: string;
  title: string;
  createdAt: string;
  spec: Record<string, unknown>;
};

type ChartPreviewProps = {
  chartUrl: string;
  isReadonly?: boolean;
};

/**
 * Normalize chart URL to same-origin so the request is proxied via Next.js
 * (app/api/[...path]) and avoids CORS / unreachable backend URLs.
 */
function proxyChartUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return trimmed;
    }
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function ChartPreview({ chartUrl, isReadonly }: ChartPreviewProps) {
  const { setArtifact } = useArtifact();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const proxiedUrl = useMemo(() => proxyChartUrl(chartUrl), [chartUrl]);

  const handleClick = useCallback(
    async (event: MouseEvent<HTMLElement>) => {
      if (isReadonly) {
        return;
      }
      const target = event.currentTarget;
      const boundingBox = target.getBoundingClientRect();
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(proxiedUrl);
        if (!res.ok) {
          throw new Error(`Failed to load chart: ${res.status}`);
        }
        const data = (await res.json()) as ChartApiResponse;
        const specJson =
          typeof data.spec === "object"
            ? JSON.stringify(data.spec)
            : String(data.spec ?? "{}");

        setArtifact((artifact: UIArtifact) => ({
          ...artifact,
          kind: "chart",
          documentId: "init",
          title: data.title ?? "Chart",
          content: specJson,
          isVisible: true,
          status: "idle",
          boundingBox: {
            left: boundingBox.x,
            top: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
          },
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chart");
      } finally {
        setIsLoading(false);
      }
    },
    [proxiedUrl, isReadonly, setArtifact]
  );

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:border-red-950/50 dark:bg-red-950/30">
        {error}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isReadonly ?? isLoading}
      className="flex w-full cursor-pointer flex-row items-center justify-between gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <span className="font-medium">View Vega-Lite chart</span>
      {isLoading ? (
        <span className="animate-spin">
          <LoaderIcon />
        </span>
      ) : (
        <FullscreenIcon />
      )}
    </button>
  );
}
