/**
 * Auth provider configuration. No MSAL imports — used by layout, proxy, api-client, auth-service.
 * NEXT_PUBLIC_AUTH_PROVIDER: "msal" | "user" | "guest" (default: "guest").
 * - msal: Azure AD sign-in only.
 * - user: Email/password sign-in + "Try as guest".
 * - guest: Login page shows only "Try as guest" (no username/password).
 */

import { cookiesKey } from "@/lib/constants";

export type AuthProviderType = "guest" | "msal" | "user";

const AUTH_PROVIDER_ENV =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_AUTH_PROVIDER?.trim().toLowerCase() as AuthProviderType | undefined)
    : undefined;

/** Current auth mode: "msal" | "user" | "guest" (default). */
export const authProvider: AuthProviderType =
  AUTH_PROVIDER_ENV === "msal"
    ? "msal"
    : AUTH_PROVIDER_ENV === "user"
      ? "user"
      : "guest";

/** Cookie name used for Bearer token in API requests (auth_token for guest, UIT for MSAL). */
export function getBearerTokenCookieName(): string {
  return authProvider === "msal" ? cookiesKey.userImpersonationToken : cookiesKey.authToken;
}

/** Cookie names that indicate an authenticated request (used by proxy). MSAL uses session storage + Authorization header only; no auth cookies. */
export function getAuthCookieNamesForProxy(): string[] {
  if (authProvider === "msal") {
    return [];
  }
  return [
    cookiesKey.authToken,
    "guest_session_id",
    "user_session_id",
  ];
}
