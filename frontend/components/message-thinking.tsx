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
    key: string
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

  // Parts are already filtered and normalized in message.tsx
  // Just render them directly
  const renderedParts = thinkingParts.map((thinkingPart, index) => {
    const key = `thinking-${thinkingPart.id}-${index}`;
    return renderPart(thinkingPart.data, key);
  });

  // Always open by default if we have content to show
  // The Reasoning component will auto-close after streaming ends, but we want to show the content
  const shouldDefaultOpen = true;

  return (
    <div data-testid="message-thinking-wrapper">
      <Reasoning
        data-testid="message-thinking"
        defaultOpen={shouldDefaultOpen}
        isStreaming={isLoading}
      >
        <ReasoningTrigger />
        <CollapsibleContent
          className={cn(
            "mt-2 text-muted-foreground text-xs",
            "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in"
          )}
        >
          <div className="grid gap-2">{renderedParts}</div>
        </CollapsibleContent>
      </Reasoning>
    </div>
  );
}
