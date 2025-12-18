import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check for internal API secret (from FastAPI backend)
  // If present and valid, skip authentication check
  const internalSecret = request.headers.get("x-internal-api-secret");
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (internalSecret && expectedSecret && internalSecret === expectedSecret) {
    // Internal request from FastAPI - allow through without auth check
    return NextResponse.next();
  }

  // Allow login/register pages to be accessed without authentication
  // This prevents redirect loops when users try to login after logout
  // IMPORTANT: Return early to prevent any user lookup or guest creation
  if (["/login", "/register"].includes(pathname)) {
    return NextResponse.next();
  }

  // Check for auth cookies to determine if user is authenticated
  // This avoids calling getCurrentUser() which would duplicate the layout's call
  // We only need to check if cookies exist, not validate them (layout will do that)
  const authToken = request.cookies.get("auth_token")?.value;
  const guestSessionId = request.cookies.get("guest_session_id")?.value;
  const userSessionId = request.cookies.get("user_session_id")?.value;

  // If no auth cookies at all, redirect to guest creation
  // The layout will handle the actual user validation
  if (!authToken && !guestSessionId && !userSessionId) {
    const redirectUrl = encodeURIComponent(request.url);

    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  return NextResponse.next();
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
