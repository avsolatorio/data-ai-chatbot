/**
 * MCP Apps UI support: tool names that have an associated app resource URI.
 * Used to render tool results with @mcp-ui/client AppRenderer when the backend
 * MCP server exposes app resources (e.g. data360-mcp chart view, search results).
 *
 * Tool name = part type without "tool-" prefix (e.g. "data360_get_viz_spec").
 */
export const MCP_APP_TOOL_RESOURCE_URIS: Record<string, string> = {
  data360_get_viz_spec: "ui://data360/chart-view.html",
  data360_search_indicators: "ui://data360/search-results.html",
  generate_qr: "ui://data360/qr-view.html",
};

export function getMcpAppResourceUri(toolName: string): string | undefined {
  return MCP_APP_TOOL_RESOURCE_URIS[toolName];
}

export function isMcpAppTool(toolName: string): boolean {
  return toolName in MCP_APP_TOOL_RESOURCE_URIS;
}
