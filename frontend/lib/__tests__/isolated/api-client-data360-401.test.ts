/**
 * Isolated tests: must run with `tsx --import ./lib/__tests__/preload-data360-auth.ts`
 * so authProvider is "data360" when @/lib/auth/config loads.
 */

import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";
import { resetData360SearchTokenRefreshInflightForTests } from "@/lib/auth/data360/data360-search-token-refresh";
import { cookiesKey } from "@/lib/constants";

type ApiFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

let apiFetch: ApiFetch;
let resetData360AuthRedirectScheduledForTests: () => void;

function createCookieDocument(initialSearchToken: string) {
  const pairs = new Map<string, string>([
    [cookiesKey.searchToken, initialSearchToken],
  ]);
  return {
    get cookie(): string {
      return [...pairs.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    set cookie(value: string) {
      const segment = value.split(";")[0]?.trim() ?? "";
      const eq = segment.indexOf("=");
      if (eq <= 0) return;
      const name = segment.slice(0, eq);
      const raw = segment.slice(eq + 1);
      pairs.set(name, decodeURIComponent(raw));
    },
  };
}

before(async () => {
  const mod = await import("@/lib/api-client");
  apiFetch = mod.apiFetch;
  resetData360AuthRedirectScheduledForTests =
    mod.resetData360AuthRedirectScheduledForTests;
});

afterEach(() => {
  resetData360AuthRedirectScheduledForTests();
  resetData360SearchTokenRefreshInflightForTests();
});

describe("apiFetch Data360 401 handling (isolated, preload=data360)", () => {
  it("POST refresh with token in JSON then retries once and returns ok", async () => {
    const doc = createCookieDocument("old-token");
    globalThis.document = doc as unknown as Document;
    globalThis.window = globalThis as Window & typeof globalThis;
    globalThis.sessionStorage = {
      removeItem: () => {},
      getItem: () => null,
      setItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;

    let step = 0;
    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url.includes("/api/models") && step === 0) {
        step += 1;
        return new Response(JSON.stringify({ detail: "Unauthorized" }), {
          status: 401,
        });
      }

      if (
        url.startsWith("https://refresh.example.com/") &&
        init?.method === "POST"
      ) {
        return new Response(
          JSON.stringify({
            success: true,
            refreshed: true,
            token: "fresh-token",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/models") && step === 1) {
        assert.ok(
          init?.headers &&
            new Headers(init.headers as HeadersInit).get("Authorization") ===
              "Bearer fresh-token",
        );
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("unexpected", { status: 500 });
    }) as typeof fetch;

    const res = await apiFetch("/api/models");
    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean };
    assert.equal(body.ok, true);
  });

  it("when refresh fails, calls clear-search-token and redirects", async () => {
    const doc = createCookieDocument("stale-token");
    globalThis.document = doc as unknown as Document;
    globalThis.window = globalThis as Window & typeof globalThis;
    globalThis.sessionStorage = {
      removeItem: () => {},
      getItem: () => null,
      setItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;

    let replaceCalls = 0;
    const locationMock = {
      pathname: "/",
      search: "",
      hash: "",
      href: "https://example.com/",
      replace: (href: string) => {
        replaceCalls += 1;
        assert.ok(href.includes("example.com/auth"));
        assert.ok(href.includes("returnTo="));
      },
    };
    globalThis.location = locationMock as unknown as Location;

    const seenUrls: string[] = [];
    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      seenUrls.push(url);

      if (url.includes("/api/chat") && !url.includes("clear-search-token")) {
        return new Response(JSON.stringify({ detail: "Unauthorized" }), {
          status: 401,
        });
      }

      if (url.includes("refresh.example.com")) {
        return new Response(
          JSON.stringify({ success: false, message: "no session" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/auth/clear-search-token")) {
        assert.equal(init?.method, "POST");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      return new Response("unexpected", { status: 500 });
    }) as typeof fetch;

    const res = await apiFetch("/api/chat");
    assert.equal(res.status, 401);
    assert.ok(seenUrls.some((u) => u.includes("/api/auth/clear-search-token")));
    assert.equal(replaceCalls, 1);
  });

  it("concurrent 401s share one refresh POST (single-flight)", async () => {
    const doc = createCookieDocument("shared-old");
    globalThis.document = doc as unknown as Document;
    globalThis.window = globalThis as Window & typeof globalThis;
    globalThis.sessionStorage = {
      removeItem: () => {},
      getItem: () => null,
      setItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;

    let apiHits = 0;
    let refreshPosts = 0;

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url.includes("refresh.example.com") && init?.method === "POST") {
        refreshPosts += 1;
        await new Promise((r) => setTimeout(r, 20));
        return new Response(
          JSON.stringify({ success: true, token: "flight-token" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/a")) {
        apiHits += 1;
        if (apiHits <= 2) {
          return new Response("{}", { status: 401 });
        }
        return new Response(JSON.stringify({ n: 1 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/api/b")) {
        apiHits += 1;
        if (apiHits <= 2) {
          return new Response("{}", { status: 401 });
        }
        return new Response(JSON.stringify({ n: 2 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("bad", { status: 500 });
    }) as typeof fetch;

    const [ra, rb] = await Promise.all([
      apiFetch("/api/a"),
      apiFetch("/api/b"),
    ]);

    assert.equal(refreshPosts, 1);
    assert.equal(ra.status, 200);
    assert.equal(rb.status, 200);
  });
});
