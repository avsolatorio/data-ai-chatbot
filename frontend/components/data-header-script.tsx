"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

const DEFAULT_HEADER_CSS_URL =
  "https://extdataportalqa.worldbank.org/qa/api/ext/header/webasset/data/dataheaderservice/clientlibs/site.css";
const DEFAULT_HEADER_SCRIPT_URL =
  "https://extdataportalqa.worldbank.org/qa/api/ext/header/webasset/data/dataheaderservice/clientlibs/site.js";

function getDataHeaderCssUrl(): string {
  return (
    process.env.NEXT_PUBLIC_DATA_HEADER_CSS_URL?.trim() ||
    DEFAULT_HEADER_CSS_URL
  );
}

function getDataHeaderScriptUrl(): string {
  return (
    process.env.NEXT_PUBLIC_DATA_HEADER_SCRIPT_URL?.trim() ||
    DEFAULT_HEADER_SCRIPT_URL
  );
}

const HEADER_SCOPE_CLASS = "data-header-wrapper";

/** Measure .data-header-wrapper height and set --header-height on :root so sidebar starts below it. */
function syncHeaderHeight(): void {
  const wrapper = document.querySelector(".data-header-wrapper");
  if (!wrapper) return;
  const height = wrapper.getBoundingClientRect().height;
  if (height > 0) {
    document.documentElement.style.setProperty(
      "--header-height",
      `${height}px`,
    );
  }
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

  return (
    <Script
      src={getDataHeaderScriptUrl()}
      strategy="afterInteractive"
      onLoad={() => {
        const dataHeaderOptions = {
          languagecode: "en",
          selector: ".data-header",
          environment: "qa",
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
            // Sync sidebar offset after header is populated (DOM may update async).
            setTimeout(syncHeaderHeight, 100);
            setTimeout(syncHeaderHeight, 500);
          } catch {
            // Sync error (e.g. CORS, localhost, network).
          }
        } else {
          syncHeaderHeight();
        }
      }}
    />
  );
}
