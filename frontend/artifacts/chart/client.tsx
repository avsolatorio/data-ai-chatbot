"use client";

import {
  choroplethLegendVerticalReservePx,
  choroplethMapFacetHeightPx,
  hasChoroplethQuantitativeColor,
  patchVegaSpecChoroplethMapGroupClip,
  patchVegaSpecChoroplethWheelZoom,
  prepareSpec,
  suggestChoroplethSceneHeight,
  type VLSpec,
} from "@data360/mcp-viz-core";
import {
  applyChoroplethEmbedDomStyles,
  attachChoroplethMapInteractions,
} from "@data360/mcp-ui/viz-card";
import { useEffect, useRef, useState } from "react";
import { Artifact } from "@/components/create-artifact";

/** Default Vega theme URL (World Bank style guide). Override via NEXT_PUBLIC_VEGA_CUSTOM_THEME_URL in .env. */
const DEFAULT_VEGA_THEME_URL =
  "https://worldbank.github.io/data-visualization-style-guide/vega/wb-vega-theme.json";

function getVegaThemeUrl(): string {
  const url = process.env.NEXT_PUBLIC_VEGA_CUSTOM_THEME_URL?.trim();
  return url ?? DEFAULT_VEGA_THEME_URL;
}

type ChartEditorProps = {
  content: string;
  status: "streaming" | "idle";
};

/** Matches ``ChartPreview`` / ``Data360ChartFromVizTool`` default chart height. */
const CHART_PREVIEW_HEIGHT = 280;

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

