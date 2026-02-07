"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useArtifact } from "@/hooks/use-artifact";
import type { UIArtifact } from "../artifact";
import { FullscreenIcon, LoaderIcon } from "../icons";

const DEFAULT_VEGA_THEME_URL =
  "https://worldbank.github.io/data-visualization-style-guide/vega/wb-vega-theme.json";

function getVegaThemeUrl(): string {
  const url = process.env.NEXT_PUBLIC_VEGA_CUSTOM_THEME_URL?.trim();
  return url ?? DEFAULT_VEGA_THEME_URL;
}

function applyThemeToSpec(
  spec: Record<string, unknown>,
  theme: Record<string, unknown>,
): Record<string, unknown> {
  const mergedConfig = {
    ...(typeof spec.config === "object" && spec.config !== null
      ? (spec.config as Record<string, unknown>)
      : {}),
    ...theme,
  };
  return { ...spec, config: mergedConfig };
}

type ChartApiResponse = {
  id: string;
  title: string;
  createdAt: string;
  spec: Record<string, unknown>;
};

type ChartPreviewProps = {
  chartUrl: string;
  isReadonly?: boolean;
  /** Message that contains this chart; used to scroll chat to it when artifact scroll behavior is "trigger". */
  messageId?: string;
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

/** Aspect ratio for the chart preview (width / height). 16/9 is a good default for charts. */
const PREVIEW_ASPECT_RATIO = 16 / 9;

/** Renders a small Vega-Lite chart from a spec string (with theme). Fills container width with aspect-ratio height. */
function ChartThumbnail({ specJson }: { specJson: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<{
    width: (w?: number) => number;
    height: (h?: number) => number;
    run: () => unknown;
    finalize?: () => void;
  } | null>(null);
  const [themeConfig, setThemeConfig] = useState<Record<
    string,
    unknown
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(getVegaThemeUrl())
      .then((res) => res.json())
      .then((data: Record<string, unknown>) => {
        if (!cancelled) setThemeConfig(data);
      })
      .catch(() => {
        if (!cancelled) setThemeConfig({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !specJson.trim() || themeConfig === null) {
      return;
    }
    let spec: Record<string, unknown>;
    try {
      spec = JSON.parse(specJson) as Record<string, unknown>;
    } catch {
      return;
    }
    const specWithTheme = applyThemeToSpec(spec, themeConfig);
    const el = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;

    void (async () => {
      const { default: embed } = await import("vega-embed");
      let hasEmbedded = false;

      const CHART_PADDING = 24;
      const padTotalX = CHART_PADDING * 2;
      const padTotalY = CHART_PADDING * 2;

      const runEmbed = (w: number, h: number) => {
        if (cancelled || !el.isConnected) return;
        const width = Math.max(1, Math.floor(w));
        const height = Math.max(1, Math.floor(h));
        const innerWidth = Math.max(1, width - padTotalX);
        const innerHeight = Math.max(1, height - padTotalY);
        if (viewRef.current) {
          viewRef.current.width(innerWidth).height(innerHeight).run();
          return;
        }
        if (hasEmbedded) return;
        hasEmbedded = true;
        // Force the chart to fit inside the container. With autosize "fit", padding can
        // be applied after size and expand the view, so use inner dimensions so the
        // total rendered chart (content + padding) stays within the container.
        const specForContainer: Record<string, unknown> = {
          ...specWithTheme,
          width: innerWidth,
          height: innerHeight,
          padding: CHART_PADDING,
          autosize: { type: "fit", contain: "padding" },
        };
        embed(el, specForContainer, {
          renderer: "canvas",
          actions: false,
        }).then((result) => {
          if (cancelled) {
            result.view.finalize();
            return;
          }
          viewRef.current = result.view;
        });
      };

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width } = entry.contentRect;
        const height = width / PREVIEW_ASPECT_RATIO;
        runEmbed(width, height);
      });
      resizeObserver.observe(el);
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) runEmbed(w, h);
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      const view = viewRef.current;
      viewRef.current = null;
      if (view?.finalize) view.finalize();
      el.replaceChildren();
    };
  }, [specJson, themeConfig]);

  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-zinc-900" style={{ aspectRatio: PREVIEW_ASPECT_RATIO }}>
      <div ref={containerRef} className="absolute inset-0 size-full" />
    </div>
  );
}

export function ChartPreview({
  chartUrl,
  isReadonly,
  messageId,
}: ChartPreviewProps) {
  const { setArtifact } = useArtifact();
  const [chartData, setChartData] = useState<{
    spec: Record<string, unknown>;
    specJson: string;
    title: string;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const proxiedUrl = useMemo(() => proxyChartUrl(chartUrl), [chartUrl]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    fetch(proxiedUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load chart: ${res.status}`);
        return res.json() as Promise<ChartApiResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        const spec =
          typeof data.spec === "object" && data.spec !== null
            ? data.spec
            : {};
        const specJson = JSON.stringify(spec);
        setChartData({
          spec,
          specJson,
          title: data.title ?? "Chart",
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load chart");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [proxiedUrl]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (isReadonly || !chartData) return;
      setIsOpening(true);
      const target = event.currentTarget;
      const boundingBox = target.getBoundingClientRect();
      setArtifact((artifact: UIArtifact) => ({
        ...artifact,
        kind: "chart",
        documentId: "init",
        title: chartData.title,
        content: chartData.specJson,
        isVisible: true,
        status: "idle",
        boundingBox: {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
        ...(messageId ? { triggerMessageId: messageId } : {}),
      }));
      setIsOpening(false);
    },
    [chartData, isReadonly, messageId, setArtifact]
  );

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:border-red-950/50 dark:bg-red-950/30">
        {loadError}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isReadonly || !chartData || isOpening}
      className="flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {/* Preview area inside the same card */}
      <div className="border-b border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-900/30">
        {chartData ? (
          <ChartThumbnail specJson={chartData.specJson} />
        ) : (
          <div
            className="flex w-full items-center justify-center bg-white dark:bg-zinc-900"
            style={{ aspectRatio: PREVIEW_ASPECT_RATIO }}
          >
            <span className="animate-spin">
              <LoaderIcon />
            </span>
          </div>
        )}
      </div>
      {/* Label row */}
      <div className="flex flex-row items-center justify-between gap-2 p-4">
        <span className="font-medium">View Vega-Lite chart</span>
        {isOpening ? (
          <span className="animate-spin">
            <LoaderIcon />
          </span>
        ) : (
          <FullscreenIcon />
        )}
      </div>
    </button>
  );
}
