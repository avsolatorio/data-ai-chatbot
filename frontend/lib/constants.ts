import { generateDummyPassword } from "./db/utils";

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

// Guest users have emails like: guest-{uuid}@anonymous.local
export const guestRegex = /^guest-.*@anonymous\.local$/;

export const DUMMY_PASSWORD = generateDummyPassword();

// Note: Authentication is always enabled. Guest users provide anonymous access.

/** Cookie names used by auth (guest JWT vs MSAL user impersonation token). */
export const cookiesKey = {
  authToken: "auth_token",
  userImpersonationToken: "UIT",
  /** Impersonation token from parent app when chat is embedded; checked before MSAL flow. */
  searchToken: "searchToken",
} as const;

/** SessionStorage keys used by MSAL and auth. */
export const sessionStorageKeys = {
  userData: "USER_DATA",
  msal: "MSAL_DATA",
  /** MSAL user impersonation token only; no PII. Required to be in session storage, not cookies. */
  msalUserImpersonationToken: "MSAL_UIT",
  /** Last X-Session-Version from server; used to force MSAL logout when deploy version changes. */
  sessionVersion: "SESSION_VERSION",
} as const;

/** Default timeout (ms) for auth proxy requests to FastAPI (cold start / DB / Docker). */
const DEFAULT_AUTH_PROXY_TIMEOUT_MS = 15_000;

/**
 * Timeout in ms for /api/auth/me and /api/auth/refresh when proxying to FastAPI.
 * Set AUTH_PROXY_TIMEOUT_MS in env to override (e.g. 20000 for slow backends).
 */
export function getAuthProxyTimeoutMs(): number {
  const raw = process.env.AUTH_PROXY_TIMEOUT_MS;
  if (raw === undefined || raw === "") return DEFAULT_AUTH_PROXY_TIMEOUT_MS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1000) return DEFAULT_AUTH_PROXY_TIMEOUT_MS;
  return n;
}
