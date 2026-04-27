"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Context that carries the resolved canViewTokenUsage flag for the current user.
 * Defaults to false so that token usage is hidden until the user is resolved and
 * confirmed to be in the FEEDBACK_REVIEWER_EMAILS allowlist.
 */
const TokenUsageVisibilityContext = createContext<boolean>(false);

export function TokenUsageVisibilityProvider({
  canViewTokenUsage,
  children,
}: {
  canViewTokenUsage: boolean;
  children: ReactNode;
}) {
  return (
    <TokenUsageVisibilityContext.Provider value={canViewTokenUsage}>
      {children}
    </TokenUsageVisibilityContext.Provider>
  );
}

/** Returns true only when the current user is in the FEEDBACK_REVIEWER_EMAILS allowlist. */
export function useCanViewTokenUsage(): boolean {
  return useContext(TokenUsageVisibilityContext);
}
