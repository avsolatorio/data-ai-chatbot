"use client";

import { AppRenderer } from "@mcp-ui/client";
import type { ComponentProps } from "react";

const SANDBOX_URL =
  typeof window !== "undefined"
    ? new URL("/sandbox_proxy.html", window.location.origin)
    : undefined;

export type MCPAppRendererProps = {
  toolName: string;
  toolResourceUri: string;
  toolInput?: Record<string, unknown>;
  toolResult?: unknown;
  className?: string;
};

/**
 * Renders an MCP App UI for a tool using @mcp-ui/client AppRenderer.
 * Fetches the app resource via the backend API (onReadResource).
 */
export function MCPAppRenderer({
  toolName,
  toolResourceUri,
  toolInput,
  toolResult,
  className,
}: MCPAppRendererProps) {
  if (!SANDBOX_URL) {
    return <span className={className}>Loading MCP App…</span>;
  }

  const onReadResource: NonNullable<
    ComponentProps<typeof AppRenderer>["onReadResource"]
  > = async ({ uri }) => {
    const url = `/api/v1/mcp/app-resource?uri=${encodeURIComponent(uri)}`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to load app resource: ${response.status} ${text}`);
    }
    return response.json() as Promise<{ contents: Array<{ uri?: string; mimeType?: string; text?: string; blob?: string }> }>;
  };

  return (
    <div className={className} style={{ minHeight: 200 }}>
      <AppRenderer
        toolName={toolName}
        toolResourceUri={toolResourceUri}
        sandbox={{ url: SANDBOX_URL }}
        toolInput={toolInput ?? {}}
        toolResult={
          toolResult != null
            ? { content: [{ type: "text" as const, text: JSON.stringify(toolResult) }] }
            : undefined
        }
        onReadResource={onReadResource}
        onOpenLink={async ({ url }) => {
          if (typeof window !== "undefined" && url) {
            window.open(url, "_blank", "noopener,noreferrer");
          }
          return { isError: false };
        }}
        onMessage={async () => ({ isError: false })}
        onError={(error) => {
          // Log only; AppRenderer may show inline error
          if (typeof console !== "undefined" && console.error) {
            console.error("[MCPAppRenderer]", error);
          }
        }}
      />
    </div>
  );
}
