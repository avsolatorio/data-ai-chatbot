"use client";

import { ExpandIcon, FileTextIcon, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useArtifact } from "@/hooks/use-artifact";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Wdr2026SearchResponse, Wdr2026SearchSegment } from "./types";

/** Resolve figure image URL: use assets base when set, otherwise path as-is. */
function resolveFigureImageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = appConfig.wdr2026AssetsBase;
  if (!base) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/+$/, "")}${normalized}`;
}

function SegmentCard({
  segment,
  onOpenInPanel,
}: {
  segment: Wdr2026SearchSegment;
  onOpenInPanel?: (segment: Wdr2026SearchSegment) => void;
}) {
  const isFigure = segment.segment_type === "figure";
  const pathLabel = segment.path.length > 0 ? segment.path.join(" › ") : "—";
  const figureSrc =
    isFigure && segment.figure_image_path
      ? resolveFigureImageUrl(segment.figure_image_path)
      : null;

  return (
    <Card className="w-full border-border transition-colors hover:border-primary/30">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs font-normal">
              {isFigure ? (
                <>
                  <ImageIcon className="mr-1 size-3" />
                  Figure
                </>
              ) : (
                <>
                  <FileTextIcon className="mr-1 size-3" />
                  Text
                </>
              )}
            </Badge>
            <span className="text-muted-foreground text-xs">
              p.{segment.page}
              {segment.page_start !== segment.page_end &&
                `–${segment.page_end}`}
            </span>
          </div>
          {isFigure && onOpenInPanel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => onOpenInPanel(segment)}
            >
              <ExpandIcon className="size-3.5" />
              Open in panel
            </Button>
          )}
        </div>
        <CardTitle className="font-medium text-sm leading-snug">
          {pathLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {isFigure && figureSrc && (
          <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
            {/* biome-ignore lint/performance/noImgElement: figure URL from WDR2026 MCP may be external */}
            <img src={figureSrc} alt="" className="size-full object-contain" />
          </div>
        )}
        <ScrollArea
          className={cn(
            "w-full rounded-md border border-border",
            isFigure ? "h-48" : "h-64",
          )}
        >
          <div className="min-w-0 shrink-0 p-4 pr-5 text-muted-foreground text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-headings:mt-4 prose-headings:mb-1.5 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
            <Markdown className="space-y-4">{segment.text}</Markdown>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function Wdr2026SearchResults({
  output,
  messageId,
}: {
  output: Wdr2026SearchResponse;
  messageId?: string;
}) {
  const { setArtifact } = useArtifact();
  const segments = output.result ?? [];

  const handleOpenInPanel = (segment: Wdr2026SearchSegment) => {
    const pathLabel =
      segment.path.length > 0 ? segment.path.join(" › ") : "Figure";
    const title = `${pathLabel} (p.${segment.page})`;
    setArtifact({
      boundingBox: { height: 400, left: 0, top: 0, width: 480 },
      content: JSON.stringify(segment),
      documentId: "init",
      isVisible: true,
      kind: "wdr2026-figure",
      status: "idle",
      title,
      ...(messageId ? { triggerMessageId: messageId } : {}),
    });
  };

  if (segments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-muted-foreground text-sm">
        No matching segments in WDR2026.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 overflow-hidden rounded-sm bg-background px-1 pb-2">
      <div className="flex items-center justify-between px-1">
        <span className="font-semibold text-sm">WDR2026 search results</span>
        <span className="text-muted-foreground text-xs">
          {segments.length} segment{segments.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {segments.map((segment, index) => (
          <SegmentCard
            key={`${segment.path.join("-")}-${index}`}
            segment={segment}
            onOpenInPanel={handleOpenInPanel}
          />
        ))}
      </div>
    </div>
  );
}
