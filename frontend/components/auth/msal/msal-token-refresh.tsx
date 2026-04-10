"use client";

/**
 * Proactive MSAL token refresh. Runs inside MsalProvider when user is authenticated.
 * Refreshes the user impersonation token every 50 minutes (Azure AD access tokens ~1h).
 * Also registers the refresh function for 401-triggered retry in apiFetch.
 */

import { useMsal } from "@azure/msal-react";
import { useEffect, useRef } from "react";
import {
  devLog,
  fetchUserImpersonationToken,
} from "@/lib/auth/msal/msal-config";
import {
  getMsalRefresh,
  registerMsalRefresh,
  unregisterMsalRefresh,
} from "@/lib/auth/msal/msal-refresh-registry";

/** 50 minutes - Azure AD access tokens typically expire in 1 hour */
const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

export function MsalTokenRefresh() {
  const { instance, accounts } = useMsal();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const activeAccount = accounts[0] ?? instance.getActiveAccount();
    if (!activeAccount) {
      return;
    }

    const doRefresh = async (): Promise<boolean> => {
      if (isRefreshingRef.current) return true;
      try {
        isRefreshingRef.current = true;
        const ok = await fetchUserImpersonationToken(instance, activeAccount);
        return ok;
      } finally {
        isRefreshingRef.current = false;
      }
    };

    registerMsalRefresh(doRefresh);

    const refreshToken = async () => {
      try {
        await doRefresh();
      } catch {
        devLog("warn", "[MSAL] Proactive token refresh failed");
      }
    };

    const initialTimeout = setTimeout(refreshToken, 60 * 1000);
    intervalRef.current = setInterval(refreshToken, REFRESH_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (getMsalRefresh() === doRefresh) {
        unregisterMsalRefresh();
      }
    };
  }, [instance, accounts]);

  return null;
}
