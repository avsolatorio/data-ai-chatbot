"use client";

import { useEffect, useRef, useState } from "react";
import { Artifact } from "@/components/create-artifact";

const VEGA_STYLE_GUIDE_URL = "/json/vega-style-guide-them.json";

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
  const viewRef = useRef<{ resize: (w: number, h: number) => void } | null>(
    null,
  );
  const [themeConfig, setThemeConfig] = useState<Record<
    string,
    unknown
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(VEGA_STYLE_GUIDE_URL)
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
    const initialWidth = el.getBoundingClientRect().width;

    void (async () => {
      const { default: embed } = await import("vega-embed");
      const result = await embed(el, specWithTheme, {
        renderer: "canvas",
        actions: false,
        width: Math.max(1, Math.floor(initialWidth)),
      });
      viewRef.current = result.view;
    })();

    return () => {
      viewRef.current = null;
      el.replaceChildren();
    };
  }, [content, themeConfig]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries.at(0);
      if (!entry || !viewRef.current) return;
      const { width, height } = entry.contentRect;
      const w = Math.max(1, Math.floor(width));
      const h = Math.max(1, Math.floor(height));
      viewRef.current.resize(w, h);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    <div className="flex size-full min-h-[300px] flex-col items-center justify-center p-4">
      <div ref={containerRef} className="w-full flex-1" />
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
