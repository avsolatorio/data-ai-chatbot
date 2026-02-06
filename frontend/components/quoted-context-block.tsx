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
  "data-testid": dataTestId = "quoted-context",
}: QuotedContextBlockProps) {
  const textClasses = inverted ? invertedClasses : mutedClasses;
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

  return (
    <div
      className={cn("flex items-start gap-2 pl-4 text-sm", className)}
      data-testid={dataTestId}
    >
      {content}
    </div>
  );
}

const REGARDING_PREFIX = 'Regarding: "';
const REGARDING_END = '"\n\n';

/**
 * Parses user message text that was sent via "Ask about this".
 * Format: Regarding: "<quoted>"\n\n<question>
 * Returns { quoted, question } or null if the text doesn't match.
 */
export function parseRegardingPrompt(text: string): {
  quoted: string;
  question: string;
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
  const question = afterPrefix.slice(endIdx + REGARDING_END.length).trim();
  return { quoted, question };
}
