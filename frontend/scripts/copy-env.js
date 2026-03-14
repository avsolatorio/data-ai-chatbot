/**
 * Copies the environment-specific .env file from environments/ to the project root.
 * Cross-platform (Windows, macOS, Linux). Use instead of ln -sf for CI/build servers.
 *
 * Usage:
 *   APP_ENV=dev node scripts/copy-env.js
 *   cross-env APP_ENV=qa node scripts/copy-env.js
 *
 * Expects: environments/.env.{APP_ENV} (e.g. environments/.env.dev)
 * Writes:  .env
 *
 * APP_ENV: local | dev | qa | uat | prod (default: dev)
 */

const fs = require("node:fs");
const path = require("node:path");

const APP_ENV = process.env.APP_ENV || "dev";
const scriptDir = path.dirname(__filename);
const projectRoot = path.dirname(scriptDir);
const srcPath = path.join(projectRoot, "environments", `.env.${APP_ENV}`);
const destPath = path.join(projectRoot, ".env");

if (!fs.existsSync(srcPath)) {
  process.stderr.write(
    `[copy-env] Source not found: ${srcPath}\n` +
      `  Set APP_ENV (local|dev|qa|uat|prod). Current: APP_ENV=${APP_ENV}\n`
  );
  process.exit(1);
}

try {
  fs.copyFileSync(srcPath, destPath);
  if (process.env.DEBUG_COPY_ENV) {
    process.stdout.write(`[copy-env] Copied ${srcPath} -> ${destPath}\n`);
  }
} catch (err) {
  process.stderr.write(`[copy-env] Failed to copy: ${err.message}\n`);
  process.exit(1);
}
