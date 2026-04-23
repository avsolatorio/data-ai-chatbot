"use strict";

/**
 * copy-data360.js
 *
 * Builds @data360/mcp-ui and @data360/tool-types from the local data360-mcp
 * repo and copies their dist/ output into this project's node_modules so that
 * Turbopack picks up the latest local changes without waiting for an npm publish.
 *
 * Mirrors copy-pcn.js. Run via:
 *   pnpm run copy:data360
 *
 * The data360-mcp repo is expected at ../../data360-mcp relative to this
 * frontend directory (i.e. a sibling of the data-ai-chatbot repo root).
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const frontendDir = path.resolve(__dirname, "..");

// Resolve the data360-mcp packages directory.
// Inside Docker (dev compose): mounted at /data360-mcp/packages
// On the host: sibling repo at ../../data360-mcp/packages
const DOCKER_MOUNT = "/data360-mcp/packages";
const HOST_SIBLING = path.resolve(frontendDir, "../../data360-mcp/packages");
const isInsideDocker = fs.existsSync(DOCKER_MOUNT);
const data360PackagesDir = isInsideDocker ? DOCKER_MOUNT : HOST_SIBLING;

const nodeModulesData360 = path.join(frontendDir, "node_modules", "@data360");

if (isInsideDocker) {
  console.log("Running inside Docker container — using pre-built packages from mount.");
  console.log("IMPORTANT: Make sure you have already run 'pnpm run build:data360' on the host.");
} else {
  console.log("Running on host — will build packages before copying.");
}


// Packages to build and copy: key = folder name inside packages/, value = npm scope name
const packages = [
  { dir: "tool-types", name: "tool-types" },
  { dir: "mcp-ui", name: "mcp-ui" },
];

if (!fs.existsSync(data360PackagesDir)) {
  console.error(
    `data360-mcp packages directory not found: ${data360PackagesDir}\n` +
      "Expected the data360-mcp repo to be a sibling directory of data-ai-chatbot."
  );
  process.exit(1);
}

fs.mkdirSync(nodeModulesData360, { recursive: true });

for (const pkg of packages) {
  const pkgDir = path.join(data360PackagesDir, pkg.dir);

  if (!fs.existsSync(pkgDir)) {
    console.error(`Package directory not found: ${pkgDir}`);
    process.exit(1);
  }

  // Install deps for this package if node_modules is missing
  const pkgNodeModules = path.join(pkgDir, "node_modules");
  if (!fs.existsSync(pkgNodeModules)) {
    console.log(`Installing dependencies for @data360/${pkg.name}...`);
    execSync("npm install", { cwd: pkgDir, stdio: "inherit" });
  }

  // Build the package (host only — tsc not available in the frontend Docker image)
  if (!isInsideDocker) {
    console.log(`Building @data360/${pkg.name}...`);
    execSync("npm run build", { cwd: pkgDir, stdio: "inherit" });
  } else {
    console.log(`Skipping build for @data360/${pkg.name} (Docker mode — using pre-built dist)`);
  }


  const distDir = path.join(pkgDir, "dist");
  if (!fs.existsSync(distDir)) {
    console.error(
      `Build succeeded but dist/ not found at ${distDir}. Check the package's build output.`
    );
    process.exit(1);
  }

  // Wipe existing install and replace with local build
  const dest = path.join(nodeModulesData360, pkg.name);
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }

  fs.cpSync(pkgDir, dest, { recursive: true });
  console.log(`Copied @data360/${pkg.name} → node_modules/@data360/${pkg.name}`);
}

console.log(
  "\nDone. Turbopack will pick up the new files on the next request.\n" +
    "If running inside Docker, run: docker compose exec frontend node scripts/copy-data360.js"
);
