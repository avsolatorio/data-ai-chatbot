import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Derive the client-facing origin from the request.
 * When behind a reverse proxy, request.url may be the internal host. We use, in order:
 * 1. X-Forwarded-Host + X-Forwarded-Proto (when the proxy sets them)
 * 2. Referer header (the browser sends the page URL, so we get the client's origin)
 * 3. NEXT_PUBLIC_APP_URL (configured public URL)
 * 4. Request host + protocol (last resort)
 */
function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost && forwardedProto) {
    const host = forwardedHost.split(",")[0]?.trim() ?? "";
    const proto = forwardedProto.split(",")[0]?.trim() ?? "https";
    if (host) return `${proto}://${host}`;
  }

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";
  const baseOrigin = getRequestOrigin(request);

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
    // Use SERVER_API_URL for Docker internal networking, fallback to NEXT_PUBLIC_API_URL
    const API_URL =
      process.env.SERVER_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8001";
    const fastApiUrl = `${API_URL}/api/auth/guest`;

    // Build headers with cookies
    const headers: HeadersInit = {
      "Content-Type": "application/json",
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
        const loginUrl = new URL("/login", baseOrigin);
        loginUrl.searchParams.set("error", "rate_limit");
        loginUrl.searchParams.set(
          "message",
          "Too many guest user creation attempts. Please wait a minute or sign in."
        );
        return NextResponse.redirect(loginUrl);
      }

      // For other errors, redirect to login page instead of home to break the redirect loop
      // Home page would trigger proxy middleware again, causing infinite loop
      const loginUrl = new URL("/login", baseOrigin);
      loginUrl.searchParams.set("error", "guest_creation_failed");
      return NextResponse.redirect(loginUrl);
    }

    // Get the user data from response
    const data = await response.json();

    // Create redirect response using client-facing origin so user is not sent to internal host
    const redirectResponse = NextResponse.redirect(
      new URL(redirectUrl, baseOrigin)
    );

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
    const loginUrl = new URL("/login", baseOrigin);
    loginUrl.searchParams.set("error", "guest_creation_error");
    return NextResponse.redirect(loginUrl);
  }
}
