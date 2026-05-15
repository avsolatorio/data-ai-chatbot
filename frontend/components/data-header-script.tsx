"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

import { getPublicEnv } from "@/lib/env/config";
import type { DataHeaderEnvironment } from "@/lib/env/schema";

function getDataHeaderCssUrl(): string {
  return getPublicEnv().NEXT_PUBLIC_DATA_HEADER_CSS_URL;
}

function getDataHeaderScriptUrl(): string {
  return getPublicEnv().NEXT_PUBLIC_DATA_HEADER_SCRIPT_URL;
}

function getDataHeaderEnvironment(): DataHeaderEnvironment {
  return getPublicEnv().NEXT_PUBLIC_DATA_HEADER_ENVIRONMENT;
}

const HEADER_SCOPE_CLASS = "data-header-wrapper";

/** Measure .data-header-wrapper height and set --header-height on :root so sidebar starts below it. */
function syncHeaderHeight(): void {
  const wrapper = document.querySelector(".data-header-wrapper");
  if (!wrapper) return;
  const height = wrapper.getBoundingClientRect().height;
  // Always update so ResizeObserver can correct from 0 to real height when header injects content
  document.documentElement.style.setProperty("--header-height", `${height}px`);
}

/**
 * Scope CSS so all selectors only apply inside an element with the given class.
 * Handles @media / @keyframes by recursively scoping nested rules.
 */
function scopeCss(css: string, scopeClass: string): string {
  const scope = scopeClass.startsWith(".") ? scopeClass : `.${scopeClass}`;
  let i = 0;
  const len = css.length;
  const out: string[] = [];

  function skipWhitespace(): void {
    while (i < len && /[\t\n\r ]/.test(css[i] ?? "")) i++;
  }

  function scopeSelectors(selectorBlock: string): string {
    return selectorBlock
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((sel) => `${scope} ${sel}`)
      .join(", ");
  }

  function parseBlock(): string {
    const start = i;
    let depthCur = 0;
    let selectorEnd = -1;
    while (i < len) {
      const c = css[i];
      if (c === "{") {
        if (depthCur === 0) selectorEnd = i;
        depthCur++;
        i++;
      } else if (c === "}") {
        depthCur--;
        i++;
        if (depthCur === 0) break;
      } else {
        i++;
      }
    }
    const raw = css.slice(start, i);
    if (selectorEnd < 0) return raw;
    const selectorPart = css.slice(start, selectorEnd).trim();
    const inner = css.slice(selectorEnd + 1, i - 1);
    if (selectorPart.startsWith("@")) {
      return `${selectorPart} { ${scopeCss(inner, scopeClass)} }`;
    }
    const scopedSelectors = scopeSelectors(selectorPart);
    return `${scopedSelectors} { ${inner} }`;
  }

  skipWhitespace();
  while (i < len) {
    out.push(parseBlock());
    skipWhitespace();
  }
  return out.join("\n");
}

export function DataHeaderScript() {
  const styleInjected = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const cssUrl = getDataHeaderCssUrl();
    fetch(cssUrl)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.statusText))))
      .then((css) => {
        const scoped = scopeCss(css, HEADER_SCOPE_CLASS);
        const style = document.createElement("style");
        style.setAttribute("data-header-scoped", "true");
        style.textContent = scoped;
        document.head.appendChild(style);
      })
      .catch(() => {
        // Header CSS may fail (CORS, network). App continues without header styles.
      });
  }, []);

  // Keep --header-height in sync with .data-header-wrapper height (resize, font load, async header inject).
  useEffect(() => {
    const wrapper = document.querySelector(".data-header-wrapper");
    if (!wrapper) return;

    syncHeaderHeight();
    const observer = new ResizeObserver(() => {
      syncHeaderHeight();
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <Script
      src={getDataHeaderScriptUrl()}
      strategy="afterInteractive"
      onLoad={() => {
        syncHeaderHeight();
        const dataHeaderOptions = {
          languagecode: "en",
          selector: ".data-header",
          environment: getDataHeaderEnvironment(),
        };
        const win = window as Window & {
          populateDataHeader?: (
            opts: typeof dataHeaderOptions,
          ) => Promise<unknown> | undefined;
        };
        if (typeof win.populateDataHeader === "function") {
          try {
            const result = win.populateDataHeader(dataHeaderOptions);
            // Header script may fetch async; catch Promise rejection (e.g. Failed to fetch).
            if (
              result != null &&
              typeof (result as Promise<unknown>)?.catch === "function"
            ) {
              (result as Promise<unknown>).catch(() => {
                // App continues without the external header.
              });
            }
            // Backup sync in case ResizeObserver misses the first layout (e.g. async inject).
            setTimeout(syncHeaderHeight, 300);
            setTimeout(syncHeaderHeight, 1000);
          } catch {
            // Sync error (e.g. CORS, localhost, network).
          }
        }
      }}
    />
  );
}
