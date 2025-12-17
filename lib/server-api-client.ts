/**
 * Server-side API client for Next.js server components.
 * Handles authentication for server-side requests to FastAPI backend.
 * Now uses cookie-based authentication (auth_token cookie).
 */

import { cookies } from "next/headers";

// For server-side, prefer SERVER_API_URL (for Docker internal networking)
// Falls back to NEXT_PUBLIC_API_URL (browser-accessible URL)
const SERVER_API_URL =
  process.env.SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8001";

/**
 * Server-side fetch function for API requests.
 * Handles authentication automatically.
 * Forwards all auth cookies to FastAPI backend so it can restore users if JWT expires.
 */
export async function serverApiFetch(
  endpoint: string,
  init?: RequestInit
): Promise<Response> {
  // For server-side, always use SERVER_API_URL for FastAPI endpoints
  // This ensures Docker internal networking works correctly
  // Next.js proxy endpoints should remain relative
  let url: string;

  // Check if this is a Next.js proxy endpoint (should remain relative)
  const isNextJSProxy =
    endpoint.startsWith("/api/auth/me") ||
    endpoint.startsWith("/api/auth/guest") ||
    endpoint.startsWith("/api/tokenlens");

  if (isNextJSProxy) {
    // Next.js proxy endpoints: use relative URL
    url = endpoint;
  } else {
    // FastAPI endpoints: use SERVER_API_URL for Docker internal networking
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    url = `${SERVER_API_URL}${normalizedEndpoint}`;
  }

  const headers = new Headers(init?.headers);

  // Get cookies to forward to FastAPI
  // FastAPI needs these cookies to restore users if JWT expired
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const guestSessionId = cookieStore.get("guest_session_id")?.value;
  const userSessionId = cookieStore.get("user_session_id")?.value;

  // Build cookie header with all session cookies
  // Backend will use session IDs to restore users if JWT expired or key is lost
  const cookieHeader = [
    token && `auth_token=${token}`,
    guestSessionId && `guest_session_id=${guestSessionId}`,
    userSessionId && `user_session_id=${userSessionId}`,
  ]
    .filter(Boolean)
    .join("; ");

  // Forward cookies to FastAPI (allows backend to restore user if JWT expired)
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }
  // Also send token as Authorization header (for backward compatibility)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure Content-Type is set for FastAPI (but not for FormData)
  if (
    !headers.has("Content-Type") &&
    init?.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  return response;
}
