/**
 * Ensures streamdown is resolvable at CSS build time so Tailwind can scan it
 * (list-item and other streamdown classes). Run from the frontend project root
 * (where package.json and node_modules live). Exits 1 with instructions if
 * streamdown is not found; exits 0 otherwise.
 *
 * Usage in CI: run before `next build`, e.g.
 *   node scripts/ensure-streamdown-for-tailwind.js && pnpm next build
 *
 * If your build runs from a different cwd (e.g. repo root), set the path explicitly:
 *   STREAMDOWN_DIST_PATH=/absolute/path/to/streamdown/dist/index.js node scripts/...
 */

const fs = require("node:fs");
const path = require("node:path");

const STREAMDOWN_INDEX = "streamdown/dist/index.js";

function resolveStreamdown() {
  const envPath = process.env.STREAMDOWN_DIST_PATH;
  if (envPath) {
    const absolute = path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
    if (fs.existsSync(absolute)) {
      const stat = fs.statSync(absolute);
      if (stat.isFile()) return absolute;
      if (stat.isDirectory()) {
        const candidate = path.join(absolute, "dist", "index.js");
        if (fs.existsSync(candidate)) return candidate;
      }
    }
    return null;
  }

  try {
    const createRequire = require("node:module").createRequire || (() => {
      const Module = require("node:module");
      return (p) => Module.createRequire(p);
    })();
    const requireFromCwd = createRequire(path.join(process.cwd(), "package.json"));
    const entry = requireFromCwd.resolve("streamdown");
    const dir = path.dirname(entry);
    const absolute = path.join(dir, "index.js");
    if (fs.existsSync(absolute)) return absolute;
    return path.join(dir, "dist", "index.js");
  } catch {
    // try relative to this script (project root = parent of scripts/)
    const scriptDir = path.dirname(__filename);
    const projectRoot = path.dirname(scriptDir);
    const relativePath = path.join(projectRoot, "node_modules", "streamdown", "dist", "index.js");
    const resolved = path.resolve(relativePath);
    if (fs.existsSync(resolved)) return resolved;
    return null;
  }
}

const resolved = resolveStreamdown();
if (resolved) {
  if (process.env.DEBUG_STREAMDOWN_PATH) {
    process.stdout.write(`[ensure-streamdown] resolved: ${resolved}\n`);
  }
  process.exit(0);
}

const cwd = process.cwd();
process.stderr.write(
  "[ensure-streamdown] streamdown not found. Tailwind will not see streamdown classes (list-item, etc.).\n" +
  "  - Run this script from the directory that contains package.json and node_modules.\n" +
  `  - Current cwd: ${cwd}\n` +
  "  - Run: pnpm install (or npm install) so node_modules/streamdown exists.\n" +
  "  - If your build runs from another directory (e.g. repo root), set STREAMDOWN_DIST_PATH to the absolute path to streamdown/dist/index.js.\n"
);
process.exit(1);
