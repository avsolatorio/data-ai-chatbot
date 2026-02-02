"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

// Always resolve relative to this script's location
const frontendDir = path.resolve(__dirname, "..");
const pcnPackagesDir = path.resolve(frontendDir, "../../pcn/packages");
const nodeModulesPcn = path.join(frontendDir, "node_modules", "@pcn-js");
const packages = ["core", "ui", "data360"];

console.log("Building PCN packages...");
execSync("pnpm run build:pcn", { cwd: frontendDir, stdio: "inherit" });

fs.mkdirSync(nodeModulesPcn, { recursive: true });

for (const name of packages) {
  const source = path.join(pcnPackagesDir, name);
  const dest = path.join(nodeModulesPcn, name);

  if (!fs.existsSync(source)) {
    console.error(`PCN package not found: ${source}`);
    process.exit(1);
  }

  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }

  fs.cpSync(source, dest, { recursive: true });
  console.log(`Copied @pcn-js/${name} into node_modules`);
}

console.log("Done. Use normal 'pnpm dev' (Turbopack); no Webpack needed.");
