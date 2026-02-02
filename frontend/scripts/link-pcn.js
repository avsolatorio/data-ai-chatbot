"use strict";

const fs = require("node:fs");
const path = require("node:path");

// Always resolve relative to this script's location so it works regardless of cwd
const frontendDir = path.resolve(__dirname, "..");
const pcnPackagesDir = path.resolve(frontendDir, "../../pcn/packages");
const nodeModulesPcn = path.join(frontendDir, "node_modules", "@pcn-js");

const packages = ["core", "ui", "data360"];

for (const name of packages) {
  const target = path.join(pcnPackagesDir, name);
  const linkPath = path.join(nodeModulesPcn, name);

  if (!fs.existsSync(target)) {
    console.error(`PCN package not found: ${target}`);
    process.exit(1);
  }

  if (fs.existsSync(linkPath)) {
    fs.rmSync(linkPath, { recursive: true });
  }

  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(target, linkPath, "dir");
  console.log(`Linked @pcn-js/${name} -> ${target}`);
}

console.log("Done. Run 'pnpm run build:pcn' after changing PCN code, then clear .next and restart dev.");
