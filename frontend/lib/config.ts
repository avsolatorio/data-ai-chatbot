/**
 * Application configuration
 *
 * This file contains all configurable metadata and settings for the application.
 * Modify these values to customize your application's metadata.
 *
 * IMPORTANT: Client components import this module. Next.js only inlines process.env.NEXT_PUBLIC_*
 * when explicitly referenced (not via spread). Use direct process.env.X references here so
 * values are correctly inlined at build time for client bundles.
 */

import { getEnv } from "@/lib/env";

/** Application lifecycle status shown in the UI when set. */
export type ApplicationStatus = "pre-alpha" | "alpha" | "beta";

/** Feedback contact shown in the feedback pop-up. */
export type FeedbackContact = {
  label: string;
  url: string;
};

function getApplicationStatus(): ApplicationStatus | null {
  const v =
    process.env.NEXT_PUBLIC_APPLICATION_STATUS?.trim() ||
    getEnv().NEXT_PUBLIC_APPLICATION_STATUS;
  if (v && ["pre-alpha", "alpha", "beta"].includes(v))
    return v as ApplicationStatus;
  // Show banner in development when not set so you can verify placement
  if (process.env.NODE_ENV === "development") return "alpha";
  return null;
}

function getFeedbackContact(): FeedbackContact | null {
  const url =
    process.env.NEXT_PUBLIC_FEEDBACK_CONTACT_URL?.trim() ||
    getEnv().NEXT_PUBLIC_FEEDBACK_CONTACT_URL;
  const label =
    process.env.NEXT_PUBLIC_FEEDBACK_CONTACT_LABEL?.trim() ||
    getEnv().NEXT_PUBLIC_FEEDBACK_CONTACT_LABEL ||
    "Contact us for feedback";
  if (url && url.length > 0) {
    return { label: label.trim(), url: url.trim() };
  }
  return null;
}

/**
 * When artifact panel closes with no trigger message (e.g. opened by stream):
 * - "bottom": scroll main chat to latest message.
 * - "trigger": do not scroll (leave position as-is).
 * When there is a trigger message we always scroll to it; this flag does not apply.
 */
export type ArtifactScrollBehavior = "bottom" | "trigger";

function getArtifactScrollBehavior(): ArtifactScrollBehavior {
  const v =
    process.env.NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR?.trim() ||
    getEnv().NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR;
  return v === "trigger" ? "trigger" : "bottom";
}

function getShowReasoningPartType(): boolean {
  const v =
    process.env.NEXT_PUBLIC_SHOW_REASONING_PART_TYPE?.trim().toLowerCase();
  const fromEnv = getEnv().NEXT_PUBLIC_SHOW_REASONING_PART_TYPE;
  return v === "true" || v === "1" || v === "yes" || fromEnv === true;
}

/** When true, show image attach UI and allow pasted images. Default false. */
function getEnableImageUpload(): boolean {
  const v = process.env.NEXT_PUBLIC_ENABLE_IMAGE_UPLOAD?.trim().toLowerCase();
  const fromEnv = getEnv().NEXT_PUBLIC_ENABLE_IMAGE_UPLOAD;
  if (v === "false" || v === "0" || v === "no") {
    return false;
  }
  if (v === "true" || v === "1" || v === "yes") {
    return true;
  }
  return fromEnv;
}

/** When true, show share/visibility UI (public chat via link). Default false. */
function getEnableShareConversation(): boolean {
  const v =
    process.env.NEXT_PUBLIC_ENABLE_SHARE_CONVERSATION?.trim().toLowerCase();
  const fromEnv = getEnv().NEXT_PUBLIC_ENABLE_SHARE_CONVERSATION;
  if (v === "false" || v === "0" || v === "no") {
    return false;
  }
  if (v === "true" || v === "1" || v === "yes") {
    return true;
  }
  return fromEnv;
}

/** Base URL for Data360 indicator pages (Sources links from tool-data360_get_data). */
function getData360IndicatorBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_DATA360_INDICATOR_BASE_URL?.trim() ||
    getEnv().NEXT_PUBLIC_DATA360_INDICATOR_BASE_URL
  );
}

/** When true, all Data360 MCP tool panels start expanded. When false, only chart + get_data expand by default. */
export function getData360ToolDefaultOpen(): boolean {
  const v =
    process.env.NEXT_PUBLIC_DATA360_TOOL_DEFAULT_OPEN?.trim().toLowerCase();
  const fromEnv = getEnv().NEXT_PUBLIC_DATA360_TOOL_DEFAULT_OPEN;
  if (v === "false" || v === "0" || v === "no") {
    return false;
  }
  if (v === "true" || v === "1" || v === "yes") {
    return true;
  }
  return fromEnv;
}

/** Same-origin path or absolute URL for POST search-token refresh. Empty disables periodic refresh. */
function getSearchTokenRefreshUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SEARCH_TOKEN_REFRESH_URL?.trim() ||
    getEnv().NEXT_PUBLIC_SEARCH_TOKEN_REFRESH_URL ||
    ""
  );
}

