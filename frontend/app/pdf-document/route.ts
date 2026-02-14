/**
 * Proxies the configured WDR2026 PDF so the browser can load it without CORS.
 * Fetches the PDF server-side and returns the body. Only the configured URL is fetched.
 */

import { NextResponse } from "next/server";

const WDR2026_DEFAULT_PDF_FILENAME =
  "WDR2026_Concept_Note_-_WBG-Wide_Review_Oct-20-2025.pdf";

function getPdfUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_WDR2026_PDF_URL;
  if (explicit != null && explicit.trim().length > 0) {
    return explicit.trim();
  }
  const base = process.env.NEXT_PUBLIC_WDR2026_ASSETS_BASE;
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/documents/${WDR2026_DEFAULT_PDF_FILENAME}`;
}

export async function GET() {
  const pdfUrl = getPdfUrl();
  if (!pdfUrl) {
    return new NextResponse("WDR2026 PDF URL not configured", { status: 404 });
  }
  try {
    const res = await fetch(pdfUrl, { cache: "force-cache" });
    if (!res.ok) {
      return new NextResponse(`PDF fetch failed: ${res.status}`, {
        status: res.status,
      });
    }
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new NextResponse(
      e instanceof Error ? e.message : "Failed to fetch PDF",
      { status: 502 },
    );
  }
}
