/**
 * Registry for MSAL token refresh. apiFetch uses this to trigger a silent refresh on 401.
 * MsalTokenRefresh registers the refresh function when it mounts inside MsalProvider.
 */

type MsalRefreshFn = () => Promise<boolean>;

let msalRefreshFn: MsalRefreshFn | null = null;

export function registerMsalRefresh(fn: MsalRefreshFn): void {
  msalRefreshFn = fn;
}

export function unregisterMsalRefresh(): void {
  msalRefreshFn = null;
}

export function getMsalRefresh(): MsalRefreshFn | null {
  return msalRefreshFn;
}
