/**
 * Dev-only proxy: forwards /api/mcp-static/** requests to the local MCP server's
 * /static/** path so that viz spec JSON files (served by data360-mcp) are
 * accessible from the frontend origin in local Docker development.
 *
 * Only active when ENVIRONMENT=development. Returns 404 in production to prevent
 * accidental exposure of internal MCP URLs.
 *
 * Usage: the MCP server returns URLs like http://host.docker.internal:8021/static/viz_specs/<id>.json
 * chart-url.ts rewrites these to /api/mcp-static/viz_specs/<id>.json when in dev.
 */

import { type NextRequest, NextResponse } from "next/server";

const ENVIRONMENT = process.env.ENVIRONMENT ?? process.env.NODE_ENV;
const MCP_SERVER_URL = process.env.MCP_SERVER_URL;

function getMcpOrigin(): string | null {
  if (!MCP_SERVER_URL) return null;
  try {
    const url = new URL(MCP_SERVER_URL);
    return url.origin;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  // Disabled in production
  if (ENVIRONMENT !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const mcpOrigin = getMcpOrigin();
  if (!mcpOrigin) {
    return new NextResponse(
      "MCP_SERVER_URL not configured — cannot proxy MCP static files",
      { status: 503 },
    );
  }

  const { path } = await params;
  const upstreamPath = `/static/${path.join("/")}`;
  const upstreamUrl = `${mcpOrigin}${upstreamPath}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      // Don't verify SSL for local MCP server
      // biome-ignore lint/suspicious/noExplicitAny: node-fetch specific
      ...(process.env.MCP_SSL_VERIFY === "false" ? ({ agent: undefined } as any) : {}),
    });

    if (!upstream.ok) {
      return new NextResponse(`MCP static file not found: ${upstreamPath}`, {
        status: upstream.status,
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/json";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Failed to proxy MCP static file: ${message}`, {
      status: 502,
    });
  }
}
