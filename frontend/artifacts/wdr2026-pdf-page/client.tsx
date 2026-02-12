"use client";

import { Artifact } from "@/components/create-artifact";

type Wdr2026PdfPageContent = {
  pdfUrl: string;
  page: number;
  pathLabel: string;
};

function parseContent(content: string): Wdr2026PdfPageContent | null {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (
      !parsed ||
      typeof parsed.pdfUrl !== "string" ||
      typeof parsed.page !== "number"
    ) {
      return null;
    }
    const pathLabel =
      typeof parsed.pathLabel === "string" ? parsed.pathLabel : "WDR2026";
    const page = Number.isFinite(parsed.page) ? Math.max(1, parsed.page) : 1;
    return { pdfUrl: parsed.pdfUrl, page, pathLabel };
  } catch {
    return null;
  }
}

/**
 * Opens the WDR2026 source PDF at a specific page in the artifact panel.
 * Used when the user clicks "View page in PDF" on a text search result.
 */
export const wdr2026PdfPageArtifact = new Artifact({
  kind: "wdr2026-pdf-page",
  description:
    "WDR2026 source PDF opened at the page where the selected segment appears.",
  onStreamPart: () => {},
  content: ({ content }) => {
    const data = parseContent(content || "{}");
    if (!data) {
      return (
        <div className="flex h-full min-h-[200px] w-full items-center justify-center p-6 text-muted-foreground text-sm">
          No PDF page data to display.
        </div>
      );
    }

    // Most PDF viewers (browser, Adobe) use #page=N (1-based)
    const pdfSrc = `${data.pdfUrl}#page=${data.page}`;

    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <p className="text-muted-foreground shrink-0 text-xs">
          {data.pathLabel} — Page {data.page}
        </p>
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            src={pdfSrc}
            title={`WDR2026 PDF, page ${data.page}`}
            className="size-full border-0"
          />
        </div>
      </div>
    );
  },
  actions: [],
  toolbar: [],
});
