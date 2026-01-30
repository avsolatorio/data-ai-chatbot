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

/**
 * Check if endpoint should use Next.js proxy (all endpoints now use proxy)
 *
 * This function is kept for backward compatibility and always returns true
 * since we now proxy all requests through Next.js.
 */
export function shouldUseNextJSProxy(endpoint: string): boolean {
  // All endpoints now go through Next.js proxy
  return true;
}

/**
 * Get the full URL for an API request
 *
 * All requests now use relative URLs to go through Next.js proxy
 */
export function getApiUrl(endpoint: string): string {
  // If already absolute URL, extract the path and use relative
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    try {
      const url = new URL(endpoint);
      return url.pathname + url.search;
    } catch {
      // If URL parsing fails, fall through to relative handling
    }
  }

  // All requests use relative URLs to go through Next.js proxy
  // The proxy at /api/[...path] will forward to the backend
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  return normalizedEndpoint;
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
