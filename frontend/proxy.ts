import { type NextRequest, NextResponse } from "next/server";

/**
 * Derive the client-facing origin so redirects and redirectUrl param use the host the user sees,
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

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

/** Strip basePath from pathname so app/backend see paths without it. */
function pathnameWithoutBasePath(pathname: string): string {
  if (!BASE_PATH) return pathname;
  if (pathname === BASE_PATH) return "/";
  if (pathname.startsWith(`${BASE_PATH}/`))
    return pathname.slice(BASE_PATH.length);
  return pathname;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /data360-chat (no trailing slash) -> redirect to /data360-chat/ so Next.js serves the root page
  if (BASE_PATH && pathname === BASE_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = `${BASE_PATH}/`;
    return NextResponse.redirect(url, 301);
  }

  const path = pathnameWithoutBasePath(pathname);

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
    const pathPrefix = BASE_PATH ? `${BASE_PATH}` : "";
    const redirectTarget = `${baseOrigin}${pathPrefix}/`;
    const guestUrl = new URL(
      `${pathPrefix}/api/auth/guest?redirectUrl=${encodeURIComponent(redirectTarget)}`,
      baseOrigin,
    );
    return NextResponse.redirect(guestUrl);
  }

  return rewriteIfBasePath(request, pathname, path);
}

/**
 * Rewrite only for API and static paths so the backend/route handlers see paths without basePath.
 * Do NOT rewrite page routes (/, /chat/*, /login, /register) so the browser URL stays
 * under basePath (e.g. /mcp-chat/chat/123) and Next.js router/basePath behavior is preserved.
 */
function rewriteIfBasePath(
  request: NextRequest,
  pathname: string,
  pathWithoutBase: string,
): NextResponse {
  if (!BASE_PATH || pathname === pathWithoutBase) return NextResponse.next();
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
