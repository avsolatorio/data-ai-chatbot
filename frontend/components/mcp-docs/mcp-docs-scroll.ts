/** Scroll container for /about/mcp (nested overflow, not window). */
export function getMcpDocsScrollRoot(): HTMLElement | null {
  const marked = document.querySelector<HTMLElement>(
    "[data-mcp-docs-scroll-root]",
  );
  if (marked) {
    return marked;
  }

  const docs = document.querySelector(".mcp-docs");
  if (!docs) {
    return null;
  }

  let element: HTMLElement | null = docs.parentElement;
  while (element) {
    const { overflowY } = getComputedStyle(element);
    if (overflowY === "auto" || overflowY === "scroll") {
      return element;
    }
    element = element.parentElement;
  }

  return null;
}

export function scrollMcpDocsToTop(behavior: ScrollBehavior = "smooth"): void {
  const root = getMcpDocsScrollRoot();
  if (root) {
    root.scrollTo({ top: 0, behavior });
    return;
  }
  window.scrollTo({ top: 0, behavior });
}

export function scrollMcpDocsToId(
  id: string,
  behavior: ScrollBehavior = "smooth",
): void {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior, block: "start" });
}

export function getMcpDocsScrollTop(): number {
  const root = getMcpDocsScrollRoot();
  return root ? root.scrollTop : window.scrollY;
}

export function isMcpDocsNearBottom(threshold = 48): boolean {
  const root = getMcpDocsScrollRoot();
  if (root) {
    return root.scrollTop + root.clientHeight >= root.scrollHeight - threshold;
  }
  return (
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - threshold
  );
}

export function getMcpDocsHeaderOffset(): number {
  const docs = document.querySelector(".mcp-docs");
  const styles = docs
    ? getComputedStyle(docs)
    : getComputedStyle(document.documentElement);
  const offset = Number.parseFloat(styles.getPropertyValue("--scroll-offset"));
  return Number.isFinite(offset) ? offset : 80;
}

export function getMcpDocsScrollMarker(): number {
  const headerOffset = getMcpDocsHeaderOffset();
  const root = getMcpDocsScrollRoot();
  const viewportHeight = root ? root.clientHeight : window.innerHeight;
  const viewportBand = Math.min(viewportHeight * 0.28, 220);
  return headerOffset + viewportBand;
}
