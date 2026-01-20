"use client";

import { CollapsibleContent } from "@/components/ui/collapsible";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Reasoning, ReasoningTrigger } from "./elements/reasoning";

type MessageThinkingProps = {
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

export function MessageThinking({
  isLoading,
  thinkingParts,
  renderPart,
}: MessageThinkingProps) {
  if (thinkingParts.length === 0) {
    return null;
  }

  // Always open by default if we have content to show
  // The Reasoning component will auto-close after streaming ends, but we want to show the content
  const shouldDefaultOpen = true;

  return (
    <div className="ml-0 md:ml-0 mb-5" data-testid="message-thinking-wrapper">
      <Reasoning
        data-testid="message-thinking"
        defaultOpen={shouldDefaultOpen}
        isStreaming={isLoading}
      >
        <ReasoningTrigger />
        <CollapsibleContent
          className={cn(
            "mt-2 text-muted-foreground text-xs",
            "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in",
          )}
        >
          <div className="relative max-h-[480px] overflow-y-auto pr-4">
            {/* Steps container */}
            <div className="relative space-y-4 pl-8 pb-2 text-sm [&_*]:!text-muted-foreground [&_*]:!text-sm [&_.text-xs]:!text-xs [&_button]:!text-foreground [&_button]:!text-sm [&_a]:!text-foreground [&_a]:!text-sm [&_[role='button']]:!text-foreground [&_[role='button']]:!text-sm [&_[data-radix-tooltip-content]]:!text-popover-foreground [&_[data-radix-tooltip-content]_*]:!text-popover-foreground">
              {/* Vertical line connecting all steps - positioned relative to steps container */}
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
                    {/* Step indicator circle */}
                    <div
                      className={cn(
                        "absolute z-10 mt-2 flex size-2 shrink-0 items-center justify-center rounded-full border-1 bg-background",
                        "left-[calc(0.5rem+1px-2rem-4px)]", // Center 8px circle on 2px line: line at left-2 (8px) + 1px (half line width) - 2rem (pl-8 padding) - 4px (half circle width)
                        isLoading && !isLast
                          ? "border-primary"
                          : "border-muted-foreground",
                      )}
                    >
                      {isLoading && !isLast && (
                        <div className="size-2 animate-pulse rounded-full bg-primary" />
                      )}
                    </div>
                    {/* Step content */}
                    <div className="min-w-0 flex-1 pt-0">{renderedPart}</div>
                  </div>
                );
              })}

              {/* Finished step - shown when thinking is complete */}
              {!isLoading && (
                <div className="relative flex items-start gap-3">
                  {/* Finished step indicator circle */}
                  <div
                    className={cn(
                      "absolute z-10 mt-2 flex size-2 shrink-0 items-center justify-center rounded-full border-1 bg-background",
                      "left-[calc(0.5rem+1px-2rem-4px)]",
                      "border-primary bg-primary",
                    )}
                  >
                    <div className="size-1.5 rounded-full bg-background" />
                  </div>
                  {/* Finished step content */}
                  <div className="min-w-0 flex-1 pt-0 text-muted-foreground text-xs">
                    Finished
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Reasoning>
    </div>
  );
}
