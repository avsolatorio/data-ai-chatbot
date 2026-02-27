/**
 * MSAL configuration and user-impersonation token. Only loaded when AUTH_PROVIDER=msal.
 * Configure via env: NEXT_PUBLIC_MSAL_AUTHORITY, NEXT_PUBLIC_MSAL_CLIENT_ID,
 * NEXT_PUBLIC_MSAL_REDIRECT_URI, NEXT_PUBLIC_MSAL_USER_IMPERSONATION_SCOPE (optional).
 */

import type {
  AccountInfo,
  Configuration,
  IPublicClientApplication,
} from "@azure/msal-browser";
import { LogLevel } from "@azure/msal-browser";

const isDev =
  typeof process !== "undefined" && process.env.NODE_ENV === "development";

/** Log only in development to avoid noisy console in production. Exported for use in provider. */
export function devLog(level: "info" | "warn", ...args: unknown[]): void {
  if (!isDev) return;
  if (level === "info") {
    console.info(...args);
  } else {
    console.warn(...args);
  }
}

/** Path for setting the impersonation token via HttpOnly cookie (server-side). */
const MSAL_SET_TOKEN_PATH = "/api/auth/msal/set-token";

export const loginRequest = {
  scopes: ["User.Read", "openid", "profile"],
};

const authority =
  process.env.NEXT_PUBLIC_MSAL_AUTHORITY?.trim() || "https://login.microsoftonline.com/common";
const clientId = process.env.NEXT_PUBLIC_MSAL_CLIENT_ID?.trim() || "";
const redirectUriRaw = process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI?.trim() || "";
const redirectUri =
  redirectUriRaw || (typeof window !== "undefined" ? window.location.origin : "");
const userImpersonationScope = process.env.NEXT_PUBLIC_MSAL_USER_IMPERSONATION_SCOPE?.trim();

export const msalConfig: Configuration = {
  auth: {
    authority,
    clientId,
    redirectUri,
  },
  cache: {
    // sessionStorage: tokens cleared when tab closes, reducing XSS exposure window (vs localStorage).
    cacheLocation: "sessionStorage",
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback() {
        // Suppress MSAL console output by default; set logLevel to Info/Verbose for debugging
      },
    },
  },
};

/**
 * Acquire user impersonation token and store in cookie.
 * User display name/email are available from MSAL account in memory (not stored in sessionStorage to avoid XSS-exposed PII).
 * Used by the MSAL provider after login. On failure, triggers login redirect.
 */
export async function fetchUserImpersonationToken(
  msalInstance: IPublicClientApplication,
  account?: AccountInfo | null,
): Promise<boolean> {
  const activeAccount = account ?? msalInstance.getActiveAccount();
  if (!activeAccount) {
    devLog("warn", "[MSAL] fetchUserImpersonationToken: no active account");
    throw new Error(
      "No active account. Verify a user has been signed in and setActiveAccount has been called.",
    );
  }

  const scopes = userImpersonationScope ? [userImpersonationScope] : loginRequest.scopes;
  devLog("info", "[MSAL] acquireTokenSilent for account:", activeAccount.username, "scopes:", scopes);

  try {
    const response = await msalInstance.acquireTokenSilent({
      authority,
      scopes,
      account: activeAccount,
    });
    devLog("info", "[MSAL] User impersonation token response:", response);

    const accessToken = response?.accessToken ?? "";
    const hasToken = accessToken.length > 0;
    devLog("info", "[MSAL] acquireTokenSilent success; token length:", accessToken.length, "expiresOn:", response?.expiresOn ?? null);

    if (typeof window !== "undefined") {
      const res = await fetch(MSAL_SET_TOKEN_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken }),
        credentials: "include",
      });
      if (!res.ok) {
        devLog("warn", "[MSAL] set-token API failed:", res.status);
        return false;
      }
      devLog("info", "[MSAL] HttpOnly cookie set via API; token length:", hasToken ? accessToken.length : 0);
    }

    return true;
  } catch (e) {
    devLog("warn", "[MSAL] acquireTokenSilent failed:", e instanceof Error ? e.message : String(e), "; triggering loginRedirect");
    msalInstance.loginRedirect(loginRequest);
    return false;
  }
}
