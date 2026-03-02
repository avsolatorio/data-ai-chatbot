import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const COOKIE_NAME_UIT = "UIT";
const GUEST_COOKIE_NAMES = ["auth_token", "guest_session_id", "user_session_id"] as const;
const MAX_TOKEN_LENGTH = 20_000;
const COOKIE_MAX_AGE_SECONDS = 86400; // 1 day

/** Escape cookie value for RFC 6265 quoted-string (prevents ; or , in value from being parsed as attributes). */
function cookieValueQuoted(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Sets the MSAL user impersonation token in an HttpOnly cookie so it is not
 * accessible to JavaScript (mitigates XSS token theft). Also clears guest
 * auth cookies so MSAL is the single identity.
 * Only accepts POST with JSON body { token: string }.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token =
      typeof body?.token === "string" ? body.token.trim() : "";

    if (!token || token.length > MAX_TOKEN_LENGTH) {
      return NextResponse.json(
        { error: "Invalid or missing token" },
        { status: 400 }
      );
    }

    const isProduction = process.env.NODE_ENV === "production";
    const secure = isProduction ? "; Secure" : "";
    const expires = new Date(Date.now() + COOKIE_MAX_AGE_SECONDS * 1000).toUTCString();

    const cookieStore = await cookies();
    const setCookieHeaders: string[] = [];

    // Set HttpOnly cookie for the impersonation token (not readable by JS).
    // Quoted value per RFC 6265 so token cannot inject cookie attributes (e.g. ; or ,).
    setCookieHeaders.push(
      `${COOKIE_NAME_UIT}=${cookieValueQuoted(token)}; Path=/; Expires=${expires}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}; HttpOnly`
    );

    // Clear guest cookies so MSAL is the single identity
    const past = new Date(0).toUTCString();
    for (const name of GUEST_COOKIE_NAMES) {
      setCookieHeaders.push(
        `${name}=; Path=/; Expires=${past}; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`
      );
    }

    const nextResponse = NextResponse.json({ success: true });
    nextResponse.headers.set("Set-Cookie", setCookieHeaders[0] ?? "");
    for (let i = 1; i < setCookieHeaders.length; i++) {
      nextResponse.headers.append("Set-Cookie", setCookieHeaders[i] ?? "");
    }

    for (const name of GUEST_COOKIE_NAMES) {
      cookieStore.delete(name);
    }

    return nextResponse;
  } catch {
    return NextResponse.json(
      { error: "Bad request" },
      { status: 400 }
    );
  }
}
