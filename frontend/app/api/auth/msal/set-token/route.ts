import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const GUEST_COOKIE_NAMES = ["auth_token", "guest_session_id", "user_session_id"] as const;
const MAX_TOKEN_LENGTH = 20_000;

/**
 * Validates the MSAL user impersonation token and clears guest auth cookies so
 * MSAL is the single identity. Tokens must be stored in session storage on the
 * client, not in cookies; no token or user id is stored in cookies.
 * Only accepts POST with JSON body { token: string }. Client is responsible
 * for storing the token in sessionStorage after a successful response.
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
    const cookieStore = await cookies();
    const setCookieHeaders: string[] = [];
    const past = new Date(0).toUTCString();

    // Clear guest cookies so MSAL is the single identity. Do not set any
    // cookie containing the token or user id (per MSAL / security requirements).
    for (const name of GUEST_COOKIE_NAMES) {
      setCookieHeaders.push(
        `${name}=; Path=/; Expires=${past}; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`
      );
    }

    const nextResponse = NextResponse.json({ success: true });
    const first = setCookieHeaders[0];
    if (first) nextResponse.headers.set("Set-Cookie", first);
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
