import { type NextRequest, NextResponse } from "next/server";

/**
 * CSP violation report endpoint. Browsers POST here when Content-Security-Policy-Report-Only
 * detects a violation. Logs the report for debugging; does not block the violating resource.
 *
 * Enable by setting CSP_REPORT_URI in proxy.ts. Reports are logged server-side.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const report = body && typeof body === "object" && "csp-report" in body
      ? (body as { "csp-report": Record<string, unknown> })["csp-report"]
      : body;

    if (report && typeof report === "object") {
      const { "document-uri": docUri, "violated-directive": directive, "blocked-uri": blockedUri } =
        report as Record<string, string>;
      console.error(
        "[CSP Report] Violation:",
        { directive, blockedUri, documentUri: docUri },
      );
    } else {
      console.error("[CSP Report] Malformed payload:", body);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CSP Report] Error processing report:", error);
    return new NextResponse(null, { status: 204 });
  }
}
