"use client";

import { Data360ClaimsProvider } from "@pcn-js/data360";
import { useClaimsManager } from "@pcn-js/ui";
import { useLayoutEffect, useRef } from "react";
import {
  compareCountriesExtractor,
  rankCountriesExtractor,
  summarizeDataExtractor,
  getDataExtractor,
} from "./aggregation-claim-extractors";

const DATA360_RANK_TOOL = "data360_rank_countries";
const DATA360_COMPARE_TOOL = "data360_compare_countries";
const DATA360_SUMMARIZE_TOOL = "data360_summarize_data";
const DATA360_GET_DATA_TOOL = "data360_get_data";

function AggregationExtractorRegistrar() {
  const manager = useClaimsManager();
  const registeredRef = useRef(false);

  useLayoutEffect(() => {
    if (!manager || registeredRef.current) return;

    // WARNING: While this is a render-time side effect, manager.registerExtractor
    // is inherently idempotent. It safely overwrites existing extractors for the given
    // tool names without accumulating duplicates. The registeredRef provides an extra layer
    // of safety but the underlying map assignment is safe.
    manager.registerExtractor(DATA360_RANK_TOOL, rankCountriesExtractor);
    manager.registerExtractor(DATA360_COMPARE_TOOL, compareCountriesExtractor);
    manager.registerExtractor(DATA360_SUMMARIZE_TOOL, summarizeDataExtractor);
    manager.registerExtractor(DATA360_GET_DATA_TOOL, getDataExtractor);
    registeredRef.current = true;
  }, [manager]);

  return null;
}

/**
 * Client-only wrapper for Data360ClaimsProvider so the layout (Server Component)
 * can use it without evaluating @pcn-js/data360 on the server (where createContext
 * is not available in RSC React).
 */
export function PcnProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <Data360ClaimsProvider>
      <AggregationExtractorRegistrar />
      {children}
    </Data360ClaimsProvider>
  );
}
