/**
 * API Client - Uses Next.js proxy for all requests
 *
 * All API requests go through the Next.js proxy at /api/[...path].
 * Base path is applied via lib/base-path so requests hit the correct route when mounted.
 */

import { buildPath } from "@/lib/base-path";

export function shouldUseNextJSProxy(_endpoint: string): boolean {
  return true;
}

/**
 * Path for an API request (relative to origin). Idempotent: already-prefixed paths are unchanged.
 */
export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    try {
      const url = new URL(endpoint);
      return buildPath(url.pathname) + url.search;
    } catch {
      // fall through
    }
  }
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return buildPath(normalized);
}

/**
 * Enhanced fetch that routes to FastAPI or Next.js proxies
 *
 * - Handles authentication automatically via cookies
 * - Routes to FastAPI by default
 * - Uses Next.js proxies for special cases
 */
export function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let requestUrl: string;
  if (typeof input === "string") {
    requestUrl = input;
  } else if (input instanceof URL) {
    requestUrl = input.toString();
  } else {
    // input is a Request object
    requestUrl = input.url;
  }

  const fullUrl = getApiUrl(requestUrl);
  const usesNextJSProxy = shouldUseNextJSProxy(requestUrl);

  // Prepare request headers
  const requestHeaders = new Headers(init?.headers);

  // For FastAPI requests (not Next.js proxies), ensure Content-Type is set
  // Note: Cookies are sent automatically with credentials: "include"
  // Server-side might need manual cookie forwarding (handled in server-api-client.ts)
  if (
    !usesNextJSProxy &&
    !requestHeaders.has("Content-Type") &&
    init?.body &&
    !(init.body instanceof FormData)
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  // Get auth_token from cookie (client-side only) and send as Bearer for FastAPI
  let cookieToken: string | null = null;
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    const authCookie = cookies.find((c) => c.trim().startsWith("auth_token="));
    if (authCookie) {
      cookieToken = authCookie.split("=")[1] ?? null;
    }
  }
  if (cookieToken) {
    requestHeaders.set("Authorization", `Bearer ${cookieToken}`);
  }

  // Create request with updated headers
  const newInit: RequestInit = {
    ...init,
    headers: requestHeaders,
    credentials: "include", // Always include cookies
  };

  return fetch(fullUrl, newInit);
}
