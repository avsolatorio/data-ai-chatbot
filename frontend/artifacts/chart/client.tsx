"use client";

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

    // With autosize "fit", padding can expand the view and cause clipping, so pass
    // inner dimensions (minus padding) so the full chart stays visible in the container.
    const CHART_PADDING = 24;
    const padTotalX = CHART_PADDING * 2;
    const padTotalY = CHART_PADDING * 2;

    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;

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
