import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Reset guest session: invalidate server-side guest session and clear guest_session_id cookie.
 * Client can then call GET /api/auth/guest (or create guest) to get a fresh guest session.
 */
function getOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("host") ?? "";
  const proto = request.url.startsWith("https") ? "https" : "http";
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const API_URL =
      process.env.SERVER_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8001";
    const fastApiUrl = `${API_URL}/api/auth/guest/reset`;
    const baseOrigin = getOrigin(request);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Origin: baseOrigin,
      Referer: `${baseOrigin}/`,
    };
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      (headers as Record<string, string>).Cookie = cookieHeader;
    }

    await fetch(fastApiUrl, {
      method: "POST",
      headers,
      credentials: "include",
    });

    const nextResponse = NextResponse.json({ success: true });

    const pastDate = new Date(0).toUTCString();
    const isProduction = process.env.NODE_ENV === "production";
    nextResponse.headers.set(
      "Set-Cookie",
      `guest_session_id=; Path=/; Expires=${pastDate}; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`
    );

    const cookieStore = await cookies();
    cookieStore.delete("guest_session_id");

    return nextResponse;
  } catch (error) {
    console.error("Error during guest reset:", error);
    const nextResponse = NextResponse.json(
      { success: false, error: "Reset failed" },
      { status: 500 }
    );
    const pastDate = new Date(0).toUTCString();
    const isProduction = process.env.NODE_ENV === "production";
    nextResponse.headers.set(
      "Set-Cookie",
      `guest_session_id=; Path=/; Expires=${pastDate}; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`
    );
    return nextResponse;
  }
}
