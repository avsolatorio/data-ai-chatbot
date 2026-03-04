/**
 * Server-side API client for Next.js server components and route handlers.
 * Auth: cookies (guest) or optional options.bearerToken (e.g. from getBearerTokenFromRequest(request)).
 * MSAL tokens are client-only; pass options.bearerToken when the caller has the token.
 */

export type ServerApiFetchOptions = {
  /** When provided (e.g. from getBearerTokenFromRequest in a route handler), used for Authorization. */
  bearerToken?: string | null;
};

import { cookies } from "next/headers";
import { cookiesKey } from "@/lib/constants";

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
 *
 * Note: Server-side requests go directly to the backend API (not through Next.js proxy).
 * The proxy is only for client-side requests to avoid CORS issues.
 */
export async function serverApiFetch(
  endpoint: string,
  init?: RequestInit,
  options?: ServerApiFetchOptions
): Promise<Response> {
  // For server-side, always use SERVER_API_URL directly (bypass Next.js proxy)
  // Server-side fetch requires absolute URLs, and we don't need the proxy for CORS
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const url = `${SERVER_API_URL}${normalizedEndpoint}`;

  const headers = new Headers(init?.headers);

  // Get cookies to forward to FastAPI
  // FastAPI needs these cookies to restore users if JWT expired.
  // During prerendering, `cookies()` can reject once prerender is complete,
  // so we handle that explicitly and gracefully fall back to no auth cookies.
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = null;
  }
  const authToken = cookieStore?.get("auth_token")?.value;
  const msalToken = cookieStore?.get(cookiesKey.userImpersonationToken)?.value;
  const guestSessionId = cookieStore?.get("guest_session_id")?.value;
  const userSessionId = cookieStore?.get("user_session_id")?.value;

  // Build cookie header (guest cookies; optionally legacy UIT for backward compatibility)
  const cookieHeader = [
    authToken && `auth_token=${authToken}`,
    msalToken && `${cookiesKey.userImpersonationToken}=${msalToken}`,
    guestSessionId && `guest_session_id=${guestSessionId}`,
    userSessionId && `user_session_id=${userSessionId}`,
  ]
    .filter(Boolean)
    .join("; ");

  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }
  const bearerToken = options?.bearerToken ?? msalToken ?? authToken;
  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
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
