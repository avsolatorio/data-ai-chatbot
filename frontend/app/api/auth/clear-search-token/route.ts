import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getBasePath } from "@/lib/config";
import { cookiesKey } from "@/lib/constants";

const isProduction = process.env.NODE_ENV === "production";
const past = new Date(0).toUTCString();

/** Guest cookies that can conflict with searchToken auth when user returns from re-auth. */
const GUEST_COOKIE_NAMES = [
  "auth_token",
  "guest_session_id",
  "user_session_id",
] as const;

function buildClearCookieHeader(
  name: string,
  path: string,
  options?: { httpOnly?: boolean },
): string {
  const httpOnly = options?.httpOnly ? "; HttpOnly" : "";
  return `${name}=; Path=${path}; Max-Age=0; Expires=${past}; SameSite=Lax${isProduction ? "; Secure" : ""}${httpOnly}`;
}

/** Set-Cookie headers to clear searchToken at both / and basePath (parent may have set either). */
function getSearchTokenClearHeaders(): string[] {
  const basePath = getBasePath();
  const headers = [buildClearCookieHeader(cookiesKey.searchToken, "/")];
  if (basePath && basePath !== "/") {
    headers.push(buildClearCookieHeader(cookiesKey.searchToken, basePath));
  }
  return headers;
}

/** Set-Cookie headers to clear guest cookies (Path=/ for each). */
function getGuestClearHeaders(): string[] {
  return GUEST_COOKIE_NAMES.map((name) =>
    buildClearCookieHeader(name, "/", { httpOnly: true }),
  );
}

/**
 * Clears searchToken and guest cookies so re-auth returns to a clean slate.
 * Used before redirect on 401 so no stale auth conflicts with the new token.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  const allHeaders = [...getSearchTokenClearHeaders(), ...getGuestClearHeaders()];
  response.headers.set("Set-Cookie", allHeaders[0] ?? "");
  for (let i = 1; i < allHeaders.length; i++) {
    response.headers.append("Set-Cookie", allHeaders[i] ?? "");
  }
  const cookieStore = await cookies();
  for (const name of GUEST_COOKIE_NAMES) {
    cookieStore.delete(name);
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
  const allHeaders = [...getSearchTokenClearHeaders(), ...getGuestClearHeaders()];
  response.headers.set("Set-Cookie", allHeaders[0] ?? "");
  for (let i = 1; i < allHeaders.length; i++) {
    response.headers.append("Set-Cookie", allHeaders[i] ?? "");
  }
  const cookieStore = await cookies();
  for (const name of GUEST_COOKIE_NAMES) {
    cookieStore.delete(name);
  }
  return response;
}
