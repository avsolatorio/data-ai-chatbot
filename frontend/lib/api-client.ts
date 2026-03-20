/**
 * API Client - Uses Next.js proxy for all requests
 *
 * All API requests go through the Next.js proxy at /api/[...path]
 * which forwards them to the backend (NEXT_PUBLIC_API_URL).
 * This avoids CORS issues and centralizes API configuration.
 *
 * Special routes that have custom handlers (like /api/auth/*) will
 * still use their specific Next.js routes, as they take precedence
 * over the catch-all proxy.
 */

import { authProvider } from "@/lib/auth/config";
import { getAuthTokenFromDocument } from "@/lib/auth/cookies";
import { getBasePath } from "@/lib/config";
import { getEnv } from "@/lib/env";
import { getMsalRefresh } from "@/lib/auth/msal/msal-refresh-registry";

/**
 * Check if endpoint should use Next.js proxy (all endpoints now use proxy)
 *
 * This function is kept for backward compatibility and always returns true
 * since we now proxy all requests through Next.js.
 */
export function shouldUseNextJSProxy(_endpoint: string): boolean {
  // All endpoints now go through Next.js proxy
  return true;
}

/**
 * Get the full URL for an API request (path with basePath when set).
 * Idempotent: if the path already includes basePath, it is not added again.
 * Use for: direct fetch(), window.location, or when passing to consumers that don't call getApiUrl.
 * For apiFetch/fetchWithErrorHandlers: pass raw paths (e.g. "/api/models"); they call getApiUrl internally.
 */
export function getApiUrl(endpoint: string): string {
  const basePath = getBasePath();

  // If already absolute URL, extract the path and use relative
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    try {
      const url = new URL(endpoint);
      const path = url.pathname + url.search;
      if (!basePath || path.startsWith(basePath)) return path;
      return `${basePath}${path}`;
    } catch {
      // If URL parsing fails, fall through to relative handling
    }
  }

  // Normalize relative path
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  // Idempotent: if path already starts with basePath, don't add again
  if (basePath && !normalizedEndpoint.startsWith(basePath)) {
    return `${basePath}${normalizedEndpoint}`;
  }
  return normalizedEndpoint;
}

/**
 * Enhanced fetch that routes to FastAPI or Next.js proxies.
 * Pass raw paths (e.g. "/api/models", "/api/chat/123"); getApiUrl is applied internally.
 *
 * - Handles authentication automatically via cookies
 * - Routes to FastAPI by default
 * - Uses Next.js proxies for special cases
 * - MSAL: on 401, attempts silent token refresh and retries once
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  isRetry = false,
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

  // Prepare request headers
  const requestHeaders = new Headers(init?.headers);

  // Set Content-Type for JSON bodies when not already set (proxy forwards to backend)
  if (
    !requestHeaders.has("Content-Type") &&
    init?.body &&
    !(init.body instanceof FormData)
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  // Get Bearer token from cookie (auth_token or UIT per auth config)
  const cookieToken =
    typeof document !== "undefined" ? getAuthTokenFromDocument() : null;
  if (cookieToken) {
    requestHeaders.set("Authorization", `Bearer ${cookieToken}`);
  }

  // Create request with updated headers
  const newInit: RequestInit = {
    ...init,
    headers: requestHeaders,
    credentials: "include", // Always include cookies
  };

  const response = await fetch(fullUrl, newInit);

  // MSAL: on 401, try silent refresh and retry once (no user interaction)
  // Skip retry for requests with non-reusable body (stream, FormData, etc.)
  const canRetry =
    !init?.body || typeof init.body === "string";
  if (
    typeof window !== "undefined" &&
    response.status === 401 &&
    authProvider === "msal" &&
    !isRetry &&
    canRetry
  ) {
    const refresh = getMsalRefresh();
    if (refresh) {
      const ok = await refresh();
      if (ok) {
        const newToken = getAuthTokenFromDocument();
        if (newToken) {
          const retryHeaders = new Headers(newInit.headers);
          retryHeaders.set("Authorization", `Bearer ${newToken}`);
          return apiFetch(
            fullUrl,
            { ...newInit, headers: retryHeaders },
            true,
          );
        }
      }
    }
  }

  // data360 or msal+searchToken: on 401, clear searchToken then redirect to auth URL
  // Also handle msal when using searchToken (no MSAL refresh available)
  const isData360OrSearchToken =
    authProvider === "data360" ||
    (authProvider === "msal" && !getMsalRefresh());
  if (
    typeof window !== "undefined" &&
    response.status === 401 &&
    isData360OrSearchToken
  ) {
    try {
      await fetch(getApiUrl("/api/auth/clear-search-token"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      const authUrl = getEnv().NEXT_PUBLIC_DATA360_AUTH_URL;
      if (authUrl) {
        const returnTo = encodeURIComponent(window.location.href);
        const redirectUrl = `${authUrl}${authUrl.includes("?") ? "&" : "?"}returnTo=${returnTo}`;
        window.location.replace(redirectUrl);
      }
    }
  }

  return response;
}
