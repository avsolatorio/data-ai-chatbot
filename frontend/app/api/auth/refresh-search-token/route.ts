import { type NextRequest, NextResponse } from "next/server";
import { getAuthProxyTimeoutMs } from "@/lib/constants";

/**
 * Proxies POST to the parent Data360 searchToken refresh API when the browser cannot
 * call it directly (CORS). Set NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_URL to this
 * path, and set DATA360_SEARCH_TOKEN_REFRESH_URL (preferred) or the same URL as server
 * upstream so the handler knows where to forward.
 */
export async function POST(request: NextRequest) {
  const upstream =
    process.env.DATA360_SEARCH_TOKEN_REFRESH_URL?.trim() ||
    process.env.NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_URL?.trim();

  if (!upstream) {
    return NextResponse.json(
      { success: false, message: "Refresh upstream not configured" },
      { status: 501 },
    );
  }

  if (!upstream.startsWith("http://") && !upstream.startsWith("https://")) {
    return NextResponse.json(
      {
        success: false,
        message:
          "DATA360_SEARCH_TOKEN_REFRESH_URL (or NEXT_PUBLIC) must be an absolute http(s) URL for the server proxy",
      },
      { status: 501 },
    );
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const origin =
    request.headers.get("origin") ??
    (request.headers.get("host")
      ? `${request.url.startsWith("https") ? "https" : "http"}://${request.headers.get("host")}`
      : "");

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    getAuthProxyTimeoutMs(),
  );

  let response: Response;
  try {
    response = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader && { Cookie: cookieHeader }),
        ...(origin && { Origin: origin, Referer: `${origin}/` }),
      },
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { success: false, message: "Request timeout" },
        { status: 504 },
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type");
  let data: unknown;
  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    return NextResponse.json(
      {
        success: false,
        message: `Upstream error: ${response.status} ${text.slice(0, 200)}`,
      },
      { status: response.status },
    );
  }

  const nextResponse = NextResponse.json(data, {
    status: response.status,
  });

  const setCookieHeaders = response.headers.getSetCookie?.() || [];
  if (setCookieHeaders.length === 0) {
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      nextResponse.headers.append("Set-Cookie", setCookieHeader);
    }
  } else {
    for (const c of setCookieHeaders) {
      nextResponse.headers.append("Set-Cookie", c);
    }
  }

  return nextResponse;
}
