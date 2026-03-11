"use client";

import { useEffect } from "react";

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";

/**
 * Syncs theme-color meta tag with next-themes (html.dark).
 * Runs only after mount to avoid hydration mismatch—the inline script
 * previously modified the DOM before React hydrated.
 */
export function ThemeColorSync() {
  useEffect(() => {
    const html = document.documentElement;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }

    const updateThemeColor = () => {
      const isDark = html.classList.contains("dark");
      meta?.setAttribute("content", isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    };

    const observer = new MutationObserver(updateThemeColor);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    updateThemeColor();

    return () => observer.disconnect();
  }, []);

  return null;
}
