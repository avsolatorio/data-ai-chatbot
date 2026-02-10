/**
 * PostCSS plugin: rewrite Tailwind @source for streamdown to an absolute path.
 *
 * Tailwind v4's @source in globals.css uses a path relative to the CSS file.
 * In some deployments (different cwd, pnpm layout, or when the plugin runs
 * from .next/) that relative path fails. This plugin runs before
 * @tailwindcss/postcss and replaces the streamdown @source with an absolute
 * path so Tailwind can always find streamdown's classes.
 *
 * We resolve "streamdown" from process.cwd() (the build root), not from
 * import.meta.url, so resolution works even when Next/Turbopack runs this
 * plugin from a copy under .next/ where node_modules is not available.
 */

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const requireFromCwd = createRequire(path.join(process.cwd(), "package.json"));

let resolvedPath = null;

function getStreamdownPathFromRequire() {
  try {
    const entry = requireFromCwd.resolve("streamdown");
    const dir = path.dirname(entry);
    return path.join(dir, "index.js");
  } catch {
    return null;
  }
}

/**
 * Resolve streamdown path:
 * 1. STREAMDOWN_DIST_PATH env (for CI when cwd is not the app root)
 * 2. require from process.cwd()
 * 3. path relative to the CSS file
 */
function getStreamdownPath(cssFilePath) {
  if (resolvedPath !== null) return resolvedPath;
  let absolute = null;
  const envPath = typeof process !== "undefined" && process.env && process.env.STREAMDOWN_DIST_PATH;
  if (envPath) {
    const p = path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
    if (fs.existsSync(p)) {
      const stat = fs.statSync(p);
      if (stat.isFile()) absolute = p;
      else if (stat.isDirectory()) {
        const candidate = path.join(p, "dist", "index.js");
        if (fs.existsSync(candidate)) absolute = candidate;
      }
    }
  }
  if (!absolute) absolute = getStreamdownPathFromRequire();
  if (!absolute && cssFilePath) {
    const dir = path.dirname(cssFilePath);
    const relativePath = path.join(
      dir,
      "..",
      "node_modules",
      "streamdown",
      "dist",
      "index.js",
    );
    absolute = path.resolve(relativePath);
    if (!fs.existsSync(absolute)) absolute = null;
  }
  if (absolute) {
    resolvedPath = path.normalize(absolute).replace(/\\/g, "/");
  } else {
    const warn =
      "[postcss-source-resolve] streamdown not found (tried process.cwd() and path relative to CSS). List styles from streamdown will be missing; .response-markdown fallback in globals.css will apply.";
    if (typeof process !== "undefined" && process.emitWarning) {
      process.emitWarning(warn);
    } else if (typeof console !== "undefined" && console.warn) {
      console.warn(warn);
    }
    resolvedPath = null;
  }
  return resolvedPath;
}

export default function postcssSourceResolve() {
  return {
    postcssPlugin: "postcss-source-resolve",
    Once(root, { result }) {
      const from = result.opts.from ?? "";
      const file = getStreamdownPath(from);
      if (!file) return;
      root.walkAtRules("source", (atRule) => {
        const params = atRule.params.trim();
        if (params.includes("streamdown/dist/index.js")) {
          atRule.params = `"${file}"`;
        }
      });
    },
  };
}
postcssSourceResolve.postcss = true;
