/**
 * Periodic POST to a search-token refresh endpoint (same-origin path or absolute URL).
 * Uses credentials: "include" so session cookies are sent; server may set Set-Cookie on response.
 */

const MIN_INTERVAL_MS = 1000;

export type SearchTokenRefreshResponse = {
  success?: boolean;
  token?: string;
  message?: string;
  refreshed?: boolean;
};

export async function postRefreshSearchToken(
  endpoint: string,
): Promise<SearchTokenRefreshResponse | null> {
  const url = endpoint.trim();
  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    return null;
  }

  try {
    return (await response.json()) as SearchTokenRefreshResponse;
  } catch {
    return null;
  }
}

/**
 * Runs an immediate refresh, then repeats every intervalMs. Returns a disposer.
 * No-op when intervalMs is below MIN_INTERVAL_MS.
 */
export function startSearchTokenRefreshLoop(
  endpoint: string,
  intervalMs: number,
): () => void {
  const url = endpoint.trim();
  if (!url || intervalMs < MIN_INTERVAL_MS) {
    return () => {};
  }

  let cancelled = false;
  const tick = () => {
    if (cancelled) {
      return;
    }
    void postRefreshSearchToken(url);
  };

  tick();
  const id = window.setInterval(tick, intervalMs);

  return () => {
    cancelled = true;
    window.clearInterval(id);
  };
}
