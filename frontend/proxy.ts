import { type NextRequest, NextResponse } from "next/server";
import { authProvider, skipLoginPage } from "@/lib/auth/config";
import { hasAuthCookies } from "@/lib/auth/cookies";
import { getBasePath } from "@/lib/config";
import { getEnv } from "@/lib/env";
import { checkNextStaticHealth } from "@/lib/next-static-health";
import packageJson from "./package.json";

const BASE_PATH = getBasePath();

/**
 * Check if pathname matches a path, accounting for Next.js basePath behavior.
 * When basePath is set, request.nextUrl.pathname may or may not include it
 * (behavior varies by Next.js version). Check both cases for reliability.
 */
function pathMatches(pathname: string, path: string): boolean {
  if (pathname === path || pathname.startsWith(`${path}/`)) return true;
  if (
    BASE_PATH &&
    (pathname === `${BASE_PATH}${path}` ||
      pathname.startsWith(`${BASE_PATH}${path}/`))
  )
    return true;
  return false;
}

/** Vega theme URL for connect-src (charts fetch JSON from worldbank.github.io). */
const VEGA_THEME_ORIGIN = "https://worldbank.github.io";

/** MSAL/Azure AD: token endpoint and silent-auth iframe. */
const MSAL_ORIGIN = "https://login.microsoftonline.com";

/** Data header service (CSS, script, content API). Covers QA, prod, etc. via NEXT_PUBLIC_DATA_HEADER_* env. */
const DATA_HEADER_ORIGIN = "https://*.worldbank.org";

/** Images (Data360 logo, etc.). */
const IMG_ORIGIN = "https://*.worldbank.org";

/**
 * Build CSP header with nonce for XSS protection. Only inline scripts with the nonce can run.
 * Next.js applies the nonce to its own scripts when it sees the CSP in the request.
 * style-src uses 'unsafe-inline' (no nonce) because React/CSS-in-JS use inline styles; nonce would ignore unsafe-inline.
 */
function buildCspWithNonce(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const parts = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${IMG_ORIGIN}`,
    "font-src 'self' data: https://fonts.gstatic.com https://*.worldbank.org",
    `connect-src 'self' ${VEGA_THEME_ORIGIN} ${MSAL_ORIGIN} ${DATA_HEADER_ORIGIN}`,
    `frame-src 'self' ${MSAL_ORIGIN}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return parts.join("; ");
}

/**
 * Create NextResponse.next() with CSP headers and nonce for XSS protection.
 * The nonce is passed in request headers so Next.js can apply it to inline scripts.
 */
const CSP_ENABLED = getEnv().CSP_ENABLED;
const CSP_REPORT_ENABLED = getEnv().CSP_REPORT_ENABLED;

function nextWithCsp(request: NextRequest): NextResponse {
  if (!CSP_ENABLED) {
    return NextResponse.next();
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCspWithNonce(nonce)
    .replace(/\s{2,}/g, " ")
    .trim();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);

  if (CSP_REPORT_ENABLED) {
    response.headers.set(
      "Content-Security-Policy-Report-Only",
      `${csp}; report-uri ${BASE_PATH}/api/csp-report`,
    );
  }

  return response;
}

/**
 * Derive the client-facing origin so redirects use the host the user sees,
 * not the internal host (e.g. in Azure/Docker, request.url can be https://container-id:8080).
 * Prefer Referer (browser page URL, closest to window.origin) so redirects stay on the
 * user-facing domain when behind a proxy that forwards to an internal host.
 */
function getRequestOrigin(request: NextRequest): string {
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

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost && forwardedProto) {
    const host = forwardedHost.split(",")[0]?.trim() ?? "";
    const proto = forwardedProto.split(",")[0]?.trim() ?? "https";
    if (host) return `${proto}://${host}`;
  }

  const appUrl = getEnv().NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      const appOrigin = new URL(appUrl).origin;
      if (appOrigin) return appOrigin;
    } catch {
      // Ignore invalid URL
    }
  }

  const host = request.headers.get("host") ?? request.nextUrl.host;
  const proto = request.nextUrl.protocol === "https:" ? "https" : "http";
  return `${proto}://${host}`;
}

/**
 * Public return URL for auth redirects. Use instead of request.url when behind a proxy
 * (request.url can expose the internal container hostname).
 */
function getPublicReturnUrlFromRequest(request: NextRequest): string {
  const appUrl = getEnv().NEXT_PUBLIC_APP_URL?.trim();
  const { pathname, search } = request.nextUrl;
  const path = pathname || "/";
  const pathPart = path.startsWith("/") ? path : `/${path}`;

  if (appUrl) {
    const base = appUrl.replace(/\/+$/, "");
    return `${base}${pathPart}${search}`;
  }

  const origin = getRequestOrigin(request);
  const basePath = BASE_PATH ? `/${BASE_PATH.replace(/^\/+|\/+$/g, "")}` : "";
  const fullPath = basePath === "/" ? pathPart : `${basePath}${pathPart}`;
  return `${origin}${fullPath}${search}`;
}

