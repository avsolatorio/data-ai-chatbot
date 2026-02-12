"use client";

import { useCallback } from "react";
import { BookOpenIcon, ChevronRightIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useArtifact } from "@/hooks/use-artifact";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Wdr2026TocOutput, Wdr2026TocSection } from "./types";

function TocSectionNode({
  section,
  depth = 0,
  onSectionClick,
  canOpenPdf,
}: {
  section: Wdr2026TocSection;
  depth?: number;
  onSectionClick: (section: Wdr2026TocSection) => void;
  canOpenPdf: boolean;
}) {
  const hasSubsections =
    section.subsections && section.subsections.length > 0;

  const sectionLabel =
    section.number != null ? `${section.number}. ${section.title}` : section.title;
  const pageLabel = `p.${section.page}`;

  const handleOpenPdf = () => {
    if (canOpenPdf) onSectionClick(section);
  };

  if (!hasSubsections) {
    const content = (
      <>
        <span className="min-w-0 flex-1 truncate">{section.title}</span>
        <span className="shrink-0 text-muted-foreground text-xs">
          {pageLabel}
        </span>
      </>
    );
    return (
      <div
        className="flex justify-between gap-2 py-1 text-sm"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {canOpenPdf ? (
          <button
            type="button"
            className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded px-1 py-0.5 -mx-1 text-left hover:bg-muted/60 hover:text-primary"
            onClick={handleOpenPdf}
            aria-label={`${sectionLabel}, ${pageLabel}. Open in PDF viewer`}
          >
            {content}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            {content}
          </div>
        )}
      </div>
    );
  }

  const titleAndPage = (
    <>
      <span className="min-w-0 flex-1 truncate">
        {section.number != null && `${section.number}. `}
        {section.title}
      </span>
      <span className="shrink-0 text-muted-foreground text-xs">
        {pageLabel}
      </span>
    </>
  );

  return (
    <Collapsible defaultOpen={depth < 2}>
      <div className="flex w-full items-center gap-1 py-1.5 text-sm font-medium">
        <CollapsibleTrigger
          className="flex shrink-0 cursor-pointer items-center justify-center rounded p-0.5 hover:bg-muted/60 hover:text-primary [&[data-state=open]>svg]:rotate-90"
          aria-label={depth < 2 ? "Collapse section" : "Expand section"}
        >
          <ChevronRightIcon className="size-4 transition-transform" />
        </CollapsibleTrigger>
        {canOpenPdf ? (
          <button
            type="button"
            className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded px-1 py-0.5 -mx-1 text-left hover:bg-muted/60 hover:text-primary"
            style={{ paddingLeft: `${depth * 8}px` }}
            onClick={handleOpenPdf}
            aria-label={`${sectionLabel}, ${pageLabel}. Open in PDF viewer`}
          >
            {titleAndPage}
          </button>
        ) : (
          <div
            className="flex min-w-0 flex-1 items-center justify-between gap-2"
            style={{ paddingLeft: `${depth * 8}px` }}
          >
            {titleAndPage}
          </div>
        )}
      </div>
      <CollapsibleContent>
        {section.subsections?.map((sub, i) => (
          <TocSectionNode
            canOpenPdf={canOpenPdf}
            depth={depth + 1}
            key={`${sub.title}-${i}`}
            onSectionClick={onSectionClick}
            section={sub}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Wdr2026Toc({
  output,
  messageId,
}: {
  output: Wdr2026TocOutput;
  messageId?: string;
}) {
  const { setArtifact } = useArtifact();
  const pdfUrl = appConfig.wdr2026PdfUrl;
  const canOpenPdf = Boolean(pdfUrl);

  const title = output.document_title ?? "Table of Contents";
  const sections = output.sections ?? [];

  const onSectionClick = useCallback(
    (section: Wdr2026TocSection) => {
      if (!pdfUrl) return;
      const page = Number.isFinite(section.page) ? Math.max(1, section.page) : 1;
      const pathLabel = section.title ?? "WDR2026";
      const artifactTitle = `${pathLabel} — Page ${page}`;
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
        title: artifactTitle,
        ...(messageId ? { triggerMessageId: messageId } : {}),
      });
    },
    [messageId, pdfUrl, setArtifact],
  );

  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-muted-foreground text-sm">
        No table of contents available.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 overflow-hidden rounded-sm bg-background px-1 pb-2">
      <div className="flex items-center gap-2 px-1">
        <BookOpenIcon className="size-4 text-muted-foreground" />
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <ScrollArea className="h-80 w-full rounded-md border border-border">
        <div className={cn("space-y-0.5 p-4 pr-5")}>
          {sections.map((section, index) => (
            <TocSectionNode
              canOpenPdf={canOpenPdf}
              key={`${section.title}-${index}`}
              onSectionClick={onSectionClick}
              section={section}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
