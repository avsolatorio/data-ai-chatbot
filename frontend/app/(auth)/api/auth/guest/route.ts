import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBasePath } from "@/lib/config";
import { getEnv } from "@/lib/env";

/**
 * Derive the client-facing origin from the request.
 * When behind a reverse proxy, request.url may be the internal host. We use, in order:
 * 1. Referer (browser page URL, closest to window.origin—keeps redirects on user-facing domain)
 * 2. X-Forwarded-Host + X-Forwarded-Proto (when the proxy sets them)
 * 3. NEXT_PUBLIC_APP_URL (configured public URL)
 * 4. Request host + protocol (last resort)
 */
function getRequestOrigin(request: Request): string {
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refUrl = new URL(referer);
      if (refUrl.origin && (refUrl.protocol === "http:" || refUrl.protocol === "https:")) {
        return refUrl.origin;
      }
    } catch {
      // Ignore invalid Referer
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost && forwardedProto) {
    const host = forwardedHost.split(",")[0]?.trim() ?? "";
    const proto = forwardedProto.split(",")[0]?.trim() ?? "https";
    if (host) return `${proto}://${host}`;
  }

  const appUrl = getEnv().NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      const appOrigin = new URL(appUrl).origin;
      if (appOrigin) return appOrigin;
    } catch {
      // Ignore invalid URL
    }
  }

  const host = request.headers.get("host") ?? "";
  const proto =
    request.url.startsWith("https") ? "https" : "http";
  return `${proto}://${host}`;
}

/** Hostnames that indicate an internal/container URL; never redirect the user there. */
const INTERNAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\]|[a-f0-9]{8,})$/i;

function isInternalOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
    if (INTERNAL_HOST_PATTERN.test(host)) return true;
    return false;
  } catch {
    return true;
  }
}

/**
 * Return a safe redirect target. If the client sent an absolute redirectUrl with an internal
 * origin (e.g. container hostname), use baseOrigin + path instead so we never send the user there.
 */
function safeRedirectTarget(
  redirectUrl: string,
  baseOrigin: string,
  basePath: string,
): string {
  if (!redirectUrl || redirectUrl.startsWith("/")) {
    const path = basePath + (redirectUrl || "/");
    return new URL(path, baseOrigin).toString();
  }
  try {
    const parsed = new URL(redirectUrl);
    if (parsed.origin && isInternalOrigin(parsed.origin)) {
      return new URL(parsed.pathname + parsed.search, baseOrigin).toString();
    }
    const appOrigin = getEnv().NEXT_PUBLIC_APP_URL?.trim();
    if (appOrigin) {
      const allowed = new URL(appOrigin).origin;
      if (parsed.origin !== allowed) {
        return new URL(parsed.pathname + parsed.search, baseOrigin).toString();
      }
    }
    return redirectUrl;
  } catch {
    return new URL(basePath + "/", baseOrigin).toString();
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrlParam = searchParams.get("redirectUrl") || "/";
  const baseOrigin = getRequestOrigin(request);
  const basePath = getBasePath();
  const redirectTarget = safeRedirectTarget(redirectUrlParam, baseOrigin, basePath);

  // Get cookies to forward to FastAPI
  // FastAPI will validate them and create a new guest user if they're invalid/stale
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const guestSessionId = cookieStore.get("guest_session_id")?.value;
  const userSessionId = cookieStore.get("user_session_id")?.value;

  // Build cookie header to forward to FastAPI
  const cookieHeader = [
    token && `auth_token=${token}`,
    guestSessionId && `guest_session_id=${guestSessionId}`,
    userSessionId && `user_session_id=${userSessionId}`,
  ]
    .filter(Boolean)
    .join("; ");

  // Create guest user by calling FastAPI directly
  // FastAPI will validate existing cookies and create a new guest user if needed
  try {
    const API_URL = getEnv().SERVER_API_URL;
    const fastApiUrl = `${API_URL}/api/auth/guest`;

    // Build headers with cookies. Forward Origin/Referer so FastAPI CSRF middleware
    // accepts the request (it requires Origin when Cookie is present).
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Origin: baseOrigin,
      Referer: `${baseOrigin}${basePath}/`,
      ...(cookieHeader && { Cookie: cookieHeader }),
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Call FastAPI to create/restore guest user
    // FastAPI will validate cookies and create new user if they're stale/invalid
    const response = await fetch(fastApiUrl, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      console.error(
        "Failed to create guest user:",
        response.status,
        response.statusText
      );

      // Handle rate limiting (429) - redirect to login page with error message
      if (response.status === 429) {
        const loginUrl = new URL(`${basePath}/login`, baseOrigin);
        loginUrl.searchParams.set("error", "rate_limit");
        loginUrl.searchParams.set(
          "message",
          "Too many guest user creation attempts. Please wait a minute or sign in."
        );
        return NextResponse.redirect(loginUrl);
      }

      // For other errors, redirect to login page instead of home to break the redirect loop
      // Home page would trigger proxy middleware again, causing infinite loop
      const loginUrl = new URL(`${basePath}/login`, baseOrigin);
      loginUrl.searchParams.set("error", "guest_creation_failed");
      return NextResponse.redirect(loginUrl);
    }

    // Get the user data from response
    const data = await response.json();

    // Create redirect response; redirectTarget is already safe (no internal host)
    const redirectResponse = NextResponse.redirect(redirectTarget);

    // Forward Set-Cookie headers from FastAPI to client
    // FastAPI sets cookies via Set-Cookie headers in the response
    // Note: getSetCookie() is available in Node.js 18+ fetch API
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    // If getSetCookie is not available, try to get Set-Cookie header manually
    if (setCookieHeaders.length === 0) {
      const setCookieHeader = response.headers.get("set-cookie");
      if (setCookieHeader) {
        // Handle multiple Set-Cookie headers (they might be comma-separated or in an array)
        const cookies = Array.isArray(setCookieHeader)
          ? setCookieHeader
          : setCookieHeader.split(", ");
        for (const cookie of cookies) {
          redirectResponse.headers.append("Set-Cookie", cookie.trim());
        }
      }
    } else {
      for (const cookie of setCookieHeaders) {
        redirectResponse.headers.append("Set-Cookie", cookie);
      }
    }

    return redirectResponse;
  } catch (error) {
    console.error("Error creating guest user:", error);
    // Redirect to login page instead of home to break redirect loop
    const basePath = getBasePath();
    const loginUrl = new URL(`${basePath}/login`, baseOrigin);
    loginUrl.searchParams.set("error", "guest_creation_error");
    return NextResponse.redirect(loginUrl);
  }
}
