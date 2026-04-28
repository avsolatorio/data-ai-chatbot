"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getAuthTokenFromDocument } from "@/lib/auth/cookies";

/**
 * Context that carries the resolved canViewTokenUsage flag for the current user.
 * Defaults to false so that token usage is hidden until confirmed.
 */
const TokenUsageVisibilityContext = createContext<boolean>(false);

export function TokenUsageVisibilityProvider({
  canViewTokenUsage: initialCanView,
  children,
}: {
  canViewTokenUsage: boolean;
  children: ReactNode;
}) {
  const [canView, setCanView] = useState(initialCanView);

  // For MSAL/data360 providers the server cannot resolve the user, so
  // initialCanView is always false. We self-fetch /api/auth/me on the client
  // after hydration to get the real canViewTokenUsage value.
  useEffect(() => {
    if (initialCanView) {
      // Already resolved server-side (guest/user auth); nothing to do.
      return;
    }
    let cancelled = false;
    const authToken = getAuthTokenFromDocument();
    const headers = new Headers();
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }
    fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
      headers,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.canViewTokenUsage) {
          setCanView(true);
        }
      })
      .catch((error) => {
        // Network error or unauthenticated — keep false.
        console.error(
          "Error fetching token usage visibility:",
          error instanceof Error ? error.message : String(error),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [initialCanView]);

  return (
    <TokenUsageVisibilityContext.Provider value={canView}>
      {children}
    </TokenUsageVisibilityContext.Provider>
  );
}

/** Returns true only when the current user is in the FEEDBACK_REVIEWER_EMAILS allowlist. */
export function useCanViewTokenUsage(): boolean {
  return useContext(TokenUsageVisibilityContext);
}
