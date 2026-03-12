import { type NextRequest, NextResponse } from "next/server";
import { authProvider } from "@/lib/auth/config";
import { hasAuthCookies } from "@/lib/auth/cookies";
import { getBasePath } from "@/lib/config";
import { getEnv } from "@/lib/env";

const BASE_PATH = getBasePath();

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isMaintenanceMode() && !isMaintenanceBypass(request)) {
    const maintenancePath = `${BASE_PATH}/maintenance`;
    if (
      pathname !== maintenancePath &&
      !pathname.startsWith(`${BASE_PATH}/_next`) &&
      !pathname.startsWith(`${BASE_PATH}/api`) &&
      !pathname.includes(".")
    ) {
      return NextResponse.redirect(new URL(maintenancePath, request.url));
    }
    if (pathname === maintenancePath) {
      return nextWithCsp(request);
    }
  }

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith(`${BASE_PATH}/ping`)) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith(`${BASE_PATH}/api/auth`)) {
    return nextWithCsp(request);
  }

  // Static public assets: bypass auth so home-config.json, images, etc. load without redirect
  if (
    pathname.startsWith(`${BASE_PATH}/json/`) ||
    pathname.startsWith(`${BASE_PATH}/images/`)
  ) {
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
  // IMPORTANT: Return early to prevent any user lookup or guest creation
  if (pathname === `${BASE_PATH}/login`) {
    return nextWithCsp(request);
  }

  // Register is only for credentials-based auth (user mode). Redirect to home when msal or guest.
  if (pathname === `${BASE_PATH}/register`) {
    if (authProvider === "msal" || authProvider === "guest") {
      const baseOrigin = getRequestOrigin(request);
      return NextResponse.redirect(new URL(`${BASE_PATH}/`, baseOrigin));
    }
    return nextWithCsp(request);
  }

  // Check for auth cookies (guest: auth_token/session ids; msal: UIT)
  const authenticated = hasAuthCookies(request);

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
