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
      const innerData = event.data as MessagePartOrStreamEvent & {
        type?: string;
        delta?: string;
        toolCallId?: string;
        toolName?: string;
        input?: unknown;
        output?: unknown;
        errorText?: string;
      };
      const innerType = innerData.type as string | undefined;
      const partId = getPartId(innerData, thinkingId); // Inner ID, unique per part

      setStreamingParts((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(partId);

        // Handle text-delta events - accumulate text
        if (innerType === "text-delta" && "delta" in innerData) {
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
        else if (innerType === "text-start") {
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
        else if (innerType === "text-end") {
          if (existing?.data?.type === "text") {
            newMap.set(partId, {
              ...existing,
              data: {
                ...existing.data,
                state: "done" as const,
              } as StreamingThinkingPart as MessagePartOrStreamEvent,
            });
          }
        } else if (innerType === "data-usage") {
          // TODO: Handle data-usage events. We don't need to store this in the streaming parts.
        }
        // Tool stream events: merge into a single part with type "tool-<toolName>" so the renderer can show the Tool UI
        else if (innerType === "tool-input-start") {
          const payload = innerData as {
            type: "tool-input-start";
            toolCallId: string;
            toolName: string;
          };
          const toolType = `tool-${payload.toolName}` as const;
          newMap.set(partId, {
            type: "data-thinking",
            id: thinkingId,
            data: {
              type: toolType,
              toolCallId: payload.toolCallId,
              state: "input-streaming" as const,
              input: {},
              output: undefined,
            } as MessagePartOrStreamEvent,
          });
        } else if (innerType === "tool-input-delta") {
          // Keep existing merged tool part; do not overwrite with raw delta (would break display)
          if (!existing?.data || typeof existing.data !== "object")
            return newMap;
          const data = existing.data as { type?: string; state?: string };
          if (
            !data.type?.startsWith("tool-") ||
            data.state === "output-available"
          )
            return newMap;
          // Leave part as-is (still input-streaming or input-available)
        } else if (innerType === "tool-input-available") {
          const payload = innerData as {
            type: "tool-input-available";
            toolCallId: string;
            toolName: string;
            input: unknown;
          };
          const toolType = `tool-${payload.toolName}` as const;
          const prev = existing?.data as
            | {
                type: string;
                toolCallId: string;
                state: string;
                input?: unknown;
                output?: unknown;
              }
            | undefined;
          newMap.set(partId, {
            type: "data-thinking",
            id: thinkingId,
            data: {
              type: prev?.type?.startsWith("tool-") ? prev.type : toolType,
              toolCallId: payload.toolCallId,
              state: "input-available" as const,
              input: payload.input,
              output: prev?.output,
            } as MessagePartOrStreamEvent,
          });
        } else if (innerType === "tool-output-available") {
          const payload = innerData as {
            type: "tool-output-available";
            toolCallId: string;
            output: unknown;
          };
          const prev = existing?.data as
            | {
                type: string;
                toolCallId: string;
                state: string;
                input?: unknown;
                output?: unknown;
              }
            | undefined;
          newMap.set(partId, {
            type: "data-thinking",
            id: thinkingId,
            data: {
              type: prev?.type?.startsWith("tool-")
                ? prev.type
                : `tool-unknown`,
              toolCallId: payload.toolCallId,
              state: "output-available" as const,
              input: prev?.input ?? {},
              output: payload.output,
            } as MessagePartOrStreamEvent,
          });
        } else if (
          innerType === "tool-input-error" ||
          innerType === "tool-output-error"
        ) {
          const payload = innerData as {
            type: "tool-input-error" | "tool-output-error";
            toolCallId: string;
            toolName?: string;
            errorText: string;
          };
          const prev = existing?.data as
            | {
                type: string;
                toolCallId: string;
                state: string;
                input?: unknown;
                output?: unknown;
              }
            | undefined;
          const toolType = prev?.type?.startsWith("tool-")
            ? prev.type
            : `tool-${payload.toolName ?? "unknown"}`;
          newMap.set(partId, {
            type: "data-thinking",
            id: thinkingId,
            data: {
              type: toolType,
              toolCallId: payload.toolCallId,
              state: "output-error" as const,
              input: prev?.input,
              output: prev?.output,
              errorText: payload.errorText,
            } as MessagePartOrStreamEvent,
          });
        }
        // Other event types (e.g. step-start) - store as-is
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
