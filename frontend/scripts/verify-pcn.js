"use strict";

const fs = require("node:fs");
const path = require("node:path");

const frontendDir = path.resolve(__dirname, "..");
const nodeModulesPcn = path.join(frontendDir, "node_modules", "@pcn-js");
const packages = ["core", "ui", "data360"];

console.log("Frontend directory:", frontendDir);
console.log("node_modules/@pcn-js:", nodeModulesPcn);
console.log("");

let allOk = true;
for (const name of packages) {
  const p = path.join(nodeModulesPcn, name);
  const exists = fs.existsSync(p);
  if (!exists) {
    console.log(`@pcn-js/${name}: MISSING`);
    allOk = false;
    continue;
  }
  const stat = fs.lstatSync(p);
  let target = "";
  if (stat.isSymbolicLink()) {
    target = fs.readlinkSync(p);
    console.log(`@pcn-js/${name}: symlink -> ${target}`);
  } else if (stat.isDirectory()) {
    const pkgPath = path.join(p, "package.json");
    const fromRegistry = fs.existsSync(pkgPath)
      ? " (from registry)"
      : " (directory, no package.json)";
    console.log(`@pcn-js/${name}: directory${fromRegistry}`);
  } else {
    console.log(`@pcn-js/${name}: unexpected (not dir/symlink)`);
    allOk = false;
  }
}

if (!allOk) {
  console.log("");
  console.log("Fix: From the frontend directory run: pnpm run ensure-pcn");
  process.exit(1);
}
console.log("");
console.log("All @pcn-js packages present. Run dev from frontend: cd frontend && pnpm dev");
