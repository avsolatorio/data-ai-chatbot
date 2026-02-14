"use strict";

const fs = require("node:fs");
const path = require("node:path");

const src = path.join(__dirname, "../node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = path.join(__dirname, "../public/pdf.worker.min.mjs");

if (!fs.existsSync(src)) {
  process.exit(0);
}
fs.copyFileSync(src, dest);
