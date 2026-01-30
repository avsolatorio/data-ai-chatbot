const fs = require("fs");
const path = require("path");

const root = process.cwd();
const staticSrcDir = path.join(root, ".next", "static");
const staticDestDir = path.join(root, ".next", "standalone", ".next", "static");

const staticPublicDir = path.join(root, "public");
const staticPublicDestDir = path.join(root, ".next", "standalone", "public");

// Ensure destination directory exists
if (!fs.existsSync(staticDestDir)) {
  fs.mkdirSync(staticDestDir, { recursive: true });
}

//  Copy static assets (required)
if (fs.existsSync(staticSrcDir)) {
  fs.cpSync(staticSrcDir, staticDestDir, { recursive: true, force: true });
}

// Copy public assets (optional)
if (fs.existsSync(staticPublicDir)) {
  fs.cpSync(staticPublicDir, staticPublicDestDir, {
    recursive: true,
    force: true,
  });
}

console.log("Post-build: Static assets copied successfully.");
