/**
 * Centralized environment config.
 * Resolution order: process.env > preset for NEXT_PUBLIC_APP_ENV > defaults.
 */

import { rawEnvSchema } from "./schema";
import type { Env, EnvironmentName, PublicEnv, RawEnv } from "./schema";
import { envDefaults, environmentPresets } from "./presets";

let cachedEnv: Env | null = null;

/**
 * Build raw env input merged with presets and defaults.
 * Note: Spreading process.env does NOT trigger Next.js inlining for client bundles.
 * Client-facing vars must be directly referenced (e.g. in lib/config.ts, lib/auth/config.ts).
 */
function buildRawInput(): Record<string, string | undefined> {
  const envName = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase() as
    | EnvironmentName
    | undefined;
  const preset =
    envName && envName in environmentPresets
      ? environmentPresets[envName]
      : null;

  const pick = (key: keyof typeof envDefaults): string =>
    (process.env[key] as string | undefined)?.trim() ||
    preset?.[key] ||
    envDefaults[key] ||
    "";

  return {
    ...process.env,
    SERVER_API_URL: pick("SERVER_API_URL"),
    NEXT_PUBLIC_API_URL: pick("NEXT_PUBLIC_API_URL"),
    NEXT_PUBLIC_BASE_URL: pick("NEXT_PUBLIC_BASE_URL"),
  };
}

/** Apply required defaults to produce full Env. */
function applyDefaults(raw: RawEnv): Env {
  const envName = raw.NEXT_PUBLIC_APP_ENV;
  const preset =
    envName && envName in environmentPresets
      ? environmentPresets[envName]
      : null;

  const pickUrl = (
    key: keyof typeof envDefaults,
    fromRaw: string | undefined,
  ): string =>
    fromRaw?.trim() ||
    preset?.[key] ||
    envDefaults[key] ||
    "";

  return {
    ...raw,
    SERVER_API_URL: pickUrl("SERVER_API_URL", raw.SERVER_API_URL as string),
    NEXT_PUBLIC_API_URL: pickUrl(
      "NEXT_PUBLIC_API_URL",
      raw.NEXT_PUBLIC_API_URL as string,
    ),
    NEXT_PUBLIC_BASE_URL: pickUrl(
      "NEXT_PUBLIC_BASE_URL",
      raw.NEXT_PUBLIC_BASE_URL as string,
    ),
    NEXT_PUBLIC_APP_URL:
      raw.NEXT_PUBLIC_APP_URL?.trim() ||
      "https://data360chat.worldbank.org",
    NEXT_PUBLIC_BASE_PATH: (raw.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, ""),
    NEXT_PUBLIC_APPLICATION_STATUS:
      raw.NEXT_PUBLIC_APPLICATION_STATUS ?? undefined,
    NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR:
      raw.NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR ?? "bottom",
    NEXT_PUBLIC_SHOW_REASONING_PART_TYPE:
      raw.NEXT_PUBLIC_SHOW_REASONING_PART_TYPE ?? false,
    NEXT_PUBLIC_DATA_HEADER_ENABLED:
      raw.NEXT_PUBLIC_DATA_HEADER_ENABLED ?? false,
    NEXT_PUBLIC_SKIP_LOGIN_PAGE:
      raw.NEXT_PUBLIC_SKIP_LOGIN_PAGE ?? true,
    MAINTENANCE_MODE: raw.MAINTENANCE_MODE ?? false,
    CSP_ENABLED: raw.CSP_ENABLED ?? false,
    CSP_REPORT_ENABLED: raw.CSP_REPORT_ENABLED ?? true,
  };
}

/**
 * Parse and validate env. Throws with clear errors if invalid.
 * Call at startup or use getEnv() which caches.
 */
export function validateEnv(): Env {
  const rawInput = buildRawInput();
  const parsed = rawEnvSchema.safeParse(rawInput);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Environment validation failed:\n${issues}\n\nCheck .env.example and docs/env-variables.md`,
    );
  }

  const env = applyDefaults(parsed.data);

  // Production: require POSTGRES_URL when app uses DB
  if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
    if (!env.POSTGRES_URL?.trim()) {
      throw new Error(
        "POSTGRES_URL is required in production. Set it in Azure App Service application settings.",
      );
    }
  }

  return env;
}

/**
 * Get validated env config (singleton, validated on first access).
 * Use this instead of process.env throughout the app.
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = validateEnv();
  return cachedEnv;
}

/**
 * Client-safe env subset. Use on client when you need typed config.
 * On server, prefer getEnv() for full access.
 */
export function getPublicEnv(): PublicEnv {
  const env = getEnv();
  return {
    NEXT_PUBLIC_APP_ENV: env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_BASE_URL: env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BASE_PATH: env.NEXT_PUBLIC_BASE_PATH,
    NEXT_PUBLIC_APPLICATION_STATUS: env.NEXT_PUBLIC_APPLICATION_STATUS,
    NEXT_PUBLIC_FEEDBACK_CONTACT_URL: env.NEXT_PUBLIC_FEEDBACK_CONTACT_URL,
    NEXT_PUBLIC_FEEDBACK_CONTACT_LABEL: env.NEXT_PUBLIC_FEEDBACK_CONTACT_LABEL,
    NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR:
      env.NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR,
    NEXT_PUBLIC_SHOW_REASONING_PART_TYPE:
      env.NEXT_PUBLIC_SHOW_REASONING_PART_TYPE,
    NEXT_PUBLIC_DATA_HEADER_ENABLED: env.NEXT_PUBLIC_DATA_HEADER_ENABLED,
    NEXT_PUBLIC_AUTH_PROVIDER: env.NEXT_PUBLIC_AUTH_PROVIDER,
    NEXT_PUBLIC_SKIP_LOGIN_PAGE: env.NEXT_PUBLIC_SKIP_LOGIN_PAGE,
    NEXT_PUBLIC_MSAL_CLIENT_ID: env.NEXT_PUBLIC_MSAL_CLIENT_ID,
    NEXT_PUBLIC_MSAL_REDIRECT_URI: env.NEXT_PUBLIC_MSAL_REDIRECT_URI,
    NEXT_PUBLIC_MSAL_AUTHORITY: env.NEXT_PUBLIC_MSAL_AUTHORITY,
    NEXT_PUBLIC_VEGA_CUSTOM_THEME_URL: env.NEXT_PUBLIC_VEGA_CUSTOM_THEME_URL,
    NEXT_PUBLIC_MAX_FILE_SIZE_BYTES: env.NEXT_PUBLIC_MAX_FILE_SIZE_BYTES,
    NEXT_PUBLIC_ALLOWED_IMAGE_TYPES: env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES,
  };
}

/** Reset cache (for tests). */
export function resetEnvCache(): void {
  cachedEnv = null;
}
