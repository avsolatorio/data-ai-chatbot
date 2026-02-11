import https from "node:https";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** When set (e.g. "true", "1"), allow HTTPS requests to the backend with self-signed certs (e.g. internal TLS). */
const BACKEND_TLS_INSECURE =
  process.env.BACKEND_TLS_INSECURE === "true" ||
  process.env.BACKEND_TLS_INSECURE === "1";

/**
 * Fetch that can skip TLS verification for backend when BACKEND_TLS_INSECURE is set.
 * Node's fetch() rejects self-signed certs; this uses https.request with rejectUnauthorized: false.
 */
async function backendFetch(
  url: string,
  options: { method: string; headers: HeadersInit },
): Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  headers: { get: (n: string) => string | null; getSetCookie: () => string[] };
  json: () => Promise<unknown>;
}> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !BACKEND_TLS_INSECURE) {
    const res = await fetch(url, options);
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: {
        get: (n) => res.headers.get(n),
        getSetCookie: () => res.headers.getSetCookie?.() ?? [],
      },
      json: () => res.json(),
    };
  }

  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {};
    if (
      options.headers &&
      typeof options.headers === "object" &&
      !(options.headers instanceof Headers)
    ) {
      for (const [k, v] of Object.entries(options.headers)) {
        if (v != null) headers[k] = String(v);
      }
    } else if (options.headers instanceof Headers) {
      options.headers.forEach((v, k) => {
        headers[k] = v;
      });
    }

    const req = https.request(
      url,
      {
        method: options.method,
        headers,
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const setCookie = res.headers["set-cookie"];
          const cookieList = Array.isArray(setCookie)
            ? setCookie
            : setCookie
              ? [setCookie]
              : [];
          resolve({
            ok:
              res.statusCode !== undefined &&
              res.statusCode >= 200 &&
              res.statusCode < 300,
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? "",
            headers: {
              get: (n) => {
                const v = res.headers[n.toLowerCase()];
                return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
              },
              getSetCookie: () => cookieList,
            },
            json: async () =>
              JSON.parse(Buffer.concat(chunks).toString("utf8")),
          });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

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
      if (
        refUrl.origin &&
        (refUrl.protocol === "http:" || refUrl.protocol === "https:")
      ) {
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
  const proto = request.url.startsWith("https") ? "https" : "http";
  return `${proto}://${host}`;
}

/** Hostnames that indicate an internal/container URL; never redirect the user there. */
const INTERNAL_HOST_PATTERN =
  /^(localhost|127\.0\.0\.1|\[::1\]|[a-f0-9]{8,})$/i;

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

function isInternalOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]")
      return true;
    if (INTERNAL_HOST_PATTERN.test(host)) return true;
    return false;
  } catch {
    return true;
  }
}

/** Build full URL for a path, including basePath when the app is mounted under one. */
function urlWithBasePath(baseOrigin: string, path: string): string {
  const p = path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (!BASE_PATH) return `${baseOrigin}${p}`;
  return `${baseOrigin}${BASE_PATH}${p}`;
}

/**
 * Return a safe redirect target to prevent open redirects.
 * - Relative paths: resolved against baseOrigin and basePath (safe).
 * - Absolute URLs to internal hosts: rewritten to baseOrigin + path so we never send the user to internal hosts.
 * - Absolute URLs to other origins: allowed only when NEXT_PUBLIC_APP_URL is set and matches that origin; otherwise rewritten to baseOrigin + path.
 *   When NEXT_PUBLIC_APP_URL is unset, we do not trust client-supplied absolute URLs and force same-origin redirect.
 */
function safeRedirectTarget(redirectUrl: string, baseOrigin: string): string {
  if (!redirectUrl || redirectUrl.startsWith("/")) {
    return urlWithBasePath(baseOrigin, redirectUrl || "/");
  }
  try {
    const parsed = new URL(redirectUrl);
    if (parsed.origin && isInternalOrigin(parsed.origin)) {
      const pathOnly = parsed.pathname === "/" ? "/" : parsed.pathname;
      return urlWithBasePath(baseOrigin, pathOnly) + (parsed.search || "");
    }
    let allowed: string | null = null;
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (appOrigin != null && appOrigin !== "") {
      try {
        allowed = new URL(appOrigin).origin;
      } catch {
        // Invalid NEXT_PUBLIC_APP_URL; treat as no whitelist
      }
    }
    // Only allow redirect to another origin if we have an explicit whitelist and the URL matches it
    if (allowed != null && parsed.origin === allowed) {
      return redirectUrl;
    }
    // Otherwise force same-origin: use path + search from the URL but origin from baseOrigin
    const pathOnly = parsed.pathname === "/" ? "/" : parsed.pathname;
    return urlWithBasePath(baseOrigin, pathOnly) + (parsed.search || "");
  } catch {
    return urlWithBasePath(baseOrigin, "/");
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrlParam = searchParams.get("redirectUrl") || "/";
  const baseOrigin = getRequestOrigin(request);
  const redirectTarget = safeRedirectTarget(redirectUrlParam, baseOrigin);

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
    // FastAPI will validate cookies and create new user if they're stale/invalid.
    // Use backendFetch so BACKEND_TLS_INSECURE can allow self-signed backend certs.
    const response = await backendFetch(fastApiUrl, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      console.error(
        "Failed to create guest user:",
        response.status,
        response.statusText,
      );

      // Handle rate limiting (429) - redirect to login page with error message
      if (response.status === 429) {
        const loginUrl = new URL(urlWithBasePath(baseOrigin, "/login"));
        loginUrl.searchParams.set("error", "rate_limit");
        loginUrl.searchParams.set(
          "message",
          "Too many guest user creation attempts. Please wait a minute or sign in.",
        );
        return NextResponse.redirect(loginUrl);
      }

      // For other errors, redirect to login page instead of home to break the redirect loop
      // Home page would trigger proxy middleware again, causing infinite loop
      const loginUrl = new URL(urlWithBasePath(baseOrigin, "/login"));
      loginUrl.searchParams.set("error", "guest_creation_failed");
      return NextResponse.redirect(loginUrl);
    }

    // Consume response body (FastAPI returns user data; we only need the response to be successful)
    await response.json();

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
    const loginUrl = new URL(urlWithBasePath(baseOrigin, "/login"));
    loginUrl.searchParams.set("error", "guest_creation_error");
    return NextResponse.redirect(loginUrl);
  }
}
