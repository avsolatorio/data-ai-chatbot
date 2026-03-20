import { type NextRequest, NextResponse } from "next/server";
import { getBasePath } from "@/lib/config";
import { cookiesKey } from "@/lib/constants";

const isProduction = process.env.NODE_ENV === "production";
const CLEAR_COOKIE_HEADER = `${cookiesKey.searchToken}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isProduction ? "; Secure" : ""}`;

/**
 * Clears the searchToken cookie and returns 200. Used before redirect on 401
 * so the stale token is removed before re-auth.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", CLEAR_COOKIE_HEADER);
  return response;
}

/**
 * Clears the searchToken cookie (parent app integration) and redirects.
 * Used when signing out from the chat app when authenticated via searchToken.
 */
export async function GET(request: NextRequest) {
  const redirect =
    request.nextUrl.searchParams.get("redirect") ?? (getBasePath() || "/");
  const redirectUrl = redirect.startsWith("/")
    ? new URL(redirect, request.url)
    : new URL(redirect);

  const response = NextResponse.redirect(redirectUrl, 302);
  response.headers.set("Set-Cookie", CLEAR_COOKIE_HEADER);
  return response;
}