/**
 * When MAINTENANCE_MODE is "true" or "1" (set in App Service / runtime env),
 * redirect to /maintenance except for that page and static/API assets.
 */
function isMaintenanceMode(): boolean {
  return getEnv().MAINTENANCE_MODE;
}

/** Bypass maintenance redirect when this query param is present (e.g. ?nomaintenance=true). */
function isMaintenanceBypass(request: NextRequest): boolean {
  const v = request.nextUrl.searchParams.get("nomaintenance");
  return v === "true" || v === "1";
}

/** Cached GET /ready result (Next proxy runs on the server). */
let backendReadyCache: { expiresAt: number; ok: boolean } | null = null;

function backendHealthBaseUrl(): string | undefined {
  const env = getEnv();
  const raw =
    env.SERVER_API_URL?.trim() || env.NEXT_PUBLIC_API_URL?.trim() || "";
  if (!raw) return undefined;
  return raw.replace(/\/+$/, "");
}

/**
 * When MAINTENANCE_ON_BACKEND_UNREADY is true, probes FastAPI GET /ready.
 * Fail-open if no SERVER_API_URL/NEXT_PUBLIC_API_URL (misconfig should not lock users out).
 */
async function isBackendReadyCached(): Promise<boolean> {
  const env = getEnv();
  if (!env.MAINTENANCE_ON_BACKEND_UNREADY) {
    return true;
  }
  const base = backendHealthBaseUrl();
  if (!base) {
    return true;
  }
  const now = Date.now();
  if (backendReadyCache !== null && now < backendReadyCache.expiresAt) {
    return backendReadyCache.ok;
  }
  const ttl = env.BACKEND_READY_CACHE_MS;
  const timeoutMs = env.BACKEND_READY_FETCH_TIMEOUT_MS;
  try {
    const res = await fetch(`${base}/ready`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const ok = res.ok;
    backendReadyCache = { expiresAt: now + ttl, ok };
    return ok;
  } catch {
    backendReadyCache = { expiresAt: now + ttl, ok: false };
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Frontend readiness: process up + .next/static readable. Backend: GET /api/health.
  if (pathMatches(pathname, "/health")) {
    const staticHealth = await checkNextStaticHealth();
    const ok = staticHealth.ok;
    return NextResponse.json(
      {
        status: ok ? "ok" : "error",
        version: packageJson.version,
        static: staticHealth,
      },
      { status: ok ? 200 : 503 },
    );
  }

  /*
   * When basePath is set, redirect unknown paths outside the app to basePath.
   * Root (/) is handled by next.config redirects. Do NOT redirect pathname "/" here:
   * Next.js strips basePath before the proxy, so pathname "/" means both site root (/)
   * and app root (/app). Redirecting would cause ERR_TOO_MANY_REDIRECTS.
   *
   * IMPORTANT: When basePath is set, pathname is ALREADY stripped. So pathname
   * "/api/auth/msal/set-token" is the in-app path, not "/mcp-chat/api/...".
   * isUnderBasePath would always be false for stripped pathnames. Instead, we
   * allowlist known app paths and only redirect truly unknown paths (e.g. /foo).
   */
  if (BASE_PATH) {
    const isAppRoot = pathname === "" || pathname === "/";
    const isNextInternal = pathname.startsWith("/_next");
    const isStaticAsset =
      pathMatches(pathname, "/images") ||
      pathMatches(pathname, "/json") ||
      pathname.includes(".");
    /** Known app paths (pathname is stripped of basePath). Add new routes here when adding pages. This is to prevent redirects to the base path for known app paths. */
    const isKnownAppPath =
      pathMatches(pathname, "/api") ||
      pathMatches(pathname, "/chat") ||
      pathMatches(pathname, "/review") ||
      pathMatches(pathname, "/login") ||
      pathMatches(pathname, "/register") ||
      pathMatches(pathname, "/maintenance") ||
      pathMatches(pathname, "/about") ||
      pathMatches(pathname, "/health") ||
      pathMatches(pathname, "/ping");
    const shouldRedirectToBasePath =
      !isAppRoot && !isNextInternal && !isStaticAsset && !isKnownAppPath;
    if (shouldRedirectToBasePath) {
      const baseOrigin = getRequestOrigin(request);
      return NextResponse.redirect(new URL(BASE_PATH, baseOrigin));
    }
  }

  const backendReady = await isBackendReadyCached();
  const maintenancePath = `${BASE_PATH}/maintenance`;
  const isMaintenanceRoute =
    pathMatches(pathname, "/maintenance") || pathname === maintenancePath;

  /*
   * No env-driven maintenance, but user is still on /maintenance (e.g. sent here when
   * MAINTENANCE_ON_BACKEND_UNREADY was true and the API was down). Once GET /ready is OK,
   * send them to app home on refresh instead of leaving them stuck on the maintenance page.
   */
  if (isMaintenanceRoute && !isMaintenanceMode() && backendReady) {
    const baseOrigin = getRequestOrigin(request);
    return NextResponse.redirect(new URL(`${BASE_PATH}/`, baseOrigin));
  }

  const effectiveMaintenance = isMaintenanceMode() || !backendReady;

  if (effectiveMaintenance && !isMaintenanceBypass(request)) {
    const isMaintenance =
      pathMatches(pathname, "/maintenance") || pathname === maintenancePath;
    const isAboutDocs = pathMatches(pathname, "/about");
    const isNextOrApi =
      pathMatches(pathname, "/_next") ||
      pathMatches(pathname, "/api") ||
      pathname.includes(".");
    if (!isMaintenance && !isAboutDocs && !isNextOrApi) {
      return NextResponse.redirect(new URL(maintenancePath, request.url));
    }
    if (isMaintenance || isAboutDocs) {
      return nextWithCsp(request);
    }
  }

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathMatches(pathname, "/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathMatches(pathname, "/api/auth") || pathMatches(pathname, "/api/health")) {
    return nextWithCsp(request);
  }

  // MCP App resources (served to sandboxed iframes) must bypass auth: the iframe sandbox
  // (allow-scripts, no allow-same-origin) cannot send cookies, so redirecting to guest
  // auth would always fail. The backend /apps endpoint is intentionally public.
  if (pathMatches(pathname, "/api/v1/mcp/apps")) {
    return nextWithCsp(request);
  }

  // Static public assets: bypass auth so home-config.json, images, etc. load without redirect
  if (pathMatches(pathname, "/json") || pathMatches(pathname, "/images")) {
    return nextWithCsp(request);
  }

  // Check for internal API secret (from FastAPI backend)
  // If present and valid, skip authentication check
  const internalSecret = request.headers.get("x-internal-api-secret");
  const expectedSecret = getEnv().INTERNAL_API_SECRET;

  if (internalSecret && expectedSecret && internalSecret === expectedSecret) {
    // Internal request from FastAPI - allow through without auth check
    return nextWithCsp(request);
  }

  // Allow login page without authentication (prevents redirect loops when users try to login after logout)
  // When skipLoginPage is true and guest mode: redirect /login to guest creation (unless error params)
  if (pathMatches(pathname, "/login")) {
    const url = new URL(request.url);
    const hasError = url.searchParams.has("error");
    if (skipLoginPage && authProvider === "guest" && !hasError) {
      const baseOrigin = getRequestOrigin(request);
      const redirectTarget = `${baseOrigin}${BASE_PATH}/`;
      const guestUrl = new URL(
        `${BASE_PATH}/api/auth/guest?redirectUrl=${encodeURIComponent(redirectTarget)}`,
        baseOrigin,
      );
      return NextResponse.redirect(guestUrl);
    }
    return nextWithCsp(request);
  }

  // Public MCP documentation (no sign-in required)
  if (pathMatches(pathname, "/about")) {
    return nextWithCsp(request);
  }

  // Register is only for credentials-based auth (user mode). Redirect to home when msal, guest, or data360.
  if (pathMatches(pathname, "/register")) {
    if (
      authProvider === "msal" ||
      authProvider === "guest" ||
      authProvider === "data360"
    ) {
      const baseOrigin = getRequestOrigin(request);
      return NextResponse.redirect(new URL(`${BASE_PATH}/`, baseOrigin));
    }
    return nextWithCsp(request);
  }

  // Check for auth cookies (guest: auth_token/session ids; msal: UIT; data360: searchToken)
  const authenticated = hasAuthCookies(request);

  // When data360 provider: redirect to DATA360_AUTH_URL if not authenticated.
  if (authProvider === "data360" && !authenticated) {
    const data360AuthUrl = getEnv().NEXT_PUBLIC_DATA360_AUTH_URL;
    if (data360AuthUrl) {
      const returnTo = encodeURIComponent(
        getPublicReturnUrlFromRequest(request),
      );
      const redirectUrl = `${data360AuthUrl}${data360AuthUrl.includes("?") ? "&" : "?"}returnTo=${returnTo}`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // When guest provider: redirect to guest creation if not authenticated.
  // When msal provider: do not redirect; client-side MSAL handles unauthenticated users.
  if (authProvider === "guest" && !authenticated) {
    const baseOrigin = getRequestOrigin(request);
    const redirectTarget = `${baseOrigin}${BASE_PATH}/`;
    const guestUrl = new URL(
      `${BASE_PATH}/api/auth/guest?redirectUrl=${encodeURIComponent(redirectTarget)}`,
      baseOrigin,
    );
    return NextResponse.redirect(guestUrl);
  }

  return nextWithCsp(request);
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, sitemap.xml, robots.txt (metadata)
     * - images/, json/ (public/ static assets)
     * - pdf.worker.min.mjs (PDF.js worker at public root)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/|json/).*)",
  ],
};
