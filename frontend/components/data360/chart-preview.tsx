"use client";

import { Data360ChartFromVizTool } from "@data360/mcp-ui/viz-card";
import type { Data360VizToolResult } from "@data360/tool-types";
import { isData360VizToolSuccess } from "@data360/tool-types";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useArtifact } from "@/hooks/use-artifact";
import { proxyChartUrlForFetch } from "@/lib/chart-url";
import { getBasePath } from "@/lib/config";
import type { UIArtifact } from "../artifact";
import { FullscreenIcon, LoaderIcon } from "../icons";

export type ChartPreviewProps = {
  /** Full viz tool result (or a minimal `{ url, error: null }` for inline URL-only embeds). */
  toolResult: Data360VizToolResult;
  isReadonly?: boolean;
  /** Message that contains this chart; used to scroll chat to it when artifact scroll behavior is "trigger". */
  messageId?: string;
};

const PREVIEW_CHART_HEIGHT = 280;

export function ChartPreview({
  toolResult,
  isReadonly,
  messageId,
}: ChartPreviewProps) {
  const { setArtifact } = useArtifact();
  const chartRegionRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<{
    specJson: string;
    title: string;
  } | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const chartIdentity = isData360VizToolSuccess(toolResult) ? toolResult.url : "";

  useEffect(() => {
    // Reset stale preview payload when a different chart result is rendered.
    setChartData(null);
    setIsOpening(false);
  }, [chartIdentity]);

  const mapUrlForFetch = useCallback(
    (u: string) => proxyChartUrlForFetch(u, getBasePath()),
    [],
  );

  const onChartReady = useCallback(
    (info: { specJson: string; title: string }) => {
      setChartData({
        specJson: info.specJson,
        title: info.title,
      });
    },
    [],
  );

  const handleOpenArtifact = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (isReadonly || !chartData) {
        return;
      }
      setIsOpening(true);
      const target = event.currentTarget;
      const boundingBox = target.getBoundingClientRect();
      const cardBox = chartRegionRef.current?.getBoundingClientRect();
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

  if (!isData360VizToolSuccess(toolResult)) {
    return null;
  }

  // ── Native @data360/mcp-ui path (default) ───────────────────────────────
  const showExpand = Boolean(chartData) && !isReadonly;

  const expandButton = showExpand ? (
    <button
      aria-label="Open chart in viewer"
      disabled={isOpening}
      onClick={handleOpenArtifact}
      title="Open chart in viewer"
      type="button"
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-zinc-300/90 bg-transparent text-zinc-600 transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
    >
      {isOpening ? (
        <span className="animate-spin">
          <LoaderIcon />
        </span>
      ) : (
        <FullscreenIcon size={14} />
      )}
    </button>
  ) : undefined;

  return (
    <div ref={chartRegionRef} className="w-full min-w-0 vega-chart-card">
      <Data360ChartFromVizTool
        chartHeight={PREVIEW_CHART_HEIGHT}
        className="w-full"
        mapUrlForFetch={mapUrlForFetch}
        onChartReady={onChartReady}
        railTopSlot={expandButton}
        toolResult={toolResult}
        loadingFallback={
          <div className="flex min-h-[200px] w-full items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20">
            <span className="animate-spin">
              <LoaderIcon />
            </span>
          </div>
        }
      />
    </div>
  );
}
