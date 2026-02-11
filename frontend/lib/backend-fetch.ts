/**
 * Server-side fetch to the backend API. Wraps native fetch and returns a
 * consistent response shape (including getSetCookie for Set-Cookie handling).
 */

export type BackendFetchResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: {
    get: (name: string) => string | null;
    getSetCookie: () => string[];
  };
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

/**
 * Fetch the backend. Uses native fetch; response is adapted to BackendFetchResponse.
 */
export async function backendFetch(
  url: string,
  init?: RequestInit,
): Promise<BackendFetchResponse> {
  const res = await fetch(url, init);
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    headers: {
      get: (n) => res.headers.get(n),
      getSetCookie: () => res.headers.getSetCookie?.() ?? [],
    },
    json: () => res.json(),
    text: () => res.text(),
  };
}
