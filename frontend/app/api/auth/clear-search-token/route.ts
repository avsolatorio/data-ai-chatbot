import { type NextRequest, NextResponse } from "next/server";
import { getBasePath } from "@/lib/config";
import { cookiesKey } from "@/lib/constants";

const isProduction = process.env.NODE_ENV === "production";

function buildClearCookieHeader(path: string): string {
  return `${cookiesKey.searchToken}=; Path=${path}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isProduction ? "; Secure" : ""}`;
}

/** Set-Cookie headers to clear searchToken at both / and basePath (parent may have set either). */
function getClearCookieHeaders(): string[] {
  const basePath = getBasePath();
  const headers = [buildClearCookieHeader("/")];
  if (basePath && basePath !== "/") {
    headers.push(buildClearCookieHeader(basePath));
  }
  return headers;
}

/**
 * Clears the searchToken cookie and returns 200. Used before redirect on 401
 * so the stale token is removed before re-auth.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  const headers = getClearCookieHeaders();
  response.headers.set("Set-Cookie", headers[0] ?? "");
  for (let i = 1; i < headers.length; i++) {
    response.headers.append("Set-Cookie", headers[i] ?? "");
  }
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
  const headers = getClearCookieHeaders();
  response.headers.set("Set-Cookie", headers[0] ?? "");
  for (let i = 1; i < headers.length; i++) {
    response.headers.append("Set-Cookie", headers[i] ?? "");
  }
  return response;
}
