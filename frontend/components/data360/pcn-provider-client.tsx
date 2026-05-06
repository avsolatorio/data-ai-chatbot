"use client";

import { useLayoutEffect } from "react";
import { Data360ClaimsProvider } from "@pcn-js/data360";
import { useClaimsManager } from "@pcn-js/ui";
import {
  DATA360_RANK_COUNTRIES_TOOL,
  DATA360_COMPARE_COUNTRIES_TOOL,
  rankCountriesExtractor,
  compareCountriesExtractor,
} from "./aggregation-claim-extractors";

/**
 * Registers custom ToolResultExtractors for rank_countries and compare_countries
 * on the ClaimsManager so IngestToolOutput + ClaimMark can resolve claim_ids.
 * Runs once on mount inside Data360ClaimsProvider.
 */
function AggregationExtractorRegistrar() {
  const manager = useClaimsManager();
  // useLayoutEffect (not useEffect) so registration fires before IngestToolOutput's
  // useEffect calls manager.ingest() — effects run bottom-up, so a deeper
  // IngestToolOutput's useEffect would otherwise beat a parent's useEffect.
  useLayoutEffect(() => {
    if (!manager) return;
    manager.registerExtractor(DATA360_RANK_COUNTRIES_TOOL, rankCountriesExtractor);
    manager.registerExtractor(DATA360_COMPARE_COUNTRIES_TOOL, compareCountriesExtractor);
  }, [manager]);
  return null;
}

/**
 * Client-only wrapper for Data360ClaimsProvider so the layout (Server Component)
 * can use it without evaluating @pcn-js/data360 on the server (where createContext
 * is not available in RSC React).
 */
export function PcnProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Data360ClaimsProvider>
      <AggregationExtractorRegistrar />
      {children}
    </Data360ClaimsProvider>
  );
}
