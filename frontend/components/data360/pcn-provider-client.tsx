"use client";

import { Data360ClaimsProvider } from "@pcn-js/data360";
import { useClaimsManager } from "@pcn-js/ui";
import {
  rankCountriesExtractor,
  compareCountriesExtractor,
  summarizeDataExtractor,
} from "./aggregation-claim-extractors";

const DATA360_RANK_TOOL = "data360_rank_countries";
const DATA360_COMPARE_TOOL = "data360_compare_countries";
const DATA360_SUMMARIZE_TOOL = "data360_summarize_data";

/**
 * Registers aggregation extractors synchronously during render.
 *
 * Why during render and not in useEffect / useLayoutEffect?
 * IngestToolOutput (in message.tsx) uses useEffect to call manager.ingest().
 * React runs effects bottom-up after all renders are committed. If we used
 * useEffect or useLayoutEffect here too, the ordering vs. IngestToolOutput
 * would be non-deterministic. Registering synchronously during this
 * component's render (which happens before message.tsx renders) guarantees
 * the extractor is present before any effect fires.
 *
 * registerExtractor is idempotent — safe to call on every render.
 */
function AggregationExtractorRegistrar() {
  const manager = useClaimsManager();
  if (manager) {
    manager.registerExtractor(DATA360_RANK_TOOL, rankCountriesExtractor);
    manager.registerExtractor(DATA360_COMPARE_TOOL, compareCountriesExtractor);
    manager.registerExtractor(DATA360_SUMMARIZE_TOOL, summarizeDataExtractor);
  }
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
