/**
 * Auth provider configuration. No MSAL imports — used by layout, proxy, api-client, auth-service.
 * Toggle MSAL via NEXT_PUBLIC_AUTH_PROVIDER=msal (default: guest).
 */

import { cookiesKey } from "@/lib/constants";

export type AuthProviderType = "guest" | "msal";

const AUTH_PROVIDER_ENV =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_AUTH_PROVIDER?.trim().toLowerCase() as AuthProviderType | undefined)
    : undefined;

/** Current auth mode: "guest" (default) or "msal". */
export const authProvider: AuthProviderType =
  AUTH_PROVIDER_ENV === "msal" ? "msal" : "guest";

/** Cookie name used for Bearer token in API requests (auth_token for guest, UIT for MSAL). */
export function getBearerTokenCookieName(): string {
  return authProvider === "msal" ? cookiesKey.userImpersonationToken : cookiesKey.authToken;
}

/** Cookie names that indicate an authenticated request (used by proxy). */
export function getAuthCookieNamesForProxy(): string[] {
  if (authProvider === "msal") {
    return [cookiesKey.userImpersonationToken];
  }
  return [
    cookiesKey.authToken,
    "guest_session_id",
    "user_session_id",
  ];
}
