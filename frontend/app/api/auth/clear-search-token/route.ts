import { type NextRequest, NextResponse } from "next/server";
import { getBasePath } from "@/lib/config";
import { cookiesKey } from "@/lib/constants";

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
  const isProduction = process.env.NODE_ENV === "production";
  response.headers.set(
    "Set-Cookie",
    `${cookiesKey.searchToken}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isProduction ? "; Secure" : ""}`,
  );
  return response;
}
