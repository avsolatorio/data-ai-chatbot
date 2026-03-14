/**
 * Environment variable schema with Zod.
 * Validates types, provides defaults, documents each var.
 * Server-only vars are validated only when typeof window === "undefined".
 */

import { z } from "zod";

/** Parse "true" | "1" | "yes" as true, "false" | "0" | "no" as false, else undefined. */
const booleanEnv = z
  .string()
  .optional()
  .transform((v) => {
    const s = v?.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no") return false;
    return undefined;
  });

/** Optional URL; empty string becomes undefined. */
const optionalUrl = z
  .string()
  .optional()
  .transform((v) => {
    const s = v?.trim();
    if (!s) return undefined;
    try {
      new URL(s);
      return s;
    } catch {
      return undefined;
    }
  });

/** Optional non-empty string. */
const optionalString = z
  .string()
  .optional()
  .transform((v) => v?.trim() || undefined);

/** Environment name for presets. */
export const environmentNameSchema = z.enum(["dev", "qa", "uat", "prod"]);

export type EnvironmentName = z.infer<typeof environmentNameSchema>;

/** Application status for UI banner. */
export const applicationStatusSchema = z.enum(["pre-alpha", "alpha", "beta"]);

/** Auth provider type. */
export const authProviderSchema = z.enum(["guest", "user", "msal"]);

/** Artifact scroll behavior. */
export const artifactScrollBehaviorSchema = z.enum(["bottom", "trigger"]);

/**
 * Raw env schema. Accepts process.env input; transforms to typed values.
 * Use parseEnv() which merges with presets before validation.
 */
const rawEnvSchema = z.object({
  // --- Environment identifier ---
  NEXT_PUBLIC_APP_ENV: optionalString.transform((v) => {
    const s = v?.trim().toLowerCase();
    if (s && ["dev", "qa", "uat", "prod"].includes(s)) return s as EnvironmentName;
    return undefined;
  }),

  // --- API URLs (server + client) ---
  SERVER_API_URL: optionalString.describe("Server-side API URL; preferred over NEXT_PUBLIC_API_URL for server routes"),
  NEXT_PUBLIC_API_URL: optionalString.describe("FastAPI backend URL; used when SERVER_API_URL unset"),
  NEXT_PUBLIC_BASE_URL: optionalString.describe("Base URL for the app (e.g. http://localhost:3001)"),
  NEXT_PUBLIC_APP_URL: optionalString.describe("Public app URL for redirects and metadata"),

  // --- Base path ---
  NEXT_PUBLIC_BASE_PATH: optionalString.describe("Subpath deployment (e.g. /app); must match next.config basePath"),

  // --- Auth ---
  NEXT_PUBLIC_AUTH_PROVIDER: optionalString.transform((v) => {
    const s = v?.trim().toLowerCase();
    if (s && ["guest", "user", "msal"].includes(s)) return s as "guest" | "user" | "msal";
    return undefined;
  }),
  NEXT_PUBLIC_SKIP_LOGIN_PAGE: booleanEnv.describe(
    "When true, skip login page in guest/MSAL modes (redirect or trigger sign-in directly). Default: true.",
  ),
  NEXT_PUBLIC_MSAL_CLIENT_ID: optionalString.describe("Azure AD app (client) ID"),
  NEXT_PUBLIC_MSAL_REDIRECT_URI: optionalString.describe("MSAL redirect URI; must match Azure AD app registration"),
  NEXT_PUBLIC_MSAL_AUTHORITY: optionalString.describe("MSAL authority URL (e.g. https://login.microsoftonline.com/<tenant>)"),
  AUTH_PROXY_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : undefined)),

  // --- Internal API secret (server-only) ---
  INTERNAL_API_SECRET: optionalString.describe("Secret for FastAPI → Next.js internal requests"),

  // --- Database (deprecated: frontend no longer connects to DB; backend owns DB) ---
  POSTGRES_URL: optionalString.describe(
    "Deprecated. Frontend no longer uses DB. Kept for backward compatibility only.",
  ),

  // --- Feature flags / UI ---
  NEXT_PUBLIC_APPLICATION_STATUS: optionalString.transform((v) => {
    if (v === "pre-alpha" || v === "alpha" || v === "beta") return v;
    return undefined;
  }),
  NEXT_PUBLIC_FEEDBACK_CONTACT_URL: optionalUrl.describe("Feedback form redirect URL"),
  NEXT_PUBLIC_FEEDBACK_CONTACT_LABEL: optionalString.describe("Feedback button label"),
  NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR: optionalString.transform((v) => {
    if (v === "trigger" || v === "bottom") return v;
    return undefined;
  }),
  NEXT_PUBLIC_SHOW_REASONING_PART_TYPE: booleanEnv.describe("Show part type in reasoning stepper"),

  // --- Data header ---
  NEXT_PUBLIC_DATA_HEADER_ENABLED: booleanEnv.describe("Enable World Bank data header"),

  // --- Maintenance ---
  MAINTENANCE_MODE: booleanEnv.describe("Redirect to maintenance page when true"),

  // --- CSP ---
  CSP_ENABLED: booleanEnv.describe("Enable Content-Security-Policy headers"),
  CSP_REPORT_ENABLED: booleanEnv.describe("Enable CSP violation reporting"),

  // --- Vega / charts ---
  NEXT_PUBLIC_VEGA_CUSTOM_THEME_URL: optionalUrl.describe("Custom Vega theme JSON URL"),

  // --- File upload ---
  NEXT_PUBLIC_MAX_FILE_SIZE_BYTES: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : undefined)),
  NEXT_PUBLIC_ALLOWED_IMAGE_TYPES: optionalString.describe("Comma-separated MIME types for image uploads"),
});

