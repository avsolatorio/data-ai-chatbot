import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { resetEnvCache } from "@/lib/env";

const originalRefreshUrl = process.env.NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_URL;
const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH;

afterEach(() => {
  if (originalRefreshUrl === undefined) {
    delete process.env.NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_URL;
  } else {
    process.env.NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_URL = originalRefreshUrl;
  }
  if (originalBasePath === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath;
  }
  resetEnvCache();
});

describe("resolveData360SearchTokenRefreshUrl", () => {
  it("returns null when unset", async () => {
    delete process.env.NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_URL;
    resetEnvCache();
    const { resolveData360SearchTokenRefreshUrl } = await import(
      "@/lib/auth/data360/data360-search-token-refresh"
    );
    assert.equal(resolveData360SearchTokenRefreshUrl(), null);
  });

  it("returns absolute http(s) URL as-is", async () => {
    process.env.NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_URL =
      "https://data360.example.org/api/refresh";
    resetEnvCache();
    const { resolveData360SearchTokenRefreshUrl } = await import(
      "@/lib/auth/data360/data360-search-token-refresh"
    );
    assert.equal(
      resolveData360SearchTokenRefreshUrl(),
      "https://data360.example.org/api/refresh",
    );
  });

  it("prefixes relative path with basePath", async () => {
    process.env.NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_URL =
      "/api/auth/refresh-search-token";
    process.env.NEXT_PUBLIC_BASE_PATH = "/app";
    resetEnvCache();
    const { resolveData360SearchTokenRefreshUrl } = await import(
      "@/lib/auth/data360/data360-search-token-refresh"
    );
    assert.equal(
      resolveData360SearchTokenRefreshUrl(),
      "/app/api/auth/refresh-search-token",
    );
  });
});

describe("refreshSearchTokenIfConfigured", () => {
  it("returns false without document (SSR / Node)", async () => {
    process.env.NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_URL =
      "https://example.com/refresh";
    resetEnvCache();
    const { refreshSearchTokenIfConfigured } = await import(
      "@/lib/auth/data360/data360-search-token-refresh"
    );
    const ok = await refreshSearchTokenIfConfigured();
    assert.equal(ok, false);
  });
});
