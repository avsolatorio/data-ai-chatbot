import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getBearerTokenFromRequest } from "@/lib/auth/cookies";
import { cookiesKey } from "@/lib/constants";

/**
 * Proxy endpoint for /api/auth/me
 * Forwards requests to FastAPI backend and returns user info.
 * Accepts auth from: (1) Authorization header (MSAL token from session storage),
 * or (2) cookies (auth_token / UIT / guest_session_id / user_session_id).
 */
export async function GET(request: NextRequest) {
  try {
    const bearerFromHeader = getBearerTokenFromRequest(request);

    let authToken: string | undefined;
    let msalToken: string | undefined;
    let guestSessionId: string | undefined;
    let userSessionId: string | undefined;
    try {
      const cookieStore = await cookies();
      authToken = cookieStore.get("auth_token")?.value;
      msalToken = cookieStore.get(cookiesKey.userImpersonationToken)?.value;
      guestSessionId = cookieStore.get("guest_session_id")?.value;
      userSessionId = cookieStore.get("user_session_id")?.value;
    } catch {
      // cookies() can throw during prerender; continue if we have Bearer from header
    }

    const cookieHeader = [
      authToken && `auth_token=${authToken}`,
      msalToken && `${cookiesKey.userImpersonationToken}=${msalToken}`,
      guestSessionId && `guest_session_id=${guestSessionId}`,
      userSessionId && `user_session_id=${userSessionId}`,
    ]
      .filter(Boolean)
      .join("; ");

    const bearerToken = bearerFromHeader ?? authToken ?? msalToken;
    if (!bearerToken && !cookieHeader) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 },
      );
    }

    const API_URL =
      process.env.SERVER_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8001";
    const fastApiUrl = `${API_URL}/api/auth/me`;

    const headers: HeadersInit = {
      ...(cookieHeader && { Cookie: cookieHeader }),
      ...(bearerToken && { Authorization: `Bearer ${bearerToken}` }),
    };

    // Add timeout to prevent hanging requests (5 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response: Response;
    try {
      response = await fetch(fastApiUrl, {
        headers,
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Timeout fetching /api/auth/me from FastAPI");
        return NextResponse.json(
          { detail: "Request timeout" },
          { status: 504 },
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    // Get response data
    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data: unknown;
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON (e.g., HTML error page), create error response
      const text = await response.text();
      console.error(
        "Non-JSON response from /api/auth/me:",
        text.substring(0, 200),
      );
      return NextResponse.json(
        { detail: `Backend error: ${response.status} ${response.statusText}` },
        { status: response.status },
      );
    }

    // Create Next.js response
    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });

    // Forward Set-Cookie headers from FastAPI to client
    // This allows the backend to refresh tokens or set new cookies
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    if (setCookieHeaders.length === 0) {
      // Fallback: try to get Set-Cookie header manually
      const setCookieHeader = response.headers.get("set-cookie");
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader)
          ? setCookieHeader
          : setCookieHeader.split(", ");
        for (const cookie of cookies) {
          nextResponse.headers.append("Set-Cookie", cookie.trim());
        }
      }
    } else {
      for (const cookie of setCookieHeaders) {
        nextResponse.headers.append("Set-Cookie", cookie);
      }
    }

    return nextResponse;
  } catch (error) {
    console.error("Error proxying /api/auth/me:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 },
    );
  }
}
