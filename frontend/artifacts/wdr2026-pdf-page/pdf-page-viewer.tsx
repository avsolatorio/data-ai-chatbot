"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { appConfig } from "@/lib/config";

const MAX_HIGHLIGHT_LENGTH = 400;

/** Normalize whitespace for fuzzy matching with PDF-extracted text. */
function normalizeForMatch(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Try to find a substring of the needle that appears in the page text (tries shorter fallbacks). */
function findMatchingNeedle(
  normalizedFull: string,
  normalizedNeedle: string,
): string | null {
  if (normalizedNeedle.length === 0) return null;
  if (normalizedFull.includes(normalizedNeedle)) return normalizedNeedle;
  const lengths = [200, 120, 80, 50, 30];
  for (const len of lengths) {
    if (normalizedNeedle.length <= len) continue;
    const shortened = normalizedNeedle.slice(0, len).trim();
    if (shortened.length < 15) continue;
    if (normalizedFull.includes(shortened)) return shortened;
  }
  return null;
}

type ViewportRect = { x: number; y: number; width: number; height: number };

type PdfPageViewerProps = {
  pdfUrl: string;
  page: number;
  highlightText?: string | null;
  className?: string;
};

/**
 * Renders a single PDF page with optional text highlight using PDF.js.
 * Falls back to iframe when PDF.js is unavailable or highlight is not needed.
 */
export function PdfPageViewer({
  pdfUrl,
  page,
  highlightText,
  className = "",
}: PdfPageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const scale = 1.5;

  const renderPdf = useCallback(async () => {
    const container = containerRef.current;
    if (!container || !pdfUrl || page < 1) return;

    let pdfjsLib: typeof import("pdfjs-dist");
    try {
      pdfjsLib = await import("pdfjs-dist");
      if (
        typeof pdfjsLib.GlobalWorkerOptions?.workerSrc !== "string" ||
        pdfjsLib.GlobalWorkerOptions.workerSrc.length === 0
      ) {
        const base = (appConfig.basePath ?? "").replace(/\/+$/, "");
        const workerPath = base ? `${base}/pdf-worker/` : "/pdf-worker/";
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
      }
    } catch {
      setError("PDF.js could not be loaded");
      return;
    }

    try {
      const isCrossOrigin =
        typeof window !== "undefined" &&
        (() => {
          try {
            return new URL(pdfUrl).origin !== window.location.origin;
          } catch {
            return true;
          }
        })();
      let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>;
      if (isCrossOrigin) {
        const base = (appConfig.basePath ?? "").replace(/\/+$/, "");
        const proxyUrl = base ? `${base}/pdf-document/` : "/pdf-document/";
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`PDF proxy failed: ${response.status}`);
        }
        const data = await response.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data });
        pdf = await loadingTask.promise;
      } else {
        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
        pdf = await loadingTask.promise;
      }
      const pageNum = Math.min(Math.max(1, page), pdf.numPages);
      const pdfPage = await pdf.getPage(pageNum);
      const viewport = pdfPage.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        setError("Canvas not supported");
        return;
      }
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const renderContext = {
        canvasContext: context,
        canvas,
        viewport,
      };
      await pdfPage.render(renderContext).promise;
      container.innerHTML = "";
      container.appendChild(canvas);

      const rects: ViewportRect[] = [];
      const wantHighlight =
        highlightText &&
        highlightText.length > 0 &&
        highlightText.length <= MAX_HIGHLIGHT_LENGTH;
      if (wantHighlight) {
        const textContent = await pdfPage.getTextContent();
        const items = textContent.items as Array<{
          str: string;
          transform: number[];
          width: number;
          height: number;
        }>;
        const normalizedParts = items.map((it) => normalizeForMatch(it.str));
        const normalizedFull = normalizedParts.join(" ");
        const normalizedNeedle = normalizeForMatch(highlightText);
        const matchedNeedle = findMatchingNeedle(normalizedFull, normalizedNeedle);
        const itemToRect = (i: number): ViewportRect => {
          const t = items[i].transform;
          const x = (Array.isArray(t) ? t[4] : 0) ?? 0;
          const y = (Array.isArray(t) ? t[5] : 0) ?? 0;
          const w = items[i].width ?? 0;
          const h = items[i].height ?? 0;
          const pdfYTop = y - h;
          const pdfRect = [x, pdfYTop, x + w, y] as [number, number, number, number];
          const [vx1, vy1, vx2, vy2] = viewport.convertToViewportRectangle(pdfRect);
          return {
            x: vx1,
            y: Math.min(vy1, vy2),
            width: Math.max(1, Math.abs(vx2 - vx1)),
            height: Math.max(1, Math.abs(vy2 - vy1)),
          };
        };
        if (matchedNeedle) {
          let charIndex = 0;
          const itemStarts: number[] = [];
          for (let i = 0; i < normalizedParts.length; i++) {
            itemStarts.push(charIndex);
            charIndex += normalizedParts[i].length + (i < normalizedParts.length - 1 ? 1 : 0);
          }
          const startChar = normalizedFull.indexOf(matchedNeedle);
          const endChar = startChar + matchedNeedle.length;
          for (let i = 0; i < items.length; i++) {
            const itemStart = itemStarts[i];
            const itemEnd = itemStart + normalizedParts[i].length;
            if (itemEnd <= startChar || itemStart >= endChar) continue;
            rects.push(itemToRect(i));
          }
        } else {
          for (let i = 0; i < Math.min(15, items.length); i++) {
            rects.push(itemToRect(i));
          }
        }
      }
      if (rects.length > 0) {
        const overlay = document.createElement("div");
        overlay.setAttribute("aria-hidden", "true");
        overlay.style.position = "absolute";
        overlay.style.left = "0";
        overlay.style.top = "0";
        overlay.style.width = `${viewport.width}px`;
        overlay.style.height = `${viewport.height}px`;
        overlay.style.pointerEvents = "none";
        overlay.style.zIndex = "10";
        for (const r of rects) {
          const div = document.createElement("div");
          div.style.position = "absolute";
          div.style.left = `${r.x}px`;
          div.style.top = `${r.y}px`;
          div.style.width = `${r.width}px`;
          div.style.height = `${r.height}px`;
          div.style.backgroundColor = "rgba(250, 204, 21, 0.45)";
          overlay.appendChild(div);
        }
        container.appendChild(overlay);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load PDF");
    }
  }, [pdfUrl, page, highlightText]);

  useEffect(() => {
    renderPdf();
  }, [renderPdf]);

  if (error) {
    const pdfSrc = `${pdfUrl}#page=${page}`;
    return (
      <div className={className}>
        <iframe
          src={pdfSrc}
          title={`WDR2026 PDF, page ${page}`}
          className="size-full min-h-[400px] border-0"
        />
      </div>
    );
  }

  return (
    <div className={`relative inline-block overflow-hidden ${className}`}>
      <div ref={containerRef} className="relative" />
    </div>
  );
}
