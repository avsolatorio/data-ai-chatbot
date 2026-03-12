/**
 * Environment presets (dev, qa, uat, prod).
 * Used when NEXT_PUBLIC_APP_ENV is set and env var is empty.
 * Empty string means "use process.env or default".
 */

import type { EnvironmentName } from "./schema";

export type EnvironmentUrls = {
  SERVER_API_URL: string;
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_BASE_URL: string;
};

export const environmentPresets: Record<EnvironmentName, EnvironmentUrls> = {
  dev: {
    SERVER_API_URL: "",
    NEXT_PUBLIC_API_URL: "",
    NEXT_PUBLIC_BASE_URL: "",
  },
  qa: {
    SERVER_API_URL: "",
    NEXT_PUBLIC_API_URL: "",
    NEXT_PUBLIC_BASE_URL: "",
  },
  uat: {
    SERVER_API_URL: "",
    NEXT_PUBLIC_API_URL: "",
    NEXT_PUBLIC_BASE_URL: "",
  },
  prod: {
    SERVER_API_URL: "",
    NEXT_PUBLIC_API_URL: "",
    NEXT_PUBLIC_BASE_URL: "",
  },
};

/** Default fallbacks when neither preset nor env is set. */
export const envDefaults: EnvironmentUrls = {
  SERVER_API_URL: "http://localhost:8001",
  NEXT_PUBLIC_API_URL: "http://localhost:8001",
  NEXT_PUBLIC_BASE_URL: "http://localhost:3001",
};