function ChartEditor({ content, status }: ChartEditorProps) {
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
    const themeUrl = getVegaThemeUrl();
    fetch(themeUrl)
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
    if (!containerRef.current || !content?.trim() || themeConfig === null) {
      return;
    }

    let spec: Record<string, unknown>;
    try {
      spec = JSON.parse(content) as Record<string, unknown>;
    } catch {
      return;
    }

    const specWithTheme = applyThemeToSpec(spec, themeConfig);
    const isChoropleth = hasChoroplethQuantitativeColor(
      specWithTheme as VLSpec,
    );

    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    const initialWidth = Math.max(1, Math.floor(rect.width));

    const getMaxChartHeight = () =>
      Math.max(
        1,
        Math.floor(
          0.6 * (typeof window !== "undefined" ? window.innerHeight : 600),
        ),
      );
    const initialHeight = Math.min(
      Math.max(1, Math.floor(rect.height)),
      getMaxChartHeight(),
    );

    const CHART_PADDING = 24;
    const padTotalX = CHART_PADDING * 2;
    const padTotalY = CHART_PADDING * 2;

    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;
    let detachChoropleth: (() => void) | undefined;

    const buildSpecForSize = (w: number, h: number) => {
      const innerW = Math.max(1, w - padTotalX);
      const innerH = Math.max(1, h - padTotalY);
      return {
        ...specWithTheme,
        width: innerW,
        height: innerH,
        padding: CHART_PADDING,
        autosize: { type: "fit" as const, contain: "padding" as const },
      };
    };

    void (async () => {
      try {
        if (isChoropleth) {
          const { default: embed } = await import("vega-embed");
          const { compile } = await import("vega-lite");

          let lastInnerW = 0;
          const widthThreshold = 2;

          const runChoroplethEmbed = async () => {
            if (cancelled || !el.isConnected) return;
            const innerW = Math.max(1, Math.floor(el.clientWidth) - padTotalX);
            if (
              lastInnerW !== 0 &&
              Math.abs(innerW - lastInnerW) < widthThreshold
            ) {
              return;
            }
            lastInnerW = innerW;

            try {
              viewRef.current?.finalize?.();
            } catch {
              /* ignore */
            }
            viewRef.current = null;
            detachChoropleth?.();
            detachChoropleth = undefined;
            el.replaceChildren();

            const prepared = prepareSpec(
              specWithTheme as VLSpec,
              suggestChoroplethSceneHeight(innerW, CHART_PREVIEW_HEIGHT),
              innerW,
            );
            const plotWidth =
              typeof prepared.width === "number" &&
              Number.isFinite(prepared.width)
                ? prepared.width
                : innerW;
            const plotHeight =
              typeof prepared.height === "number" &&
              Number.isFinite(prepared.height)
                ? prepared.height
                : suggestChoroplethSceneHeight(innerW, CHART_PREVIEW_HEIGHT);
            const stripDesired = choroplethLegendVerticalReservePx(innerW);
            const mapFacetMin = choroplethMapFacetHeightPx(innerW);
            const legendStripPx = Math.min(
              stripDesired,
              Math.max(80, plotHeight - mapFacetMin - 8),
            );
            const compiled = compile(prepared as Parameters<typeof compile>[0])
              .spec as Record<string, unknown>;
            const vegaSpec = {
              ...patchVegaSpecChoroplethMapGroupClip(
                patchVegaSpecChoroplethWheelZoom(compiled, {
                  plotWidth,
                  plotHeight,
                  legendStripPx,
                }),
              ),
              autosize: "none" as const,
            };

            const result = await embed(el, vegaSpec as never, {
              renderer: "svg",
              actions: false,
            });
            if (cancelled) {
              result.finalize();
              return;
            }
            applyChoroplethEmbedDomStyles(el);
            viewRef.current = result.view as unknown as NonNullable<
              typeof viewRef.current
            >;
            detachChoropleth = attachChoroplethMapInteractions(
              el,
              result.view as never,
            );
          };

          await runChoroplethEmbed();

          const onResize = () => {
            requestAnimationFrame(() => {
              void runChoroplethEmbed();
            });
          };

          resizeObserver = new ResizeObserver(onResize);
          resizeObserver.observe(el);
          return;
        }

        const { default: embed } = await import("vega-embed");
        const result = await embed(
          el,
          buildSpecForSize(initialWidth, initialHeight),
          {
            renderer: "canvas",
            actions: false,
          },
        );
        if (cancelled) {
          result.view.finalize();
          el.replaceChildren();
          return;
        }
        const view = result.view;
        viewRef.current = view;

        let lastW = 0;
        let lastH = 0;
        const sizeThreshold = 2;

        const applySize = (w: number, h: number) => {
          const innerW = Math.max(1, w - padTotalX);
          const innerH = Math.max(1, h - padTotalY);
          view.width(innerW).height(innerH).run();
        };

        const readSizeAndApply = () => {
          if (cancelled || !el.isConnected) return;
          const w = Math.max(1, el.clientWidth);
          const containerH = Math.max(1, el.clientHeight);
          const h = Math.min(containerH, getMaxChartHeight());
          const changed =
            Math.abs(w - lastW) >= sizeThreshold ||
            Math.abs(h - lastH) >= sizeThreshold;
          if (!changed && lastW !== 0 && lastH !== 0) return;
          lastW = w;
          lastH = h;
          applySize(w, h);
        };

        const onResize = () => {
          requestAnimationFrame(() => {
            requestAnimationFrame(readSizeAndApply);
          });
        };

        resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(el);
        onResize();
      } catch {
        if (!cancelled) el.replaceChildren();
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      detachChoropleth?.();
      detachChoropleth = undefined;
      const view = viewRef.current;
      viewRef.current = null;
      if (view?.finalize) view.finalize();
      el.replaceChildren();
    };
  }, [content, themeConfig]);

  if (status === "streaming" && !content?.trim()) {
    return (
      <div className="flex size-full items-center justify-center p-8 text-muted-foreground">
        Loading chart…
      </div>
    );
  }

  if (!content?.trim()) {
    return (
      <div className="flex size-full items-center justify-center p-8 text-muted-foreground">
        No chart spec available.
      </div>
    );
  }

  return (
    <div className="flex size-full min-h-0 min-w-0 flex-col p-4">
      <div
        ref={containerRef}
        className="min-h-0 min-w-0 flex-1 overflow-hidden"
      />
    </div>
  );
}

export const chartArtifact = new Artifact<"chart", null>({
  kind: "chart",
  description: "Vega-Lite visualization",
  onStreamPart: () => {},
  content: ({ content, status }) => (
    <ChartEditor content={content} status={status} />
  ),
  actions: [],
  toolbar: [],
});
