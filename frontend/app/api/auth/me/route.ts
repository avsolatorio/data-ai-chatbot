import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { cookiesKey } from "@/lib/constants";

/**
 * Proxy endpoint for /api/auth/me
 * Forwards requests to FastAPI backend and returns user info.
 * Forwards auth_token (guest) or UIT (MSAL) from cookies so backend can validate.
 */
export async function GET(_request: NextRequest) {
  try {
    let cookieStore: Awaited<ReturnType<typeof cookies>>;
    try {
      cookieStore = await cookies();
    } catch {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 },
      );
    }
    const authToken = cookieStore.get("auth_token")?.value;
    const msalToken = cookieStore.get(cookiesKey.userImpersonationToken)?.value;
    const guestSessionId = cookieStore.get("guest_session_id")?.value;
    const userSessionId = cookieStore.get("user_session_id")?.value;

    const cookieHeader = [
      authToken && `auth_token=${authToken}`,
      msalToken && `${cookiesKey.userImpersonationToken}=${msalToken}`,
      guestSessionId && `guest_session_id=${guestSessionId}`,
      userSessionId && `user_session_id=${userSessionId}`,
    ]
      .filter(Boolean)
      .join("; ");

    if (!cookieHeader) {
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

    const bearerToken = authToken ?? msalToken;
    const headers: HeadersInit = {
      Cookie: cookieHeader,
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
