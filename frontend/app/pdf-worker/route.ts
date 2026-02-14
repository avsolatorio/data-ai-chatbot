/**
 * Serves the PDF.js worker script so it works in both dev and standalone.
 * Placed outside /api so the catch-all API proxy does not forward it.
 * With trailingSlash: true, this is served at /pdf-worker/
 */

import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const WORKER_FILENAME = "pdf.worker.min.mjs";

function getWorkerPath(): string {
  const root = process.cwd();
  const fromPublic = path.join(root, "public", WORKER_FILENAME);
  if (fs.existsSync(fromPublic)) return fromPublic;
  const fromNodeModules = path.join(
    root,
    "node_modules",
    "pdfjs-dist",
    "build",
    WORKER_FILENAME,
  );
  return fromNodeModules;
}

export async function GET() {
  try {
    const workerPath = getWorkerPath();
    if (!fs.existsSync(workerPath)) {
      return new NextResponse("PDF.js worker not found", { status: 404 });
    }
    const body = fs.readFileSync(workerPath);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Failed to load worker", { status: 500 });
  }
}