/** Interval between refresh POSTs when URL is set. Default 50 minutes. */
function getSearchTokenRefreshIntervalMs(): number {
  const v = process.env.NEXT_PUBLIC_SEARCH_TOKEN_REFRESH_INTERVAL_MS?.trim();
  if (v) {
    const n = Number.parseInt(v, 10);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return getEnv().NEXT_PUBLIC_SEARCH_TOKEN_REFRESH_INTERVAL_MS;
}

/** When set (e.g. "/app"), the app is served under that path. Must match next.config basePath. Trailing slash is stripped. */
export function getBasePath(): string {
  const v =
    process.env.NEXT_PUBLIC_BASE_PATH?.trim() ||
    getEnv().NEXT_PUBLIC_BASE_PATH ||
    "";
  return v.replace(/\/+$/, "");
}

/**
 * Public URL for the current page. Use for returnTo in auth redirects when behind a proxy
 * (window.location.href can expose the internal container hostname).
 * When NEXT_PUBLIC_APP_URL is set, builds URL from it + current path; else uses window.location.href.
 */
export function getPublicReturnUrl(): string {
  if (typeof window === "undefined") return "";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    getEnv().NEXT_PUBLIC_APP_URL ||
    "";
  if (!appUrl) return window.location.href;
  const basePath = getBasePath();
  const pathname = window.location.pathname;
  const rest =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  const base = appUrl.replace(/\/+$/, "");
  const path = rest.startsWith("/") ? rest : `/${rest}`;
  return `${base}${path}${window.location.search}${window.location.hash}`;
}

export const appConfig = {
  /**
   * When set (e.g. "alpha", "beta"), a status badge is shown so users know the app is not stable.
   * Set via NEXT_PUBLIC_APPLICATION_STATUS.
   */
  applicationStatus: getApplicationStatus(),

  /** Base path for subpath deployment (e.g. "/app"). Empty when served at root. */
  basePath: getBasePath(),

  /**
   * When set, a "Give feedback" entry point and pop-up are shown.
   * Set via NEXT_PUBLIC_FEEDBACK_CONTACT_URL and optionally NEXT_PUBLIC_FEEDBACK_CONTACT_LABEL.
   */
  feedbackContact: getFeedbackContact(),

  metadata: {
    /**
     * The base URL for your application.
     * Used for generating absolute URLs in metadata.
     *
     * Examples:
     * - Production: "https://yourdomain.com"
     * - Development: "http://localhost:3000"
     * - Vercel: "https://your-app.vercel.app"
     */
    baseUrl:
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      getEnv().NEXT_PUBLIC_APP_URL ||
      "https://data360chat.worldbank.org",

    /**
     * The title of your application.
     * This appears in:
     * - Browser tab title
     * - Search engine results
     * - Social media shares (if not overridden)
     */
    title: "Data360 Chat",

    /**
     * A brief description of your application.
     * This appears in:
     * - Search engine results
     * - Social media shares (if not overridden)
     * - Browser bookmarks
     */
    description:
      "Data360 Chat is a chatbot that uses the Data360 MCP tools to answer questions about the Data360 dataset.",
  },
  /**
   * Application display name shown in the UI.
   * This appears in:
   * - Sidebar header
   * - Navigation elements
   * - Other UI components that display the app name
   */
  sidebar: {
    appName: "Data360 Chat",
  },

  /**
   * When artifact closes with no trigger message: "bottom" scrolls chat to latest; "trigger" leaves scroll as-is.
   * Set via NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR.
   */
  artifactScrollBehavior: getArtifactScrollBehavior(),

  /**
   * When true, show the part type (e.g. "text", "tool-xyz") beside each step in the Reasoning block.
   * Default false. Set via NEXT_PUBLIC_SHOW_REASONING_PART_TYPE=true.
   */
  showReasoningPartType: getShowReasoningPartType(),

  /**
   * When true, image upload (paperclip, paste) is enabled. Default false.
   * Set via NEXT_PUBLIC_ENABLE_IMAGE_UPLOAD=true.
   */
  enableImageUpload: getEnableImageUpload(),

  /**
   * When true, users can set chats to public (sidebar Share menu and header visibility). Default false.
   * Set via NEXT_PUBLIC_ENABLE_SHARE_CONVERSATION=true. Align ENABLE_SHARE_CONVERSATION on the API.
   */
  enableShareConversation: getEnableShareConversation(),

  /**
   * Base URL for Data360 indicator source links (no trailing slash required).
   * Default production Data360. Set via NEXT_PUBLIC_DATA360_INDICATOR_BASE_URL.
   */
  data360IndicatorBaseUrl: getData360IndicatorBaseUrl(),

  /**
   * When true, all Data360 tool panels start expanded.
   * When false (default), only chart + get_data expand; others stay collapsed.
   * Set via NEXT_PUBLIC_DATA360_TOOL_DEFAULT_OPEN.
   */
  data360ToolDefaultOpen: getData360ToolDefaultOpen(),

  /**
   * POST target for periodic search-token refresh (credentials: include). Empty disables.
   * Client runs only when NEXT_PUBLIC_AUTH_PROVIDER=data360. Set via NEXT_PUBLIC_SEARCH_TOKEN_REFRESH_URL.
   */
  searchTokenRefreshUrl: getSearchTokenRefreshUrl(),

  /**
   * Milliseconds between refresh POSTs (data360 mode only). Default 50 minutes. NEXT_PUBLIC_SEARCH_TOKEN_REFRESH_INTERVAL_MS.
   */
  searchTokenRefreshIntervalMs: getSearchTokenRefreshIntervalMs(),
};
