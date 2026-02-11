import { type NextRequest, NextResponse } from "next/server";

import {
  buildFullUrl,
  buildPath,
  getBasePath,
  stripBasePath,
} from "@/lib/base-path";

/**
 * Derive the client-facing origin so redirects use the host the user sees,
 * not the internal host (e.g. in Azure/Docker, request.url can be https://container-id:8080).
 */
function getRequestOrigin(request: NextRequest): string {
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

  const host = request.headers.get("host") ?? request.nextUrl.host;
  const proto = request.nextUrl.protocol === "https:" ? "https" : "http";
  return `${proto}://${host}`;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const basePath = getBasePath();

  // Exact base path without trailing slash -> redirect to base path with slash so Next.js serves root
  if (basePath && pathname === basePath) {
    const url = request.nextUrl.clone();
    url.pathname = `${basePath}/`;
    return NextResponse.redirect(url, 301);
  }

  const path = stripBasePath(pathname);

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (path.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (path.startsWith("/api/auth")) {
    return rewriteIfBasePath(request, pathname, path);
  }

  // Check for internal API secret (from FastAPI backend)
  // If present and valid, skip authentication check
  const internalSecret = request.headers.get("x-internal-api-secret");
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (internalSecret && expectedSecret && internalSecret === expectedSecret) {
    return rewriteIfBasePath(request, pathname, path);
  }

  // Allow login/register pages to be accessed without authentication
  // This prevents redirect loops when users try to login after logout
  // IMPORTANT: Return early to prevent any user lookup or guest creation
  if (["/login", "/register"].includes(path)) {
    return rewriteIfBasePath(request, pathname, path);
  }

  // Check for auth cookies to determine if user is authenticated
  const authToken = request.cookies.get("auth_token")?.value;
  const guestSessionId = request.cookies.get("guest_session_id")?.value;
  const userSessionId = request.cookies.get("user_session_id")?.value;

  if (!authToken && !guestSessionId && !userSessionId) {
    const baseOrigin = getRequestOrigin(request);
    const redirectTarget = buildFullUrl(baseOrigin, "/");
    const guestPath = buildPath("/api/auth/guest");
    const guestUrl = new URL(
      `${guestPath}?redirectUrl=${encodeURIComponent(redirectTarget)}`,
      baseOrigin,
    );
    return NextResponse.redirect(guestUrl);
  }

  return rewriteIfBasePath(request, pathname, path);
}

/**
 * Rewrite only for API/static paths so route handlers see paths without base path.
 * Page routes are not rewritten so the browser URL stays under base path.
 */
function rewriteIfBasePath(
  request: NextRequest,
  pathname: string,
  pathWithoutBase: string,
): NextResponse {
  if (!getBasePath() || pathname === pathWithoutBase)
    return NextResponse.next();
  const isApiOrStatic =
    pathWithoutBase.startsWith("/api/") ||
    pathWithoutBase.startsWith("/json/") ||
    pathWithoutBase.startsWith("/ping");
  if (!isApiOrStatic) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = pathWithoutBase;
  return NextResponse.rewrite(url);
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
