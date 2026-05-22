"use client";

import { notFound, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import {
  type ChatData,
  ChatPageContent,
} from "@/app/(chat)/chat/[id]/chat-page-shared";
import { ReviewChatShell } from "@/components/review-chat-shell";
import { scrollToAndHighlightMessage } from "@/components/quoted-context-block";
import { useChatPageLoad } from "@/hooks/use-chat-page-load";
import { getSelectedChatModelFromCookie } from "@/lib/chat-model";

const CHAT_API_PATH = (id: string) => `/api/chat/${id}`;
const REVIEW_CHAT_API_PATH = (id: string) => `/api/feedback/review/chat/${id}`;

type ChatPageClientProps = {
  id: string;
  /** Owner/guest chat (default) or reviewer read-only full chat. */
  variant?: "default" | "review";
  /** When variant is review, scroll/highlight this message after load. */
  highlightMessageId?: string | null;
};

function ChatPageLoading({ label }: { label: string }) {
  return (
    <div className="flex h-dvh items-center justify-center text-muted-foreground">
      {label}
    </div>
  );
}

export function ChatPageClient({
  id,
  variant = "default",
  highlightMessageId = null,
}: ChatPageClientProps) {
  const router = useRouter();
  const isReview = variant === "review";
  const buildUrl = useCallback(
    isReview ? REVIEW_CHAT_API_PATH : CHAT_API_PATH,
    [isReview],
  );
  const state = useChatPageLoad(id, buildUrl);

  const scrolledMessageRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isReview || state.status !== "ok" || !highlightMessageId) return;
    if (scrolledMessageRef.current === highlightMessageId) return;
    scrolledMessageRef.current = highlightMessageId;
    const timer = window.setTimeout(() => {
      scrollToAndHighlightMessage(highlightMessageId);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [isReview, state.status, highlightMessageId]);

  if (state.status === "loading") {
    return (
      <ChatPageLoading
        label={isReview ? "Loading conversation…" : "Loading chat..."}
      />
    );
  }

  if (state.status === "error") {
    if (state.statusCode === 404 || state.statusCode === 403) {
      notFound();
    }
    if (isReview) {
      return (
        <div className="flex h-dvh items-center justify-center text-muted-foreground">
          Could not load conversation.
        </div>
      );
    }
    router.replace("/");
    return null;
  }

  const { chat, messages: messagesFromApi, isOwner } = state.data;
  const chatModel = getSelectedChatModelFromCookie();

  const content = (
    <ChatPageContent
      autoResume={!isReview}
      chat={chat}
      fillParentHeight={isReview}
      initialChatModel={chatModel}
      isOwner={isReview ? false : isOwner}
      messagesFromApi={messagesFromApi}
      reviewMode={isReview}
    />
  );

  if (isReview) {
    return (
      <ReviewChatShell
        chatTitle={chat.title}
        highlightMessageId={highlightMessageId}
      >
        {content}
      </ReviewChatShell>
    );
  }

  return content;
}
