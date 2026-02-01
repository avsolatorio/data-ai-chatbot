"use client";

import { DATA360_GET_DATA_TOOL } from "@pcn/data360";
import { useClaimsManager } from "@pcn/ui";
import { useEffect } from "react";
import type { ChatMessage } from "@/lib/types";

const DATA360_TOOL_TYPE = "tool-data360_get_data" as const;

function isData360ToolPart(p: {
  type?: unknown;
  state?: unknown;
  output?: unknown;
}): boolean {
  if (typeof p !== "object" || p === null || !("type" in p)) {
    return false;
  }
  const type = p.type;
  const isData360Type =
    type === DATA360_TOOL_TYPE ||
    (typeof type === "string" && type.includes("data360_get_data"));
  const hasOutput =
    p.output != null &&
    typeof p.output === "object" &&
    Array.isArray((p.output as Record<string, unknown>).data);
  const stateOk =
    p.state === undefined ||
    p.state === "output-available" ||
    p.state === "output-error";
  return Boolean(isData360Type && hasOutput && stateOk);
}

function collectData360Outputs(messages: ChatMessage[]): unknown[] {
  const outputs: unknown[] = [];
  for (const message of messages) {
    const parts = message.parts ?? [];
    for (const part of parts) {
      if (typeof part !== "object" || part === null) continue;
      const p = part as { type?: string; data?: unknown; output?: unknown };
      if (isData360ToolPart(p)) {
        outputs.push(p.output);
        continue;
      }
      if (
        p.type === "data-thinking" &&
        p.data != null &&
        typeof p.data === "object"
      ) {
        const inner = p.data as {
          type?: string;
          state?: string;
          output?: unknown;
        };
        if (isData360ToolPart(inner) && inner.output != null) {
          outputs.push(inner.output);
        }
      }
    }
  }
  return outputs;
}

/**
 * Ingest all data360_get_data tool outputs from the current chat session into
 * the PCN claims manager so ClaimMark can resolve claims from any message in
 * the session. Uses both `messages` (from useChat) and `initialMessages` (from
 * server) so the manager is populated on first paint when history is loaded.
 */
export function IngestSessionData360({
  messages,
  initialMessages = [],
}: {
  messages: ChatMessage[];
  initialMessages?: ChatMessage[];
}) {
  const manager = useClaimsManager();

  useEffect(() => {
    if (!manager) return;
    const toIngest = messages.length > 0 ? messages : initialMessages;
    const outputs = collectData360Outputs(toIngest);
    for (const output of outputs) {
      manager.ingest(DATA360_GET_DATA_TOOL, output);
    }
  }, [messages, initialMessages, manager]);

  return null;
}
