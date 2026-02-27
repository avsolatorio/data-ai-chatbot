/**
 * Proxies chart JSON requests so the MCP chart app iframe can load charts
 * without CORS. The iframe may have a different origin (e.g. blob:) and cannot
 * fetch the chart URL directly.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const API_URL =
  process.env.SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8001";

/** Allowed URL origins for chart proxy (no trailing slash). */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  try {
    const api = new URL(API_URL);
    origins.push(api.origin);
  } catch {
    // ignore
  }
  origins.push(
    "http://localhost:8000",
    "http://localhost:8001",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8001",
    "https://dataexppythonapidev.aseqa.worldbank.org",
  );
  const extra = process.env.NEXT_PUBLIC_CHART_PROXY_ORIGINS?.trim();
  if (extra) {
    for (const o of extra.split(",")) {
      const t = o.trim();
      if (t) origins.push(t);
    }
  }
  return [...new Set(origins)];
}

function isAllowedChartUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const origin = u.origin;
    return getAllowedOrigins().includes(origin);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam || typeof urlParam !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid query parameter: url" },
      { status: 400 }
    );
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(urlParam);
  } catch {
    return NextResponse.json(
      { error: "Invalid url parameter" },
      { status: 400 }
    );
  }

  // Resolve path-only URLs against the backend origin
  const fetchUrl =
    decoded.startsWith("http://") || decoded.startsWith("https://")
      ? decoded
      : new URL(decoded.startsWith("/") ? decoded : `/${decoded}`, API_URL).href;

  if (!isAllowedChartUrl(fetchUrl)) {
    return NextResponse.json(
      { error: "Chart URL origin not allowed for proxy" },
      { status: 403 }
    );
  }

  try {
    const res = await fetch(fetchUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Chart fetch failed: ${res.status}` },
        { status: res.status === 404 ? 404 : 502 }
      );
    }
    const body = await res.json();
    const response = NextResponse.json(body);
    // Allow iframe (e.g. blob or same-origin) to read the response
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chart proxy failed";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
