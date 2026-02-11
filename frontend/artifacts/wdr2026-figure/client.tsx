"use client";

import { Artifact } from "@/components/create-artifact";
import { Markdown } from "@/components/ui/markdown";
import type { Wdr2026SearchSegment } from "@/components/wdr2026/types";
import { appConfig } from "@/lib/config";

function resolveFigureImageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = appConfig.wdr2026AssetsBase;
  if (!base) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/+$/, "")}${normalized}`;
}

function parseSegmentContent(content: string): Wdr2026SearchSegment | null {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (!parsed || typeof parsed.text !== "string") return null;
    const path = Array.isArray(parsed.path)
      ? (parsed.path as string[])
      : [];
    const figureImagePath =
      typeof parsed.figure_image_path === "string"
        ? parsed.figure_image_path
        : typeof (parsed as { figureImagePath?: string }).figureImagePath ===
            "string"
          ? (parsed as { figureImagePath: string }).figureImagePath
          : null;
    return {
      segment_type:
        parsed.segment_type === "figure" ? "figure" : "text",
      path,
      segment_index:
        typeof parsed.segment_index === "number" ? parsed.segment_index : 0,
      text: parsed.text,
      token_count:
        typeof parsed.token_count === "number" ? parsed.token_count : 0,
      page_start:
        typeof parsed.page_start === "number" ? parsed.page_start : 0,
      page_end: typeof parsed.page_end === "number" ? parsed.page_end : 0,
      page: typeof parsed.page === "number" ? parsed.page : 0,
      figure_image_path: figureImagePath,
    };
  } catch {
    return null;
  }
}

export const wdr2026FigureArtifact = new Artifact({
  kind: "wdr2026-figure",
  description:
    "WDR2026 figure with caption and description in the artifact panel.",
  onStreamPart: () => {},
  content: ({ content }) => {
    const segment = parseSegmentContent(content || "{}");
    if (!segment) {
      return (
        <div className="flex h-full min-h-[200px] w-full items-center justify-center p-6 text-muted-foreground text-sm">
          No figure data to display.
        </div>
      );
    }

    const pathLabel =
      segment.path.length > 0 ? segment.path.join(" › ") : "Figure";
    const figureSrc =
      segment.figure_image_path != null
        ? resolveFigureImageUrl(segment.figure_image_path)
        : null;

    return (
      <div className="flex flex-col gap-6 p-6 pb-24">
        <div className="space-y-2 shrink-0">
          <p className="text-muted-foreground text-xs">
            p.{segment.page}
            {segment.page_start !== segment.page_end && `–${segment.page_end}`}
          </p>
          <h2 className="font-semibold text-lg leading-snug">{pathLabel}</h2>
        </div>

        {figureSrc && (
          <div className="relative w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            {/* biome-ignore lint/performance/noImgElement: figure URL from WDR2026 MCP may be external */}
            <img
              src={figureSrc}
              alt=""
              className="w-full object-contain"
              style={{ maxHeight: "min(60vh, 480px)" }}
            />
          </div>
        )}

        <div className="min-w-0 shrink-0 text-muted-foreground text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-2.5 prose-headings:mt-4 prose-headings:mb-1.5 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
          <Markdown>{segment.text}</Markdown>
        </div>
      </div>
    );
  },
  actions: [],
  toolbar: [],
});
