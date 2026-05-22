"use client";

import { ClaimsManager } from "@pcn-js/core";
import { ClaimsProvider } from "@pcn-js/ui";
import { useMemo, useRef } from "react";
import {
  compareCountriesExtractor,
  rankCountriesExtractor,
  summarizeDataExtractor,
  getDataExtractor,
} from "./aggregation-claim-extractors";

// ---------------------------------------------------------------------------
// Module-level singleton — extractors are registered synchronously at import
// time, before any React render, so IngestToolOutput can always find them.
// ---------------------------------------------------------------------------
export const claimsManager = new ClaimsManager();
claimsManager.registerExtractor("data360_rank_countries", rankCountriesExtractor);
claimsManager.registerExtractor("data360_compare_countries", compareCountriesExtractor);
claimsManager.registerExtractor("data360_summarize_data", summarizeDataExtractor);
claimsManager.registerExtractor("data360_get_data", getDataExtractor);

// Tool types we want to pre-ingest synchronously on load.
const AGG_TOOL_TYPES = new Set([
  "tool-data360_rank_countries",
  "tool-data360_compare_countries",
  "tool-data360_summarize_data",
  "tool-data360_get_data",
]);

const AGG_TOOL_NAMES: Record<string, string> = {
  "tool-data360_rank_countries": "data360_rank_countries",
  "tool-data360_compare_countries": "data360_compare_countries",
  "tool-data360_summarize_data": "data360_summarize_data",
  "tool-data360_get_data": "data360_get_data",
};

type MessageWithParts = {
  parts?: Array<Record<string, unknown>>;
};

/**
 * Synchronously ingests all aggregation tool outputs from loaded messages
 * during render (via useMemo) so that ClaimMark can verify numbers on first
 * paint — including after a page refresh when tool parts come from the DB.
 *
 * IngestToolOutput (from @pcn-js/ui) uses useEffect internally, which fires
 * *after* first paint. This component closes that gap by calling
 * claimsManager.ingest() during the render phase for any session data that is
 * already present when the component mounts.
 */
export function PreIngestSessionClaims({
  messages,
  initialMessages = [],
}: {
  messages: MessageWithParts[];
  initialMessages?: MessageWithParts[];
}) {
  const ingestedPartKeysRef = useRef(new Set<string>());

  const buildPartKey = (part: Record<string, unknown>, toolName: string) => {
    if (typeof part.id === "string") return `${toolName}:${part.id}`;
    const toolCallId = typeof part.toolCallId === "string" ? part.toolCallId : "";
    return `${toolName}:${toolCallId}:${JSON.stringify(part.output ?? null)}`;
  };

  // useMemo runs synchronously during render — before any useEffect or paint.
  useMemo(() => {
    const source = messages.length > 0 ? messages : initialMessages;
    for (const msg of source) {
      for (const part of msg.parts ?? []) {
        const type = part.type as string | undefined;
        if (!type) continue;

        // Top-level tool parts
        if (AGG_TOOL_TYPES.has(type) && part.state === "output-available" && part.output != null) {
          const toolName = AGG_TOOL_NAMES[type];
          if (toolName) {
            const partKey = buildPartKey(part, toolName);
            if (ingestedPartKeysRef.current.has(partKey)) continue;
            claimsManager.ingest(toolName, part.output);
            ingestedPartKeysRef.current.add(partKey);
          }
        }

        // data-thinking-wrapped tool parts
        if (type === "data-thinking" && part.data != null && typeof part.data === "object") {
          const inner = part.data as Record<string, unknown>;
          const innerType = inner.type as string | undefined;
          if (innerType && AGG_TOOL_TYPES.has(innerType) && inner.state === "output-available" && inner.output != null) {
            const toolName = AGG_TOOL_NAMES[innerType];
            if (toolName) {
              const partKey = buildPartKey(inner, toolName);
              if (ingestedPartKeysRef.current.has(partKey)) continue;
              claimsManager.ingest(toolName, inner.output);
              ingestedPartKeysRef.current.add(partKey);
            }
          }
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, initialMessages]);

  return null;
}

/**
 * Client-only wrapper that provides a shared ClaimsManager pre-populated with
 * all aggregation-tool extractors so that ClaimMark components can verify
 * numbers immediately on first paint — including after a page refresh when
 * tool parts are already available from the DB before useLayoutEffect fires.
 */
export function PcnProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <ClaimsProvider manager={claimsManager}>
      {children}
    </ClaimsProvider>
  );
}
