"use client";

import type { VLSpec } from "@data360/mcp-ui/viz-card";
import { VegaChartCard } from "@data360/mcp-ui/viz-card";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useArtifact } from "@/hooks/use-artifact";
import { proxyChartUrlForFetch } from "@/lib/chart-url";
import { getBasePath } from "@/lib/config";
import { normalizeChartPayloadFromJson } from "@/lib/data360/normalize-chart-payload";
import type { UIArtifact } from "../artifact";
import { FullscreenIcon, LoaderIcon } from "../icons";

export type ChartPreviewProps = {
  chartUrl: string;
  isReadonly?: boolean;
  /** Message that contains this chart; used to scroll chat to it when artifact scroll behavior is "trigger". */
  messageId?: string;
  /** Shown as the card subtitle (e.g. multi-indicator strategy). */
  subtitle?: string;
};

const PREVIEW_CHART_HEIGHT = 280;

export function ChartPreview({
  chartUrl,
  isReadonly,
  messageId,
  subtitle,
}: ChartPreviewProps) {
  const { setArtifact } = useArtifact();
  const cardRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<{
    spec: Record<string, unknown>;
    specJson: string;
    title: string;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const proxiedUrl = useMemo(
    () => proxyChartUrlForFetch(chartUrl, getBasePath()),
    [chartUrl],
  );

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setChartData(null);
    fetch(proxiedUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load chart: ${res.status}`);
        return res.json() as Promise<unknown>;
      })
      .then((data) => {
        if (cancelled) return;
        const { spec, title } = normalizeChartPayloadFromJson(data);
        const specJson = JSON.stringify(spec);
        setChartData({
          spec,
          specJson,
          title,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load chart",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [proxiedUrl]);

  const handleOpenArtifact = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (isReadonly || !chartData) return;
      setIsOpening(true);
      const target = event.currentTarget;
      const boundingBox = target.getBoundingClientRect();
      const cardBox = cardRef.current?.getBoundingClientRect();
      setArtifact((artifact: UIArtifact) => ({
        ...artifact,
        kind: "chart",
        documentId: "init",
        title: chartData.title,
        content: chartData.specJson,
        isVisible: true,
        status: "idle",
        boundingBox: cardBox ?? {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
        ...(messageId ? { triggerMessageId: messageId } : {}),
      }));
      setIsOpening(false);
    },
    [chartData, isReadonly, messageId, setArtifact],
  );

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:border-red-950/50 dark:bg-red-950/30">
        {loadError}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
    >
      <div className="border-b border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-900/30">
        {chartData ? (
          <VegaChartCard
            chartHeight={PREVIEW_CHART_HEIGHT}
            source="World Bank — Data360"
            spec={chartData.spec as VLSpec}
            subtitle={subtitle}
            title={chartData.title}
          />
        ) : (
          <div className="flex min-h-[200px] w-full items-center justify-center bg-white dark:bg-zinc-900">
            <span className="animate-spin">
              <LoaderIcon />
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-row items-center justify-between gap-2 p-4">
        <span className="font-medium">View Vega-Lite chart</span>
        <button
          disabled={isReadonly || !chartData || isOpening}
          onClick={handleOpenArtifact}
          type="button"
          className="inline-flex shrink-0 items-center justify-center rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {isOpening ? (
            <span className="animate-spin">
              <LoaderIcon />
            </span>
          ) : (
            <FullscreenIcon />
          )}
          <span className="sr-only">Open chart in viewer</span>
        </button>
      </div>
    </div>
  );
}
