"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.canViewTokenUsage) {
          setCanView(true);
        }
      })
      .catch(() => {
        // Network error or unauthenticated — keep false.
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