export type RawEnv = z.infer<typeof rawEnvSchema>;

/**
 * Resolved env with required defaults applied.
 * PublicEnv is the client-safe subset (NEXT_PUBLIC_* only).
 */
export type Env = RawEnv & {
  SERVER_API_URL: string;
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_BASE_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_BASE_PATH: string;
  NEXT_PUBLIC_APPLICATION_STATUS: "pre-alpha" | "alpha" | "beta" | undefined;
  NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR: "bottom" | "trigger";
  NEXT_PUBLIC_SHOW_REASONING_PART_TYPE: boolean;
  NEXT_PUBLIC_DATA_HEADER_ENABLED: boolean;
  NEXT_PUBLIC_SKIP_LOGIN_PAGE: boolean;
  MAINTENANCE_MODE: boolean;
  CSP_ENABLED: boolean;
  CSP_REPORT_ENABLED: boolean;
};

/** Client-safe subset; only NEXT_PUBLIC_* vars. */
export type PublicEnv = Pick<
  Env,
  | "NEXT_PUBLIC_APP_ENV"
  | "NEXT_PUBLIC_API_URL"
  | "NEXT_PUBLIC_BASE_URL"
  | "NEXT_PUBLIC_APP_URL"
  | "NEXT_PUBLIC_BASE_PATH"
  | "NEXT_PUBLIC_APPLICATION_STATUS"
  | "NEXT_PUBLIC_FEEDBACK_CONTACT_URL"
  | "NEXT_PUBLIC_FEEDBACK_CONTACT_LABEL"
  | "NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR"
  | "NEXT_PUBLIC_SHOW_REASONING_PART_TYPE"
  | "NEXT_PUBLIC_DATA_HEADER_ENABLED"
  | "NEXT_PUBLIC_AUTH_PROVIDER"
  | "NEXT_PUBLIC_SKIP_LOGIN_PAGE"
  | "NEXT_PUBLIC_MSAL_CLIENT_ID"
  | "NEXT_PUBLIC_MSAL_REDIRECT_URI"
  | "NEXT_PUBLIC_MSAL_AUTHORITY"
  | "NEXT_PUBLIC_VEGA_CUSTOM_THEME_URL"
  | "NEXT_PUBLIC_MAX_FILE_SIZE_BYTES"
  | "NEXT_PUBLIC_ALLOWED_IMAGE_TYPES"
>;

export { rawEnvSchema };
