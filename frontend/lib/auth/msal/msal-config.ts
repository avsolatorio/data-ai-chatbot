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
import { cookiesKey, sessionStorageKeys } from "@/lib/constants";

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
    cacheLocation: "localStorage",
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
 * Acquire user impersonation token and store in cookie + sessionStorage.
 * Used by the MSAL provider after login. On failure, triggers login redirect.
 */
export async function fetchUserImpersonationToken(
  msalInstance: IPublicClientApplication,
  account?: AccountInfo | null,
): Promise<boolean> {
  const activeAccount = account ?? msalInstance.getActiveAccount();
  if (!activeAccount) {
    console.warn("[MSAL] fetchUserImpersonationToken: no active account");
    throw new Error(
      "No active account. Verify a user has been signed in and setActiveAccount has been called.",
    );
  }

  const scopes = userImpersonationScope ? [userImpersonationScope] : loginRequest.scopes;
  console.info("[MSAL] acquireTokenSilent for account:", activeAccount.username, "scopes:", scopes);

  try {
    const response = await msalInstance.acquireTokenSilent({
      authority,
      scopes,
      account: activeAccount,
    });
    console.info("[MSAL] User impersonation token response:", response);

    const accessToken = response?.accessToken ?? "";
    const hasToken = accessToken.length > 0;
    console.info("[MSAL] acquireTokenSilent success; token length:", accessToken.length, "expiresOn:", response?.expiresOn ?? null);

    const expiryTime = new Date();
    expiryTime.setTime(expiryTime.getTime() + 24 * 60 * 60 * 1000); // 1 day

    if (typeof document !== "undefined") {
      document.cookie = `${cookiesKey.userImpersonationToken}=${accessToken}; expires=${expiryTime.toUTCString()}; SameSite=Lax; path=/;`;
      console.info("[MSAL] cookie set:", cookiesKey.userImpersonationToken, "length:", hasToken ? accessToken.length : 0);
    }

    if (typeof sessionStorage !== "undefined") {
      const userData = {
        name: response.account?.name ?? "",
        email: response.account?.username ?? "",
      };
      sessionStorage.setItem(sessionStorageKeys.userData, JSON.stringify(userData));
      console.info("[MSAL] sessionStorage userData:", userData);
    }

    return true;
  } catch (e) {
    console.warn("[MSAL] acquireTokenSilent failed:", e instanceof Error ? e.message : String(e), "; triggering loginRedirect");
    msalInstance.loginRedirect(loginRequest);
    return false;
  }
}
