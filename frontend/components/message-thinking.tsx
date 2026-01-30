"use client";

import { Button } from "@/components/ui/button";
import { CollapsibleContent } from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Reasoning, ReasoningTrigger } from "./elements/reasoning";

const SCROLL_AT_BOTTOM_THRESHOLD_PX = 24;

const stepsContentClassName =
  "relative space-y-4 pl-8 pb-2 text-sm [&_*]:!text-muted-foreground [&_*]:!text-sm [&_.text-xs]:!text-xs [&_button]:!text-foreground [&_button]:!text-sm [&_a]:!text-foreground [&_a]:!text-sm [&_[role='button']]:!text-foreground [&_[role='button']]:!text-sm [&_[data-radix-tooltip-content]]:!text-popover-foreground [&_[data-radix-tooltip-content]_*]:!text-popover-foreground";

type ThinkingStepsBodyProps = {
  isLoading: boolean;
  thinkingParts: Array<{
    type: string;
    id: string;
    data: ChatMessage["parts"][number];
  }>;
  renderPart: (
    part: ChatMessage["parts"][number],
    key: string,
  ) => React.ReactNode;
};

function ThinkingStepsBody({
  isLoading,
  thinkingParts,
  renderPart,
}: ThinkingStepsBodyProps) {
  return (
    <div className={cn("relative", stepsContentClassName)}>
      <div
        className="absolute left-2 top-2 bottom-0 w-[2px] bg-border"
        aria-hidden
      />
      {thinkingParts.map((thinkingPart, index) => {
        const key = `thinking-${thinkingPart.id}-${index}`;
        const isLast = index === thinkingParts.length - 1;
        const renderedPart = renderPart(thinkingPart.data, key);
        return (
          <div key={key} className="relative flex items-start gap-3">
            <div
              className={cn(
                "absolute z-10 mt-2 flex size-2 shrink-0 items-center justify-center rounded-full border-1 bg-background",
                "left-[calc(0.5rem+1px-2rem-4px)]",
                isLoading && !isLast
                  ? "border-primary"
                  : "border-muted-foreground",
              )}
            >
              {isLoading && !isLast && (
                <div className="size-2 animate-pulse rounded-full bg-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0">{renderedPart}</div>
          </div>
        );
      })}
      {!isLoading && (
        <div className="relative flex items-start gap-3">
          <div
            className={cn(
              "absolute z-10 mt-2 flex size-2 shrink-0 items-center justify-center rounded-full border-1 bg-background",
              "left-[calc(0.5rem+1px-2rem-4px)]",
              "border-primary bg-primary",
            )}
          >
            <div className="size-1.5 rounded-full bg-background" />
          </div>
          <div className="min-w-0 flex-1 pt-0 text-muted-foreground text-xs">
            Finished
          </div>
        </div>
      )}
    </div>
  );
}

type MessageThinkingProps = {
  isLoading: boolean;
  isFromSavedParts?: boolean;
  thinkingParts: Array<{
    type: string;
    id: string;
    data: ChatMessage["parts"][number];
  }>;
  renderPart: (
    part: ChatMessage["parts"][number],
    key: string,
  ) => React.ReactNode;
};

export function MessageThinking({
  isLoading,
  isFromSavedParts = false,
  thinkingParts,
  renderPart,
}: MessageThinkingProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const isFollowingRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }, []);

  // When new parts are added, scroll to bottom and resume following (ResizeObserver handles streaming growth)
  useEffect(() => {
    if (thinkingParts.length === 0) return;
    scrollToBottom();
    isFollowingRef.current = true;
  }, [thinkingParts.length, scrollToBottom]);

  // ResizeObserver: when content grows while user is following, keep scrolling to bottom
  useEffect(() => {
    const contentEl = contentContainerRef.current;
    if (!contentEl) return;
    const ro = new ResizeObserver(() => {
      if (!isFollowingRef.current) return;
      scrollToBottom();
    });
    ro.observe(contentEl);
    return () => ro.disconnect();
  }, [scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <=
      SCROLL_AT_BOTTOM_THRESHOLD_PX;
    isFollowingRef.current = atBottom;
  }, []);

  if (thinkingParts.length === 0) {
    return null;
  }

  // Open by default when streaming (to show live updates)
  // Close by default when loaded from DB (to avoid expand/collapse animation)
  const shouldDefaultOpen = !isFromSavedParts;

  return (
    <div className="ml-0 md:ml-0 mb-5" data-testid="message-thinking-wrapper">
      <Reasoning
        data-testid="message-thinking"
        defaultOpen={shouldDefaultOpen}
        isStreaming={isLoading}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <ReasoningTrigger />
          <Sheet onOpenChange={setSheetOpen} open={sheetOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Expand agent actions in a larger view"
              >
                <Maximize2 className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full flex-col gap-4 sm:max-w-2xl"
            >
              <SheetHeader>
                <SheetTitle>Agent actions</SheetTitle>
                <SheetDescription>
                  Steps and tool calls used to produce this answer.
                </SheetDescription>
              </SheetHeader>
              <section
                className="min-h-0 flex-1 overflow-y-auto pr-4"
                aria-label="Reasoning steps"
              >
                <ThinkingStepsBody
                  isLoading={isLoading}
                  thinkingParts={thinkingParts}
                  renderPart={renderPart}
                />
              </section>
            </SheetContent>
          </Sheet>
        </div>
        <CollapsibleContent
          className={cn(
            "mt-2 text-muted-foreground text-xs",
            "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in",
          )}
        >
          <section
            ref={scrollContainerRef}
            className="relative max-h-[480px] overflow-y-auto pr-4"
            onScroll={handleScroll}
            aria-label="Reasoning steps"
          >
            <div ref={contentContainerRef}>
              <ThinkingStepsBody
                isLoading={isLoading}
                thinkingParts={thinkingParts}
                renderPart={renderPart}
              />
            </div>
          </section>
        </CollapsibleContent>
      </Reasoning>
    </div>
  );
}
