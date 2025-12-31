"use client";

import { useCallback, useMemo, useState } from "react";
import type { ChatMessage } from "@/lib/types";

// Stream event types that are not part of the final message parts
type StreamEventPart =
  | { type: "text-start"; id?: string }
  | { type: "text-delta"; delta: string; id?: string }
  | { type: "text-end"; id?: string }
  | { type: "step-start" }
  | { type: "start" }
  | { type: "finish" };

// Union type that includes both message parts and stream events
type MessagePartOrStreamEvent = ChatMessage["parts"][number] | StreamEventPart;

type DataThinkingPart = {
  type: string;
  id: string;
  data: MessagePartOrStreamEvent;
};

type StreamingThinkingPart = {
  type: "text";
  text: string;
  state: "streaming" | "done";
  providerMetadata?: Record<string, unknown>;
};

/**
 * Hook to accumulate and manage streaming data-thinking events.
 * Similar to how useChat handles text-delta events, but for data-thinking parts.
 */
export function useDataThinkingStream() {
  // Map of thinking part ID to accumulated part data
  const [streamingParts, setStreamingParts] = useState<
    Map<string, DataThinkingPart>
  >(new Map());

  /**
   * Handle a data-thinking event from the stream.
   * Accumulates text-delta events and updates state reactively.
   */
  const handleDataThinkingEvent = useCallback(
    (event: { type: string; id: string; data: unknown }) => {
      if (event.type !== "data-thinking") {
        return;
      }

      const thinkingId = event.id;
      const innerData = event.data as MessagePartOrStreamEvent;

      setStreamingParts((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(thinkingId);

        console.log("[useDataThinkingStream] Processing:", {
          thinkingId,
          innerDataType:
            typeof innerData === "object" &&
            innerData !== null &&
            "type" in innerData
              ? (innerData as { type: unknown }).type
              : "unknown",
          hasExisting: existing !== undefined,
          prevMapSize: prev.size,
        });

        // Handle text-delta events - accumulate text
        if (innerData.type === "text-delta" && "delta" in innerData) {
          const delta = (innerData as { delta: string }).delta || "";

          if (
            existing?.data &&
            typeof existing.data === "object" &&
            "type" in existing.data &&
            existing.data.type === "text"
          ) {
            // Accumulate text into existing part
            const existingText =
              (existing.data as StreamingThinkingPart).text || "";
            newMap.set(thinkingId, {
              ...existing,
              data: {
                ...existing.data,
                text: existingText + delta,
                state: "streaming" as const,
              } as StreamingThinkingPart as MessagePartOrStreamEvent,
            });
            console.log(
              "[useDataThinkingStream] Accumulated, new text length:",
              existingText.length + delta.length
            );
          } else {
            // Initialize new text part if we don't have one yet
            // This handles the case where text-delta arrives before text-start
            newMap.set(thinkingId, {
              type: "data-thinking",
              id: thinkingId,
              data: {
                type: "text",
                text: delta,
                state: "streaming" as const,
              } as StreamingThinkingPart as MessagePartOrStreamEvent,
            });
            console.log(
              "[useDataThinkingStream] Initialized new part, delta length:",
              delta.length
            );
          }
        }
        // Handle text-start event - initialize text part
        else if (innerData.type === "text-start") {
          newMap.set(thinkingId, {
            type: "data-thinking",
            id: thinkingId,
            data: {
              type: "text",
              text: "",
              state: "streaming" as const,
              providerMetadata: (innerData as { id?: string }).id
                ? { openai: { itemId: (innerData as { id: string }).id } }
                : undefined,
            } as StreamingThinkingPart as MessagePartOrStreamEvent,
          });
        }
        // Handle text-end event - finalize text part
        else if (innerData.type === "text-end") {
          if (existing?.data?.type === "text") {
            newMap.set(thinkingId, {
              ...existing,
              data: {
                ...existing.data,
                state: "done" as const,
              } as StreamingThinkingPart as MessagePartOrStreamEvent,
            });
          }
        }
        // Handle other event types (tools, etc.) - update directly
        else {
          newMap.set(thinkingId, {
            type: "data-thinking",
            id: thinkingId,
            data: innerData,
          });
        }

        return newMap;
      });
    },
    []
  );

  /**
   * Get all accumulated streaming parts as an array.
   * Useful for merging with saved message parts.
   */
  const getStreamingParts = useCallback((): DataThinkingPart[] => {
    return Array.from(streamingParts.values());
  }, [streamingParts]);

  /**
   * Clear all streaming parts.
   * Call this when a message finishes streaming.
   */
  const clear = useCallback(() => {
    setStreamingParts(new Map());
  }, []);

  /**
   * Clear a specific thinking part by ID.
   */
  const clearPart = useCallback((id: string) => {
    setStreamingParts((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  // Memoize the array to ensure reactivity while avoiding unnecessary re-renders
  const streamingPartsArray = useMemo(() => {
    const parts = Array.from(streamingParts.values());
    console.log(
      "[useDataThinkingStream] Memoized array, map size:",
      streamingParts.size,
      "array length:",
      parts.length
    );
    return parts;
  }, [streamingParts]);

  return {
    handleDataThinkingEvent,
    getStreamingParts,
    streamingParts: streamingPartsArray, // Expose parts directly for reactive updates
    clear,
    clearPart,
    streamingPartsCount: streamingParts.size,
  };
}
