"use client";

import { ClaimsManager } from "@pcn-js/core";
import { ClaimsProvider } from "@pcn-js/ui";
import {
  compareCountriesExtractor,
  rankCountriesExtractor,
  summarizeDataExtractor,
  getDataExtractor,
} from "./aggregation-claim-extractors";

// Pre-register all extractors at module initialisation time — synchronously,
// before any React render occurs.  This ensures that IngestToolOutput can
// resolve claims from *all* aggregation tools (rank, compare, summarize,
// get_data) even on page refresh, when tool parts arrive from the DB before
// any useLayoutEffect has a chance to fire.
const claimsManager = new ClaimsManager();
claimsManager.registerExtractor("data360_rank_countries", rankCountriesExtractor);
claimsManager.registerExtractor("data360_compare_countries", compareCountriesExtractor);
claimsManager.registerExtractor("data360_summarize_data", summarizeDataExtractor);
claimsManager.registerExtractor("data360_get_data", getDataExtractor);

/**
 * Client-only wrapper that provides a shared ClaimsManager pre-populated with
 * all aggregation-tool extractors so that ClaimMark components can verify
 * numbers immediately on first paint — including after a page refresh when
 * tool parts are already available from the DB before useLayoutEffect fires.
 */
export function PcnProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <ClaimsProvider manager={claimsManager}>
      {children}
    </ClaimsProvider>
  );
}
