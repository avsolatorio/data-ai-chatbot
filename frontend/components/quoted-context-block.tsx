"use client";

import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export type QuotedContextBlockProps = {
  quotedText: string;
  className?: string;
  /** Optional dismiss button (e.g. for the input area). Not shown in message view. */
  onDismiss?: () => void;
  /** When true, no line clamp so full quote is visible (e.g. in sent message). */
  expand?: boolean;
  /** When true, use light text (e.g. when inside a colored user message bubble). */
  inverted?: boolean;
  /** When set with onQuoteClick, the block is clickable and scrolls to / highlights the source message. */
  sourceMessageId?: string | null;
  /** Called when the quoted block is clicked and sourceMessageId is set. */
  onQuoteClick?: (sourceMessageId: string) => void;
  "data-testid"?: string;
};

/**
 * Renders the "ask about this" quoted context UI: curved arrow (↳) + muted
 * markdown block. Used in the input area and in user messages that were
 * sent via "Ask about this".
 */
const mutedClasses =
  "text-muted-foreground [&_strong]:text-muted-foreground";
const invertedClasses =
  "text-white/90 [&_strong]:text-white";

export function QuotedContextBlock({
  quotedText,
  className,
  onDismiss,
  expand = false,
  inverted = false,
  sourceMessageId = null,
  onQuoteClick,
  "data-testid": dataTestId = "quoted-context",
}: QuotedContextBlockProps) {
  const textClasses = inverted ? invertedClasses : mutedClasses;
  const isClickable =
    sourceMessageId != null &&
    sourceMessageId.length > 0 &&
    onQuoteClick != null;

  const content = (
    <>
      <span
        className={cn("shrink-0", inverted ? "text-white/90" : "text-muted-foreground")}
        aria-hidden
      >
        ↳
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "break-words [&_p]:my-0 [&_strong]:font-semibold",
            textClasses,
            expand ? "" : "line-clamp-3",
          )}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <span className="block">{children}</span>
              ),
            }}
            remarkPlugins={[remarkGfm]}
          >
            {quotedText.trim()}
          </ReactMarkdown>
        </div>
      </div>
      {onDismiss != null && (
        <button
          aria-label="Remove quoted text"
          className={cn(
            "shrink-0 rounded p-1 transition-colors",
            inverted
              ? "text-white/90 hover:bg-white/20 hover:text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          onClick={onDismiss}
          type="button"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </>
  );

  const wrapperClassName = cn(
    "flex items-start gap-2 pl-4 text-left text-sm",
    isClickable &&
      "w-full cursor-pointer rounded-md transition-colors hover:bg-muted/60",
    className,
  );

  if (isClickable) {
    return (
      <button
        aria-label="Scroll to source message and highlight"
        className={wrapperClassName}
        data-testid={dataTestId}
        type="button"
        onClick={() => {
          onQuoteClick?.(sourceMessageId as string);
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={wrapperClassName} data-testid={dataTestId}>
      {content}
    </div>
  );
}

const REGARDING_PREFIX = 'Regarding: "';
const REGARDING_END = '"\n\n';
const REF_LINE_REGEX = /^\s*\[ref:([^\]]+)\]\s*\n?\s*/;

/**
 * Parses user message text that was sent via "Ask about this".
 * Format: Regarding: "<quoted>"\n\n[ref:messageId]\n\n<question> or without ref.
 * Returns { quoted, question, sourceMessageId } or null if the text doesn't match.
 */
export function parseRegardingPrompt(text: string): {
  quoted: string;
  question: string;
  sourceMessageId: string | null;
} | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith(REGARDING_PREFIX)) {
    return null;
  }
  const afterPrefix = trimmed.slice(REGARDING_PREFIX.length);
  const endIdx = afterPrefix.indexOf(REGARDING_END);
  if (endIdx === -1) {
    return null;
  }
  const quoted = afterPrefix.slice(0, endIdx).trim();
  const rest = afterPrefix.slice(endIdx + REGARDING_END.length);
  const refMatch = rest.match(REF_LINE_REGEX);
  const sourceMessageId = refMatch != null ? refMatch[1] ?? null : null;
  const question = (refMatch != null ? rest.slice(refMatch[0].length) : rest).trim();
  return { quoted, question, sourceMessageId };
}

/** Matches \n\n[ref:messageId]\n\n in the full message text. */
const REF_STRIP_REGEX = /\n\n\[ref:[^\]]+\]\n\n/;

/**
 * Strips the [ref:messageId] line from message text so the model doesn't receive it.
 */
export function stripRefFromRegardingText(text: string): string {
  return text.replace(REF_STRIP_REGEX, "\n\n");
}

const HIGHLIGHT_CLASSES = [
  "ring-2",
  "ring-yellow-400/60",
  "ring-offset-2",
  "rounded-lg",
] as const;
const HIGHLIGHT_DURATION_MS = 2000;

export type ScrollToAndHighlightOptions = {
  /** When false, only highlight (caller already scrolled). Default true. */
  scroll?: boolean;
};

/**
 * Scrolls to the message with the given id and briefly highlights it.
 * Call this when the user clicks the quoted block in a user message.
 */
export function scrollToAndHighlightMessage(
  sourceMessageId: string,
  options?: ScrollToAndHighlightOptions,
): void {
  if (typeof document === "undefined") return;
  const el = document.querySelector(
    `[data-message-id="${sourceMessageId}"]`,
  ) as HTMLElement | null;
  if (!el) return;
  const shouldScroll = options?.scroll !== false;
  if (shouldScroll) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  for (const c of HIGHLIGHT_CLASSES) {
    el.classList.add(c);
  }
  window.setTimeout(() => {
    for (const c of HIGHLIGHT_CLASSES) {
      el.classList.remove(c);
    }
  }, HIGHLIGHT_DURATION_MS);
}
