"use client";

import { useArtifact } from "@/hooks/use-artifact";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileTextIcon } from "lucide-react";
import { createContext, useContext } from "react";
import type { ComponentProps } from "react";
import type { Wdr2026SearchSegment } from "./types";

/** Escape for safe use inside an HTML attribute value. */
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const WdrCitationContext = createContext<{
  messageId?: string;
  /** Segments from wdr2026_search tool output in this message; used to show segment text in citation tooltip. */
  segments?: Wdr2026SearchSegment[];
} | null>(null);

/**
 * Builds a single markdown string with citation spans as raw HTML so they render
 * inline inside the same paragraph (rehype-raw will parse them).
 */
export function buildTextWithCitationPlaceholders(
  segments: WdrCitationSegment[],
): string {
  let out = "";
  for (const seg of segments) {
    if (seg.kind === "text") {
      out += seg.value;
    } else {
      const path = escapeAttr(seg.pathLabel);
      const citationValue = escapeAttr(seg.value);
      const segmentIndexAttr =
        seg.segmentIndex != null ? ` data-segment-index="${seg.segmentIndex}"` : "";
      out += `<span data-wdr-cite data-page="${seg.page}" data-path-label="${path}" data-citation-value="${citationValue}" data-citation-index="${seg.citationIndex}"${segmentIndexAttr}></span>`;
    }
  }
  return out;
}

type WdrCiteSpanProps = ComponentProps<"span"> & {
  "data-wdr-cite"?: string | boolean;
  "data-page"?: string;
  "data-path-label"?: string;
  "data-citation-value"?: string;
  "data-segment-index"?: string;
};

/**
 * Span renderer for markdown: when the node has data-wdr-cite, render the
 * citation icon button so it stays inline with the text.
 */
export function WdrCiteSpan(props: WdrCiteSpanProps) {
  const hasCite =
    props["data-wdr-cite"] !== undefined && props["data-wdr-cite"] !== false;
  const ctx = useContext(WdrCitationContext);
  const messageId = ctx?.messageId;
  const segments = ctx?.segments;
  const page = Number.parseInt(props["data-page"] ?? "1", 10);
  const pathLabel = props["data-path-label"] ?? "WDR2026";
  const citationValue = props["data-citation-value"] ?? "";
  const segmentIndexRaw = props["data-segment-index"];
  const segmentIndex =
    segmentIndexRaw != null && segmentIndexRaw !== ""
      ? Number.parseInt(segmentIndexRaw, 10)
      : undefined;

  if (!hasCite) {
    return <span {...props} />;
  }

  return (
    <span className="inline">
      <WdrCitationButton
        citationValue={citationValue}
        messageId={messageId}
        page={Number.isFinite(page) ? Math.max(1, page) : 1}
        pathLabel={pathLabel}
        segmentIndex={Number.isFinite(segmentIndex) && segmentIndex >= 1 ? segmentIndex : undefined}
        segments={segments}
        value={`(p. ${page})`}
      />
    </span>
  );
}

/**
 * Matches WDR-style inline citations: ( ... p. N ) or ( ... p. N–M ), with optional [k] segment index.
 * Group 1: content before "p. N" (path/section label).
 * Group 2: page number.
 * Group 3: optional end page (for ranges).
 * Group 4: optional [k] segment index (1-based).
 */
const WDR_CITATION_REGEX = /\(([^)]*?p\.\s*(\d+)(?:–(\d+))?\s*)\)(\[\d+\])?/g;

export type WdrCitationSegment =
  | { kind: "text"; value: string }
  | {
      kind: "citation";
      citationIndex: number;
      page: number;
      pathLabel: string;
      /** 1-based segment index from model citation [k]; used to look up segment text for tooltip. */
      segmentIndex?: number;
      value: string;
    };

/**
 * Splits assistant text into text and citation segments so citations can be
 * rendered as interactive links that open the PDF at the cited page.
 */
