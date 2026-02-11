"use client";

import { BookOpenIcon, ChevronRightIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Wdr2026TocOutput, Wdr2026TocSection } from "./types";

function TocSectionNode({
  section,
  depth = 0,
}: {
  section: Wdr2026TocSection;
  depth?: number;
}) {
  const hasSubsections =
    section.subsections && section.subsections.length > 0;

  if (!hasSubsections) {
    return (
      <div
        className="flex justify-between gap-2 py-1 text-sm"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <span className="min-w-0 flex-1 truncate">{section.title}</span>
        <span className="shrink-0 text-muted-foreground text-xs">
          p.{section.page}
        </span>
      </div>
    );
  }

  return (
    <Collapsible defaultOpen={depth < 2}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-1 py-1.5 text-left text-sm font-medium hover:text-primary [&[data-state=open]>svg]:rotate-90">
        <ChevronRightIcon className="size-4 shrink-0 transition-transform" />
        <span className="min-w-0 flex-1 truncate" style={{ paddingLeft: `${depth * 8}px` }}>
          {section.number != null && `${section.number}. `}
          {section.title}
        </span>
        <span className="shrink-0 text-muted-foreground text-xs">
          p.{section.page}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {section.subsections?.map((sub, i) => (
          <TocSectionNode depth={depth + 1} key={`${sub.title}-${i}`} section={sub} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Wdr2026Toc({ output }: { output: Wdr2026TocOutput }) {
  const title = output.document_title ?? "Table of Contents";
  const sections = output.sections ?? [];

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
            <TocSectionNode key={`${section.title}-${index}`} section={section} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
