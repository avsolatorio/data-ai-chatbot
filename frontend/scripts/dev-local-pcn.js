"use strict";

const path = require("node:path");
const { execSync } = require("node:child_process");

// Run everything from the frontend directory (where this script lives)
const frontendDir = path.resolve(__dirname, "..");
process.chdir(frontendDir);

const steps = [
  { name: "Building and copying local PCN into node_modules", cmd: "pnpm run copy:pcn" },
  { name: "Clearing .next", cmd: "pnpm exec rimraf .next" },
  { name: "Starting dev server (Turbopack)", cmd: "pnpm exec next dev --turbo --port 3001" },
];

console.log("Running dev:local-pcn from:", frontendDir);
console.log("");

for (let i = 0; i < steps.length; i++) {
  const { name, cmd } = steps[i];
  console.log(`[${i + 1}/${steps.length}] ${name}...`);
  if (i < steps.length - 1) {
    execSync(cmd, { cwd: frontendDir, stdio: "inherit" });
  } else {
    // Last step: start dev (don't wait, let it run)
    execSync(cmd, { cwd: frontendDir, stdio: "inherit" });
  }
}
