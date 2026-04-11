"use client";

import { useEffect } from "react";
import { authProvider } from "@/lib/auth/config";
import { appConfig } from "@/lib/config";
import { startSearchTokenRefreshLoop } from "@/lib/search-token-refresh";

/**
 * Mount once in the root layout: periodically POSTs to the configured refresh endpoint
 * when NEXT_PUBLIC_AUTH_PROVIDER=data360 and NEXT_PUBLIC_SEARCH_TOKEN_REFRESH_URL is non-empty.
 */
export function SearchTokenRefreshClient() {
  useEffect(() => {
    if (authProvider !== "data360") {
      return;
    }
    const url = appConfig.searchTokenRefreshUrl.trim();
    if (!url) {
      return;
    }
    const intervalMs = appConfig.searchTokenRefreshIntervalMs;
    return startSearchTokenRefreshLoop(url, intervalMs);
  }, []);

  return null;
}
