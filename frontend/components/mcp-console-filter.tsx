"use client";

import { useEffect } from "react";

const MCP_UNKNOWN_SOURCE_MESSAGE = "Ignoring message from unknown source";
const MCP_PARSE_MESSAGE = "Failed to parse message";

/**
 * In development, suppresses benign @mcp-ui/client console.error calls:
 * - "Ignoring message from unknown source" (multiple iframes, message for another instance)
 * - "Failed to parse message" (message from another iframe doesn't match JSON-RPC response shape)
 */
function shouldSuppress(first: unknown): boolean {
  if (typeof first !== "string") return false;
  return (
    first.startsWith(MCP_UNKNOWN_SOURCE_MESSAGE) ||
    first.startsWith(MCP_PARSE_MESSAGE)
  );
}

export function McpConsoleFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      if (shouldSuppress(args[0])) return;
      try {
        originalError.apply(console, args);
      } catch {
        // Swallow if passthrough throws (e.g. large/circular args in Next devtools)
      }
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
