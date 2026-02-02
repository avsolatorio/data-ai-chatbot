"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

// Always resolve relative to this script's location so it works regardless of cwd
const frontendDir = path.resolve(__dirname, "..");
const nodeModulesPcn = path.join(frontendDir, "node_modules", "@pcn-js");
const required = ["core", "ui", "data360"];

const missing = required.filter((name) => {
  const p = path.join(nodeModulesPcn, name);
  if (!fs.existsSync(p)) return true;
  try {
    const stat = fs.lstatSync(p);
    return !stat.isDirectory() && !stat.isSymbolicLink();
  } catch {
    return true;
  }
});

if (missing.length === 0) {
  console.log("All @pcn-js packages present.");
  process.exit(0);
}

console.error(
  "Missing @pcn-js packages in node_modules:",
  missing.join(", "),
);
console.log("Reinstalling @pcn-js/core, @pcn-js/ui, @pcn-js/data360...");
execSync("pnpm add @pcn-js/core@^0.1.1 @pcn-js/ui@^0.1.1 @pcn-js/data360@^0.1.1", {
  cwd: frontendDir,
  stdio: "inherit",
});
console.log("Done. Run 'pnpm dev' from the frontend directory.");
