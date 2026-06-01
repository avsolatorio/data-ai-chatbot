import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

/**
 * Backend liveness on same origin. Calls FastAPI GET /health (not /api/health).
 */
export async function GET() {
  const env = getEnv();
  const base = (
    env.SERVER_API_URL?.trim() ||
    env.NEXT_PUBLIC_API_URL?.trim() ||
    ""
  ).replace(/\/+$/, "");

  if (!base) {
    return NextResponse.json(
      { status: "error", detail: "SERVER_API_URL not configured" },
      { status: 503 },
    );
  }

  const timeoutMs = env.BACKEND_READY_FETCH_TIMEOUT_MS;

  try {
    const res = await fetch(`${base}/health`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });

    let body: Record<string, unknown> = { status: "error" };
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const parsed: unknown = await res.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        body = parsed as Record<string, unknown>;
      }
    }

    return NextResponse.json(body, { status: res.ok ? res.status : 503 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        detail:
          error instanceof Error ? error.message : "Backend unreachable",
      },
      { status: 503 },
    );
  }
}
