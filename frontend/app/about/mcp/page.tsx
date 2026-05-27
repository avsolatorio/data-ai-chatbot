import type { Metadata } from "next";
import { McpDocsPage } from "@/components/mcp-docs/mcp-docs-page";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `MCP Server | ${appConfig.metadata.title}`,
  description:
    "Data360 MCP server — World Bank indicators, metadata, and charts for Cursor, VS Code, and custom clients.",
};

export default function AboutMcpPage() {
  return <McpDocsPage />;
}
