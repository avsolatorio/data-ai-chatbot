/**
 * PostCSS plugin: rewrite Tailwind @source for streamdown to an absolute path.
 *
 * Tailwind v4's @source in globals.css uses a path relative to the CSS file.
 * In some deployments (different cwd, pnpm layout) that relative path fails.
 * This plugin runs before @tailwindcss/postcss and replaces the streamdown
 * @source with Node's require.resolve result, so the path always resolves.
 */

import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const STREAMDOWN_RELATIVE = "../node_modules/streamdown/dist/index.js";
let resolvedPath = null;

function getStreamdownPath() {
  if (resolvedPath !== null) return resolvedPath;
  try {
    // resolve package entry (dist/index.cjs or dist/index.js); then use dist/index.js for Tailwind scan
    const entry = require.resolve("streamdown");
    const dir = path.dirname(entry);
    const absolute = path.join(dir, "index.js");
    resolvedPath = path.normalize(absolute).replace(/\\/g, "/");
  } catch {
    resolvedPath = null;
  }
  return resolvedPath;
}

export default function postcssSourceResolve() {
  return {
    postcssPlugin: "postcss-source-resolve",
    Once(root, { result }) {
      const file = getStreamdownPath();
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
