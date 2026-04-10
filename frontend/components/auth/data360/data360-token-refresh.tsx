"use client";

/**
 * Proactive Data360 searchToken refresh. Mirrors MsalTokenRefresh: interval + visibility.
 */

import { useEffect, useRef } from "react";
import {
  isData360SearchTokenRefreshConfigured,
  refreshSearchTokenIfConfigured,
} from "@/lib/auth/data360/data360-search-token-refresh";
import { getEnv } from "@/lib/env";

export function Data360TokenRefresh() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!isData360SearchTokenRefreshConfigured()) {
      return;
    }

    const intervalMs = getEnv().NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_INTERVAL_MS;

    const run = async () => {
      if (isRefreshingRef.current) return;
      try {
        isRefreshingRef.current = true;
        await refreshSearchTokenIfConfigured();
      } finally {
        isRefreshingRef.current = false;
      }
    };

    const initialTimeout = setTimeout(run, 60 * 1000);
    intervalRef.current = setInterval(run, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void run();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