export function splitTextByWdrCitations(text: string): WdrCitationSegment[] {
  const segments: WdrCitationSegment[] = [];
  let lastEnd = 0;
  let citationIndex = 0;
  const re = new RegExp(WDR_CITATION_REGEX.source, "g");
  let match = re.exec(text);

  while (match) {
    const fullMatch = match[0];
    const start = match.index;
    const end = start + fullMatch.length;
    const inner = match[1] ?? "";
    const page = Number.parseInt(match[2] ?? "1", 10);
    const pathLabel = inner.trim().length > 0 ? inner.trim() : "WDR2026";
    const bracketGroup = match[4];
    let segmentIndex: number | undefined;
    if (bracketGroup) {
      const num = Number.parseInt(bracketGroup.replace(/\D/g, ""), 10);
      if (Number.isFinite(num) && num >= 1) segmentIndex = num;
    }

    if (start > lastEnd) {
      segments.push({ kind: "text", value: text.slice(lastEnd, start) });
    }
    segments.push({
      kind: "citation",
      citationIndex: citationIndex++,
      value: fullMatch,
      page: Number.isFinite(page) ? Math.max(1, page) : 1,
      pathLabel,
      ...(segmentIndex !== undefined ? { segmentIndex } : {}),
    });
    lastEnd = end;
    match = re.exec(text);
  }

  if (lastEnd < text.length) {
    segments.push({ kind: "text", value: text.slice(lastEnd) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", value: text }];
}

const MAX_TOOLTIP_SEGMENT_CHARS = 500;

type WdrCitationButtonProps = {
  value: string;
  page: number;
  pathLabel: string;
  messageId?: string;
  /** Full citation text for tooltip when segment content is not available. */
  citationValue?: string;
  /** 1-based segment index to look up segment text from context segments. */
  segmentIndex?: number;
  /** Segments from wdr2026_search in this message; segmentIndex refers to this list. */
  segments?: Wdr2026SearchSegment[];
};

export function WdrCitationButton({
  value,
  citationValue,
  page,
  pathLabel,
  messageId,
  segmentIndex,
  segments,
}: WdrCitationButtonProps) {
  const { setArtifact } = useArtifact();
  const pdfUrl = appConfig.wdr2026PdfUrl;

  const segmentByIndex =
    segments &&
    segmentIndex != null &&
    segmentIndex >= 1 &&
    segmentIndex <= segments.length
      ? segments[segmentIndex - 1]
      : undefined;
  const segmentByPage =
    !segmentByIndex &&
    segments &&
    segments.length > 0
      ? segments.find((s) => s.page === page)
      : undefined;
  const segment = segmentByIndex ?? segmentByPage;
  const segmentText = segment?.text?.trim();
  const tooltipContent =
    segmentText && segmentText.length > 0 ? (
      <span className="block">
        <span className="block border-b border-border pb-1.5 font-medium text-muted-foreground text-xs">
          {pathLabel} — p. {page}
        </span>
        <span className="mt-1.5 block leading-relaxed">
          {segmentText.length > MAX_TOOLTIP_SEGMENT_CHARS
            ? `${segmentText.slice(0, MAX_TOOLTIP_SEGMENT_CHARS)}…`
            : segmentText}
        </span>
      </span>
    ) : (
      citationValue && citationValue.trim().length > 0 ? citationValue : value
    );

  if (!pdfUrl) {
    return <span className="text-muted-foreground">{value}</span>;
  }

  const handleClick = () => {
    const title = `${pathLabel} — Page ${page}`;
    setArtifact({
      boundingBox: { height: 400, left: 0, top: 0, width: 480 },
      content: JSON.stringify({
        page,
        pathLabel,
        pdfUrl,
      }),
      documentId: "init",
      isVisible: true,
      kind: "wdr2026-pdf-page",
      status: "idle",
      title,
      ...(messageId ? { triggerMessageId: messageId } : {}),
    });
  };

  const button = (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex shrink-0 align-middle rounded p-0.5 text-muted-foreground",
        "hover:bg-muted/60 hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
      aria-label={`${pathLabel}, page ${page}. Open in PDF viewer`}
    >
      <FileTextIcon
        className="size-3.5"
        aria-hidden
        title=""
      />
    </button>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-md whitespace-normal py-2 px-3 text-left text-xs leading-relaxed"
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
