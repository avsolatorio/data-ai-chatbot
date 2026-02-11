/**
 * Base path utilities — single source of truth for NEXT_PUBLIC_BASE_PATH.
 *
 * When the app is mounted under a path (e.g. /data360-chat), use these helpers
 * so routes, redirects, cookies, and API URLs stay consistent. Normalization:
 * base path is always stored without trailing slash (e.g. "/data360-chat").
 *
 * Use in: middleware (proxy), API routes (guest), auth-service, api-client, config.
 * Safe for Edge and Node (no Node-only APIs).
 */

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/+$/, "");

/** Normalized base path (no trailing slash), or "" if app is at root. */
export function getBasePath(): string {
  return BASE_PATH;
}

/**
 * Strip base path from a full pathname to get the app-relative path.
 * Examples: "/data360-chat/chat" → "/chat", "/data360-chat" → "/"
 */
export function stripBasePath(pathname: string): string {
  if (!BASE_PATH) return pathname;
  if (pathname === BASE_PATH) return "/";
  if (pathname.startsWith(`${BASE_PATH}/`))
    return pathname.slice(BASE_PATH.length) || "/";
  return pathname;
}

/**
 * Prefix an app-relative path with the base path. Idempotent: if path
 * already starts with base path, returns it unchanged.
 * Examples: "/chat" → "/data360-chat/chat", "/data360-chat/chat" → "/data360-chat/chat"
 */
export function buildPath(path: string): string {
  if (!BASE_PATH) return path.startsWith("/") ? path : `/${path}`;
  const p = path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (p === BASE_PATH || p.startsWith(`${BASE_PATH}/`)) return p;
  return `${BASE_PATH}${p}`;
}

/**
 * Build a full URL (origin + path with base). Use for redirects and absolute links.
 * Path may already include the base path; it is normalized so the base is not doubled.
 */
export function buildFullUrl(origin: string, path: string): string {
  const appRelative = stripBasePath(path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`);
  const pathWithBase = buildPath(appRelative);
  const originClean = origin.replace(/\/+$/, "");
  return `${originClean}${pathWithBase}`;
}

/** Cookie Path value so cookies are sent for all routes under the app. */
export function getCookiePath(): string {
  return BASE_PATH ? `${BASE_PATH}/` : "/";
}

/**
 * Rewrite the Path attribute in a Set-Cookie header value to getCookiePath().
 * When the app is under a base path, this prevents cookies from being scoped
 * to a narrow path (e.g. /data360-chat/api/auth/) and avoids redirect loops.
 */
export function rewriteSetCookiePath(setCookieValue: string): string {
  if (!BASE_PATH) return setCookieValue;
  const pathAttr = `Path=${getCookiePath()}`;
  if (/\bPath\s*=/i.test(setCookieValue)) {
    return setCookieValue.replace(/\bPath\s*=[^;]*/i, pathAttr);
  }
  return setCookieValue.trimEnd().replace(/;?\s*$/, `; ${pathAttr}`);
}
