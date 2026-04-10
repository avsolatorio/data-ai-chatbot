/**
 * Data360 parent searchToken refresh (POST with credentials).
 * Single-flight: concurrent callers share one in-flight refresh.
 * If the response includes `token`, sets a readable `searchToken` cookie (non-HttpOnly)
 * so getAuthTokenFromDocument() can attach Authorization. HttpOnly-only responses must
 * be handled via same-origin Set-Cookie from a compatible endpoint.
 */

import { getAuthTokenFromDocument } from "@/lib/auth/cookies";
import { getBasePath } from "@/lib/config";
import { cookiesKey } from "@/lib/constants";
import { getEnv } from "@/lib/env";

const isProduction = process.env.NODE_ENV === "production";

type RefreshResponse = {
  success?: boolean;
  token?: string;
  message?: string;
  refreshed?: boolean;
};

let inflight: Promise<boolean> | null = null;

/** Same path resolution as getApiUrl for relative paths (avoids importing api-client). */
function toAbsoluteAppPath(path: string): string {
  const basePath = getBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (basePath && !normalized.startsWith(basePath)) {
    return `${basePath}${normalized}`;
  }
  return normalized;
}

/**
 * Resolved POST URL for searchToken refresh, or null when not configured.
 * Accepts absolute http(s) URLs or a path starting with `/` (e.g. `/api/auth/refresh-search-token`).
 */
export function resolveData360SearchTokenRefreshUrl(): string | null {
  const raw = getEnv().NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_URL?.trim();
  if (!raw) return null;
  if (raw.startsWith("https://") || raw.startsWith("http://")) return raw;
  if (raw.startsWith("/")) return toAbsoluteAppPath(raw);
  return null;
}

export function isData360SearchTokenRefreshConfigured(): boolean {
  return resolveData360SearchTokenRefreshUrl() !== null;
}

function setSearchTokenCookieFromJson(token: string): void {
  if (typeof document === "undefined") return;
  const secure = isProduction ? "; Secure" : "";
  const value = encodeURIComponent(token);
  // biome-ignore lint/suspicious/noDocumentCookie: Data360 parent may return token in JSON; readable searchToken is required for apiFetch Authorization
  document.cookie = `${cookiesKey.searchToken}=${value}; Path=/; SameSite=Lax${secure}`;
}

/**
 * POSTs to the configured refresh URL with credentials. Returns true when the response
 * indicates success and a Bearer token is available (from JSON `token` or existing cookie).
 */
export async function refreshSearchTokenIfConfigured(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  const url = resolveData360SearchTokenRefreshUrl();
  if (!url) return false;

  if (inflight) {
    return inflight;
  }

  const run = (async (): Promise<boolean> => {
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let data: RefreshResponse = {};
      try {
        data = (await res.json()) as RefreshResponse;
      } catch {
        return false;
      }

      if (typeof data.token === "string" && data.token.length > 0) {
        setSearchTokenCookieFromJson(data.token);
      }

      if (!data.success) {
        return false;
      }

      const bearer = getAuthTokenFromDocument();
      return Boolean(bearer && bearer.length > 0);
    } catch {
      return false;
    }
  })();

  inflight = run;
  void run.finally(() => {
    inflight = null;
  });

  return run;
}

/** Test-only: reset single-flight state. */
export function resetData360SearchTokenRefreshInflightForTests(): void {
  inflight = null;
}
