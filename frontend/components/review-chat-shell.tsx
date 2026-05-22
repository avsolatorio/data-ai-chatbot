"use client";

import type { ReactNode } from "react";
import { ReviewChatBanner } from "@/components/review-chat-banner";

type ReviewChatShellProps = {
  chatTitle: string;
  highlightMessageId?: string | null;
  children: ReactNode;
};

/** Layout wrapper for reviewer full-chat view (banner + scrollable chat area). */
export function ReviewChatShell({
  chatTitle,
  highlightMessageId,
  children,
}: ReviewChatShellProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <ReviewChatBanner
        chatTitle={chatTitle}
        highlightMessageId={highlightMessageId}
      />
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
