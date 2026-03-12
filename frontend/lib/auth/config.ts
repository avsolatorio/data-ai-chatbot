/**
 * Auth provider configuration. No MSAL imports — used by layout, proxy, api-client, auth-service.
 * NEXT_PUBLIC_AUTH_PROVIDER: "msal" | "user" | "guest" (default: "guest").
 * - msal: Azure AD sign-in only.
 * - user: Email/password sign-in + "Try as guest".
 * - guest: Login page shows only "Try as guest" (no username/password).
 */

import { cookiesKey } from "@/lib/constants";
import { getEnv } from "@/lib/env";

export type AuthProviderType = "guest" | "msal" | "user";

// Direct reference required: Next.js only inlines process.env.NEXT_PUBLIC_* when explicitly
// referenced. Spread ({ ...process.env }) does NOT trigger inlining, so client bundle would
// miss the value. Server uses getEnv() for validation; client needs this direct reference.
const AUTH_PROVIDER_ENV =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_AUTH_PROVIDER?.trim().toLowerCase() as
        | "guest"
        | "user"
        | "msal"
        | undefined) ?? getEnv().NEXT_PUBLIC_AUTH_PROVIDER
    : undefined;

/** Current auth mode: "msal" | "user" | "guest" (default). */
export const authProvider: AuthProviderType =
  AUTH_PROVIDER_ENV === "msal"
    ? "msal"
    : AUTH_PROVIDER_ENV === "user"
      ? "user"
      : "guest";

// Direct reference for client inlining (same pattern as authProvider).
const SKIP_LOGIN_PAGE_ENV =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_SKIP_LOGIN_PAGE?.trim().toLowerCase()
    : undefined;

/** When true, skip login page in guest/MSAL modes (redirect or trigger sign-in directly). Default: true. */
export const skipLoginPage: boolean =
  SKIP_LOGIN_PAGE_ENV === "true" ||
  SKIP_LOGIN_PAGE_ENV === "1" ||
  SKIP_LOGIN_PAGE_ENV === "yes"
    ? true
    : SKIP_LOGIN_PAGE_ENV === "false" ||
        SKIP_LOGIN_PAGE_ENV === "0" ||
        SKIP_LOGIN_PAGE_ENV === "no"
      ? false
      : (typeof process !== "undefined"
          ? getEnv().NEXT_PUBLIC_SKIP_LOGIN_PAGE ?? true
          : true);

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
