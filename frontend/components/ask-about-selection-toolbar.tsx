"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SELECTION_CONTEXT_ATTR = "data-ask-about-context";
const MESSAGE_ID_ATTR = "data-message-id";

type SelectionState = {
  text: string;
  rect: DOMRect;
  sourceMessageId: string | null;
} | null;

function getSelectionInContext(): SelectionState {
  if (typeof document === "undefined") {
    return null;
  }
  const selection = document.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }
  const text = selection.toString().trim();
  if (!text) {
    return null;
  }
  const range = selection.getRangeAt(0);
  const startContainer = range.startContainer;
  const contextEl = startContainer.nodeType === Node.TEXT_NODE
    ? (startContainer.parentElement?.closest(`[${SELECTION_CONTEXT_ATTR}]`) ?? null)
    : (startContainer as Element).closest?.(`[${SELECTION_CONTEXT_ATTR}]`) ?? null;
  if (!contextEl) {
    return null;
  }
  const messageEl = contextEl.closest(`[${MESSAGE_ID_ATTR}]`);
  const sourceMessageId =
    messageEl instanceof Element
      ? messageEl.getAttribute(MESSAGE_ID_ATTR)
      : null;
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return null;
  }
  return { text, rect, sourceMessageId };
}

export type AskAboutSelectionToolbarProps = {
  onAskAbout: (selectedText: string, sourceMessageId?: string | null) => void;
  disabled?: boolean;
  className?: string;
};

export function AskAboutSelectionToolbar({
  onAskAbout,
  disabled = false,
  className,
}: AskAboutSelectionToolbarProps) {
  const [state, setState] = useState<SelectionState>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Keep latest selected text in a ref so we can read it in mousedown even after
  // selectionchange has already cleared the selection and set state to null.
  const lastSelectedTextRef = useRef<string | null>(null);

  const lastSourceMessageIdRef = useRef<string | null>(null);

  const updateSelection = useCallback(() => {
    const next = getSelectionInContext();
    if (next) {
      lastSelectedTextRef.current = next.text;
      lastSourceMessageIdRef.current = next.sourceMessageId ?? null;
    } else {
      lastSelectedTextRef.current = null;
      lastSourceMessageIdRef.current = null;
    }
    setState((prev) => {
      if (!next) return null;
      if (prev?.text === next.text && prev.rect.y === next.rect.y && prev.rect.x === next.rect.x) {
        return prev;
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    document.getSelection()?.removeAllRanges();
    lastSelectedTextRef.current = null;
    lastSourceMessageIdRef.current = null;
    setState(null);
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateSelection();
    };
    const handleMouseUp = () => {
      requestAnimationFrame(updateSelection);
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [updateSelection]);

  const handleAskAbout = useCallback(
    (event?: React.MouseEvent) => {
      event?.preventDefault();
      const text = lastSelectedTextRef.current ?? state?.text ?? null;
      if (!text) return;
      const sourceMessageId =
        lastSourceMessageIdRef.current ?? state?.sourceMessageId ?? null;
      onAskAbout(text, sourceMessageId);
      clearSelection();
    },
    [state?.text, state?.sourceMessageId, onAskAbout, clearSelection],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        clearSelection();
      }
    },
    [clearSelection],
  );

  if (!state || disabled || typeof document === "undefined") {
    return null;
  }

  const toolbar = (
    <div
      className={cn(
        "fixed z-50 flex items-center gap-1 rounded-lg border border-border bg-background px-1 py-1 shadow-lg",
        className,
      )}
      role="toolbar"
      aria-label="Ask about selection"
      style={{
        left: state.rect.left,
        top: state.rect.top - 44,
        minWidth: "max-content",
      }}
      onKeyDown={handleKeyDown}
    >
      <Button
        ref={buttonRef}
        aria-label="Ask about this"
        className="h-8 gap-1.5 px-2.5 text-xs font-medium"
        onMouseDown={(e) => {
          e.preventDefault();
          handleAskAbout(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleAskAbout();
          }
        }}
        size="sm"
        type="button"
        variant="secondary"
      >
        <MessageCircleIcon className="size-3.5" aria-hidden />
        Ask about this
      </Button>
    </div>
  );

  return createPortal(toolbar, document.body);
}

/**
 * Add this attribute to a container that wraps assistant message content
 * so the "Ask about this" toolbar only appears when the user selects text
 * inside that container.
 */
export const ASK_ABOUT_SELECTION_CONTEXT_ATTR = SELECTION_CONTEXT_ATTR;
