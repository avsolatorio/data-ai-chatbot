import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint for /api/auth/refresh
 * Forwards requests to FastAPI backend and forwards Set-Cookie headers to client
 * This allows the backend to refresh JWT tokens and update cookies
 */
export async function POST(_request: NextRequest) {
  try {
    // Get cookies from the request
    let cookieStore: Awaited<ReturnType<typeof cookies>>;
    try {
      cookieStore = await cookies();
    } catch {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 }
      );
    }
    const token = cookieStore.get("auth_token")?.value;
    const guestSessionId = cookieStore.get("guest_session_id")?.value;
    const userSessionId = cookieStore.get("user_session_id")?.value;

    // Build cookie header with all session cookies
    const cookieHeader = [
      token && `auth_token=${token}`,
      guestSessionId && `guest_session_id=${guestSessionId}`,
      userSessionId && `user_session_id=${userSessionId}`,
    ]
      .filter(Boolean)
      .join("; ");

    // If no cookies at all, return 401
    if (!cookieHeader) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 }
      );
    }

    // Call FastAPI backend
    // Use SERVER_API_URL for Docker internal networking, fallback to NEXT_PUBLIC_API_URL
    const API_URL =
      process.env.SERVER_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8001";
    const fastApiUrl = `${API_URL}/api/auth/refresh`;

    // Build headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      // Also send as Authorization header
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Add timeout to prevent hanging requests (5 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response: Response;
    try {
      response = await fetch(fastApiUrl, {
        method: "POST",
        headers,
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Timeout fetching /api/auth/refresh from FastAPI");
        return NextResponse.json(
          { detail: "Request timeout" },
          { status: 504 }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    // Get response data
    const contentType = response.headers.get("content-type");
    let data: unknown;
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error(
        "Non-JSON response from /api/auth/refresh:",
        text.substring(0, 200)
      );
      return NextResponse.json(
        { detail: `Backend error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Create Next.js response
    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });

    // Forward Set-Cookie headers from FastAPI to client
    // This allows the backend to refresh tokens and update cookies
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    if (setCookieHeaders.length === 0) {
      // Fallback: try to get Set-Cookie header manually
      const setCookieHeader = response.headers.get("set-cookie");
      if (setCookieHeader) {
        const cookieStrings = Array.isArray(setCookieHeader)
          ? setCookieHeader
          : setCookieHeader.split(", ");
        for (const cookie of cookieStrings) {
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
    console.error("Error proxying /api/auth/refresh:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}
