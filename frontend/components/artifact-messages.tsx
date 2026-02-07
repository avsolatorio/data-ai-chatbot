import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useRef } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import type { UIArtifact } from "./artifact";
import { PreviewMessage, ThinkingMessage } from "./message";

export type ArtifactMessagesProps = {
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  artifactStatus: UIArtifact["status"];
  /** When set, scroll the message list so this message (the one that triggered the artifact) is in view. */
  triggerMessageId?: string;
};

function PureArtifactMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  triggerMessageId,
}: ArtifactMessagesProps) {
  const triggerMessageRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledTriggerRef = useRef<string | undefined>(undefined);

  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    status,
    disableAutoScroll: !!triggerMessageId,
  });

  // When the artifact panel shows messages and we have a trigger message, scroll it into view (once per trigger).
  useEffect(() => {
    if (!triggerMessageId || messages.findIndex((m) => m.id === triggerMessageId) < 0) {
      return;
    }
    if (lastScrolledTriggerRef.current === triggerMessageId) {
      return;
    }
    lastScrolledTriggerRef.current = triggerMessageId;
    const t = setTimeout(() => {
      triggerMessageRef.current?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    }, 200);
    return () => clearTimeout(t);
  }, [triggerMessageId, messages]);

  return (
    <div
      className="flex h-full min-w-0 max-w-full flex-col items-center gap-4 overflow-y-scroll px-4 pt-20"
      ref={messagesContainerRef}
    >
      {messages.map((message, index) => {
        const isTrigger = message.id === triggerMessageId;
        const content = (
          <PreviewMessage
            chatId={chatId}
            isLoading={status === "streaming" && index === messages.length - 1}
            isReadonly={isReadonly}
            key={message.id}
            message={message}
            regenerate={regenerate}
            requiresScrollPadding={
              hasSentMessage && index === messages.length - 1
            }
            setMessages={setMessages}
            vote={
              votes
                ? votes.find((vote) => vote.messageId === message.id)
                : undefined
            }
          />
        );
        if (isTrigger) {
          return (
            <div key={message.id} ref={triggerMessageRef}>
              {content}
            </div>
          );
        }
        return content;
      })}

      <AnimatePresence mode="wait">
        {status === "submitted" && <ThinkingMessage key="thinking" />}
      </AnimatePresence>

      <motion.div
        className="min-h-[24px] min-w-[24px] shrink-0"
        onViewportEnter={onViewportEnter}
        onViewportLeave={onViewportLeave}
        ref={messagesEndRef}
      />
    </div>
  );
}

function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps
) {
  if (
    prevProps.artifactStatus === "streaming" &&
    nextProps.artifactStatus === "streaming"
  ) {
    return true;
  }

  if (prevProps.status !== nextProps.status) {
    return false;
  }
  if (prevProps.status && nextProps.status) {
    return false;
  }
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  if (!equal(prevProps.votes, nextProps.votes)) {
    return false;
  }
  if (prevProps.triggerMessageId !== nextProps.triggerMessageId) {
    return false;
  }

  return true;
}

export const ArtifactMessages = memo<ArtifactMessagesProps>(
  PureArtifactMessages,
  areEqual,
);
