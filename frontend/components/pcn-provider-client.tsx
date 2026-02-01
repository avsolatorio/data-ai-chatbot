"use client";

import { Data360ClaimsProvider } from "@pcn/data360";

/**
 * Client-only wrapper for Data360ClaimsProvider so the layout (Server Component)
 * can use it without evaluating @pcn/data360 on the server (where createContext
 * is not available in RSC React).
 */
export function PcnProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Data360ClaimsProvider>{children}</Data360ClaimsProvider>;
}
