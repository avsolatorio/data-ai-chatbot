import { useCallback, useEffect, useRef, useState } from "react";

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const lastScrollTimeRef = useRef(0);

  // Keep ref in sync with state
  useEffect(() => {
    isAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) {
      return true;
    }
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 20;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!containerRef.current) {
      return;
    }
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior,
    });
  }, []);

  // Handle user scroll events — throttle to rAF so we don't read layout every event; state only when scroll settles
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let scrollTimeout: ReturnType<typeof setTimeout>;
    let rafId: number | null = null;

    const handleScroll = () => {
      lastScrollTimeRef.current = Date.now();
      isUserScrollingRef.current = true;
      clearTimeout(scrollTimeout);

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const atBottom = checkIfAtBottom();
          isAtBottomRef.current = atBottom;
        });
      }

      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false;
        setIsAtBottom(isAtBottomRef.current);
      }, 200);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [checkIfAtBottom]);

  // Auto-scroll when content changes (debounced to avoid jumpiness with virtual lists)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const DEBOUNCE_MS = 250;
    const SCROLL_COOLDOWN_MS = 500;

    const scrollToBottomIfNeeded = () => {
      if (!containerRef.current) return;
      if (!isAtBottomRef.current || isUserScrollingRef.current) return;
      if (Date.now() - lastScrollTimeRef.current < SCROLL_COOLDOWN_MS) return;
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "instant",
        });
        setIsAtBottom(true);
        isAtBottomRef.current = true;
      });
    };

    const scheduleScrollIfNeeded = () => {
      if (debounceTimer !== null) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        scrollToBottomIfNeeded();
      }, DEBOUNCE_MS);
    };

    const mutationObserver = new MutationObserver(scheduleScrollIfNeeded);
    mutationObserver.observe(container, {
      childList: true,
      subtree: false,
    });

    const resizeObserver = new ResizeObserver((entries) => {
      const isContainerResize = entries.some((e) => e.target === container);
      if (!isContainerResize) return;
      scheduleScrollIfNeeded();
    });
    resizeObserver.observe(container);

    return () => {
      if (debounceTimer !== null) clearTimeout(debounceTimer);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  function onViewportEnter() {
    setIsAtBottom(true);
    isAtBottomRef.current = true;
  }

  function onViewportLeave() {
    setIsAtBottom(false);
    isAtBottomRef.current = false;
  }

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  };
}
