"use client";

import { CollapsibleContent } from "@/components/ui/collapsible";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Reasoning, ReasoningTrigger } from "./elements/reasoning";

// Stream event types that might be in the data
type StreamEventPart =
  | { type: "text-start"; id?: string }
  | { type: "text-delta"; delta: string; id?: string }
  | { type: "text-end"; id?: string }
  | { type: "step-start" };

type MessagePartOrStreamEvent = ChatMessage["parts"][number] | StreamEventPart;

type MessageThinkingProps = {
  isLoading: boolean;
  thinkingParts: Array<{
    type: string;
    id: string;
    data: MessagePartOrStreamEvent;
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

  const renderedParts = thinkingParts
    .map((thinkingPart, index) => {
      const key = `thinking-${thinkingPart.id}-${index}`;

      // Convert the data to a renderable part if needed
      let renderablePart: ChatMessage["parts"][number] | null = null;
      const data = thinkingPart.data;

      // If it's a StreamingThinkingPart (has state property), remove it
      if (
        typeof data === "object" &&
        data !== null &&
        "type" in data &&
        data.type === "text" &&
        "state" in data
      ) {
        const { state: _state, ...textPart } = data as {
          type: "text";
          text: string;
          state: "streaming" | "done";
          providerMetadata?: Record<string, unknown>;
        };
        renderablePart = textPart as ChatMessage["parts"][number];
      }
      // Skip stream events that aren't renderable
      else if (data && typeof data === "object" && "type" in data) {
        const dataType = (data as { type: unknown }).type;
        if (
          typeof dataType === "string" &&
          (dataType === "text-start" ||
            dataType === "text-delta" ||
            dataType === "text-end" ||
            dataType === "step-start" ||
            dataType === "finish")
        ) {
          return null;
        }
        // It's already a proper message part
        renderablePart = data as ChatMessage["parts"][number];
      }

      if (!renderablePart) {
        return null;
      }

      return renderPart(renderablePart, key);
    })
    .filter((rendered) => rendered !== null && rendered !== undefined);

  if (renderedParts.length === 0) {
    return null;
  }

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
