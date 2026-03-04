"use client";

import { useEffect, useRef } from "react";
import { getApiUrl } from "@/lib/api-client";
import { authProvider } from "@/lib/auth/config";

/**
 * Hook to automatically refresh JWT tokens before they expire (guest auth only).
 *
 * This implements proactive token refresh to prevent users from being logged out.
 * Tokens are refreshed every 25 minutes (for 30-minute tokens) to ensure
 * seamless authentication without interruption.
 *
 * The refresh happens by calling /api/auth/refresh (then /api/auth/me on 401),
 * which uses cookies. For MSAL, tokens live in session storage and refresh is
 * handled by the MSAL SDK; this hook does nothing when authProvider === "msal".
 */
export function useAutoRefreshToken() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    // MSAL: token is in session storage; refresh is handled by MSAL SDK.
    // This hook only sends cookies, so it would always get 401 for MSAL.
    if (authProvider === "msal") {
      return;
    }

    /**
     * Refresh token proactively to prevent expiration.
     *
     * Uses /api/auth/refresh which:
     * - Refreshes valid tokens proactively (before expiration)
     * - Can restore from session cookies if token expired (via get_current_user dependency)
     * - Issues new JWT tokens via Set-Cookie headers
     * - Revokes old tokens for security
     *
     * Falls back to /api/auth/me if refresh fails (handles edge cases).
     */
    const refreshToken = async () => {
      // Prevent concurrent refresh attempts
      if (isRefreshingRef.current) {
        return;
      }

      try {
        isRefreshingRef.current = true;

        // Try the dedicated refresh endpoint first (designed for proactive refresh)
        // This endpoint can also restore from session cookies via get_current_user dependency
        let response = await fetch(getApiUrl("/api/auth/refresh"), {
          method: "POST",
          credentials: "include", // Important: include cookies
          cache: "no-store",
        });

        // If refresh fails (e.g., token expired and no session cookies), try /api/auth/me
        // This handles edge cases where restoration might work via /api/auth/me
        if (!response.ok && response.status === 401) {
          response = await fetch(getApiUrl("/api/auth/me"), {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          });
        }

        if (!response.ok) {
          // If both fail (e.g., user logged out, no session cookies), clear interval
          if (response.status === 401 && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Silently fail - user will be handled by normal auth flow
          return;
        }

        // Token refresh/restoration successful
        // Set-Cookie headers are automatically handled by browser
        // No need to do anything - cookies are updated automatically
      } catch (error) {
        // Silently handle errors - don't disrupt user experience
        // Network errors, etc. will be handled by normal auth flow
        console.debug("Token refresh error (non-critical):", error);
      } finally {
        isRefreshingRef.current = false;
      }
    };

    // Refresh token every 25 minutes (5 minutes before 30-minute expiration)
    // This ensures tokens are refreshed before they expire
    const REFRESH_INTERVAL_MS = 25 * 60 * 1000; // 25 minutes

    // Initial refresh after a short delay (to avoid immediate refresh on page load)
    const initialTimeout = setTimeout(() => {
      refreshToken();
    }, 60 * 1000); // Wait 1 minute after page load

    // Set up periodic refresh
    intervalRef.current = setInterval(() => {
      refreshToken();
    }, REFRESH_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Run once on mount
}
