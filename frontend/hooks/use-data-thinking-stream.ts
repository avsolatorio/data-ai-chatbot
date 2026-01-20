"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  DataThinkingPart,
  MessagePartOrStreamEvent,
  StreamingThinkingPart,
} from "@/lib/types";

/**
 * Hook to accumulate and manage streaming data-thinking events.
 * Similar to how useChat handles text-delta events, but for data-thinking parts.
 *
 * The outer thinking_id groups all events in the same thinking response.
 * Individual parts within the data field have distinct IDs (id or toolCallId).
 */
export function useDataThinkingStream() {
  // Map of part ID (inner ID from data field) to accumulated part data
  const [streamingParts, setStreamingParts] = useState<
    Map<string, DataThinkingPart>
  >(new Map());

  /**
   * Extract the unique identifier for a part from the inner data.
   * For text parts, uses the 'id' field. For tool parts, uses 'toolCallId'.
   */
  const getPartId = useCallback(
    (innerData: MessagePartOrStreamEvent, thinkingId: string): string => {
      if (typeof innerData === "object" && innerData !== null) {
        // For text events, use the 'id' field if available
        if ("id" in innerData && typeof innerData.id === "string") {
          return innerData.id;
        }
        // For tool events, use 'toolCallId' if available
        if (
          "toolCallId" in innerData &&
          typeof innerData.toolCallId === "string"
        ) {
          return innerData.toolCallId;
        }
      }
      // Fallback: use thinkingId if no inner ID is available
      // This shouldn't happen in normal flow, but provides a safety net
      return thinkingId;
    },
    [],
  );

  /**
   * Handle a data-thinking event from the stream.
   * Accumulates text-delta events and updates state reactively.
   */
  const handleDataThinkingEvent = useCallback(
    (event: { type: string; id: string; data: unknown }) => {
      if (event.type !== "data-thinking") {
        return;
      }

      const thinkingId = event.id; // Outer ID, same for all parts in this thinking response
      const innerData = event.data as MessagePartOrStreamEvent;
      const partId = getPartId(innerData, thinkingId); // Inner ID, unique per part

      setStreamingParts((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(partId);

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
            newMap.set(partId, {
              ...existing,
              data: {
                ...existing.data,
                text: existingText + delta,
                state: "streaming" as const,
              } as StreamingThinkingPart as MessagePartOrStreamEvent,
            });
          } else {
            // Initialize new text part if we don't have one yet
            // This handles the case where text-delta arrives before text-start
            newMap.set(partId, {
              type: "data-thinking",
              id: thinkingId,
              data: {
                type: "text",
                text: delta,
                state: "streaming" as const,
              } as StreamingThinkingPart as MessagePartOrStreamEvent,
            });
          }
        }
        // Handle text-start event - initialize text part
        else if (innerData.type === "text-start") {
          // Always create/update the part for this inner ID
          // This allows multiple parts with different inner IDs to coexist
          newMap.set(partId, {
            type: "data-thinking",
            id: thinkingId,
            data: {
              type: "text",
              text: "",
              state: "streaming" as const,
              providerMetadata: (innerData as { id?: string }).id
                ? { openai: { itemId: (innerData as { id?: string }).id } }
                : undefined,
            } as StreamingThinkingPart as MessagePartOrStreamEvent,
          });
        }
        // Handle text-end event - finalize text part
        else if (innerData.type === "text-end") {
          if (existing?.data?.type === "text") {
            newMap.set(partId, {
              ...existing,
              data: {
                ...existing.data,
                state: "done" as const,
              } as StreamingThinkingPart as MessagePartOrStreamEvent,
            });
          }
        } else if (innerData.type === "data-usage") {
          // TODO: Handle data-usage events. We don't need to store this in the streaming parts.
        }
        // Handle other event types (tools, etc.) - update directly
        else {
          newMap.set(partId, {
            type: "data-thinking",
            id: thinkingId,
            data: innerData,
          });
        }

        return newMap;
      });
    },
    [getPartId],
  );

  /**
   * Clear all streaming parts.
   * Call this when a message finishes streaming and saved parts are available.
   */
  const clear = useCallback(() => {
    setStreamingParts(new Map());
  }, []);

  // Memoize the array to ensure reactivity while avoiding unnecessary re-renders
  const streamingPartsArray = useMemo(() => {
    return Array.from(streamingParts.values());
  }, [streamingParts]);

  return {
    handleDataThinkingEvent,
    streamingParts: streamingPartsArray,
    clear,
    streamingPartsCount: streamingParts.size,
  };
}
