"use client";

import { useClaimsManager } from "@pcn/ui";
import { useEffect } from "react";

declare global {
  interface Window {
    __PCN_MANAGER__?: ReturnType<typeof useClaimsManager>;
  }
}

/**
 * In development, exposes the PCN ClaimsManager on window so you can inspect
 * it in the browser console.
 *
 * In the console:
 *   __PCN_MANAGER__.getAll()   // current claims map { [claim_id]: claim }
 *   __PCN_MANAGER__.get(id)    // single claim by id
 */
export function PcnManagerDebug() {
  const manager = useClaimsManager();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (manager) {
      window.__PCN_MANAGER__ = manager;
    }
    return () => {
      delete window.__PCN_MANAGER__;
    };
  }, [manager]);

  return null;
}
