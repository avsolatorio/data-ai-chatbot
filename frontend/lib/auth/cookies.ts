/**
 * Auth cookie helpers. Used by api-client (client) and proxy (server).
 * No MSAL imports.
 */

import type { NextRequest } from "next/server";
import { getAuthCookieNamesForProxy, getBearerTokenCookieName } from "./config";

/** Client-side: read Bearer token from document.cookie (auth_token or UIT per config). */
export function getAuthTokenFromDocument(): string | null {
  if (typeof document === "undefined") return null;
  const name = getBearerTokenCookieName();
  const cookies = document.cookie.split(";");
  const entry = cookies.find((c) => c.trim().startsWith(`${name}=`));
  if (!entry) return null;
  const value = entry.split("=").slice(1).join("=").trim();
  return value.length > 0 ? value : null;
}

/** Server-side: read Bearer token from request cookies. */
export function getAuthTokenFromRequest(request: NextRequest): string | null {
  const name = getBearerTokenCookieName();
  return request.cookies.get(name)?.value ?? null;
}

/** Server-side: true if request has any cookie that indicates authentication (for proxy). */
export function hasAuthCookies(request: NextRequest): boolean {
  const names = getAuthCookieNamesForProxy();
  for (const name of names) {
    if (request.cookies.get(name)?.value) return true;
  }
  return false;
}
