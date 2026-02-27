"use client";

import { AppRenderer } from "@mcp-ui/client";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

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
 * - Fetches the app resource via the backend API (onReadResource).
 * - When the guest app calls a tool (e.g. search input → data360_search_indicators),
 *   onCallTool forwards the request to the backend POST /api/v1/mcp/call so the
 *   MCP server runs the tool and returns results to the app.
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

  const onCallTool: NonNullable<
    ComponentProps<typeof AppRenderer>["onCallTool"]
  > = async ({ name, arguments: args }) => {
    const response = await fetch("/api/v1/mcp/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        arguments: args ?? {},
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Tool call failed: ${response.status} ${text}`);
    }
    const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    return { content: data.content ?? [] };
  };

  const onReadResource: NonNullable<
    ComponentProps<typeof AppRenderer>["onReadResource"]
  > = async ({ uri }) => {
    const url = `/api/v1/mcp/app-resource?uri=${encodeURIComponent(uri)}`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to load app resource: ${response.status} ${text}`);
    }
    const data = (await response.json()) as {
      contents: Array<{ uri?: string; mimeType?: string; text?: string; blob?: string }>;
    };
    const contents = data.contents.map((item) => {
      const resolvedUri = item.uri ?? uri;
      if (item.blob != null) {
        return { uri: resolvedUri, blob: item.blob, mimeType: item.mimeType };
      }
      return {
        uri: resolvedUri,
        text: item.text ?? "",
        mimeType: item.mimeType,
      };
    });
    return { contents };
  };

  const isChartView = toolName === "data360_get_viz_spec";
  const isSearchView = toolName === "data360_search_indicators";

  return (
    <div
      className={cn("min-w-0 max-w-full overflow-hidden", className)}
      data-mcp-chart-view={isChartView ? true : undefined}
      data-mcp-search-view={isSearchView ? true : undefined}
      style={{
        minHeight: 200,
        width: isChartView || isSearchView ? "100%" : undefined,
      }}
    >
      <AppRenderer
        toolName={toolName}
        toolResourceUri={toolResourceUri}
        sandbox={{
          url: SANDBOX_URL,
          // Explicit sandbox permissions so parent/iframe can communicate via postMessage.
          // Required for cross-origin safety; without allow-same-origin the script is blocked.
          permissions:
            "allow-scripts allow-same-origin allow-forms",
        }}
        toolInput={toolInput ?? {}}
        toolResult={
          toolResult != null
            ? { content: [{ type: "text" as const, text: JSON.stringify(toolResult) }] }
            : undefined
        }
        onReadResource={onReadResource}
        onCallTool={onCallTool}
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
