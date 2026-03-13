/**
 * Auth cookie helpers. Used by api-client (client) and proxy (server).
 * No MSAL imports. For MSAL, tokens are read from session storage only (not cookies).
 */

import type { NextRequest } from "next/server";
import { cookiesKey, sessionStorageKeys } from "@/lib/constants";
import { authProvider, getAuthCookieNamesForProxy, getBearerTokenCookieName } from "./config";

/** Client-side: read searchToken cookie (parent app integration). Returns null if not MSAL or cookie absent. */
function getSearchTokenFromDocument(): string | null {
  if (typeof document === "undefined" || authProvider !== "msal") return null;
  try {
    const cookies = document.cookie.split(";");
    const entry = cookies.find((c) => c.trim().startsWith(`${cookiesKey.searchToken}=`));
    if (!entry) return null;
    const value = entry.split("=").slice(1).join("=").trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Client-side: read Bearer token from session storage (MSAL) or document.cookie (guest). */
export function getAuthTokenFromDocument(): string | null {
  if (typeof document === "undefined") return null;
  if (authProvider === "msal") {
    try {
      const fromSearchToken = getSearchTokenFromDocument();
      if (fromSearchToken) return fromSearchToken;
      const token = typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(sessionStorageKeys.msalUserImpersonationToken)
        : null;
      return token && token.length > 0 ? token : null;
    } catch {
      return null;
    }
  }
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
  const fromStandard = request.cookies.get(name)?.value ?? null;
  if (fromStandard) return fromStandard;
  if (authProvider === "msal") {
    const fromSearch = request.cookies.get(cookiesKey.searchToken)?.value ?? null;
    if (fromSearch) return fromSearch;
  }
  return null;
}

/**
 * Server-side: read Bearer token from request (Authorization header or cookies).
 * Use this when a route can receive auth from either header (MSAL) or cookies (guest).
 */
export function getBearerTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const fromHeader =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (fromHeader) return fromHeader;
  return getAuthTokenFromRequest(request);
}

/** Server-side: true if request has auth (cookies or, for MSAL, Authorization header). */
export function hasAuthCookies(request: NextRequest): boolean {
  const names = getAuthCookieNamesForProxy();
  for (const name of names) {
    if (request.cookies.get(name)?.value) return true;
  }
  if (authProvider === "msal") {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ") && authHeader.slice(7).trim().length > 0) {
      return true;
    }
    if (request.cookies.get(cookiesKey.searchToken)?.value) return true;
  }
  return false;
}
