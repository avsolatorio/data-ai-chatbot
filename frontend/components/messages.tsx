import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { ArrowDownIcon } from "lucide-react";
import { memo } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { useDataStream } from "./data-stream-provider";
import { Greeting } from "./greeting";
import { PreviewMessage, ThinkingMessage } from "./message";

type MessagesProps = {
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  isWaitingForSavedParts?: boolean;
  selectedModelId: string;
  streamingThinkingParts?: Array<{
    type: string;
    id: string;
    data: ChatMessage["parts"][number];
  }>;
};

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  isWaitingForSavedParts = false,
  selectedModelId: _selectedModelId,
  streamingThinkingParts = [],
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    scrollToBottom,
    hasSentMessage,
  } = useMessages({
    status,
  });

  useDataStream();

  return (
    <div className="relative flex-1">
      <div
        className="absolute inset-0 touch-pan-y overflow-y-auto"
        ref={messagesContainerRef}
      >
        <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
          {messages.length === 0 && <Greeting />}

          {messages.map((message, index) => {
            const isLoading =
              status === "streaming" && messages.length - 1 === index;
            // Pass streaming parts to the last message (the one that was just streamed)
            // This keeps streaming parts visible until saved parts are available
            const isLastMessage = index === messages.length - 1;
            // Check if message has saved thinking parts
            const hasSavedThinkingParts =
              message.parts?.some(
                (part) =>
                  typeof part.type === "string" &&
                  part.type.startsWith("data-thinking"),
              ) ?? false;
            // Use streaming parts if:
            // 1. It's the last message AND
            // 2. We have streaming parts AND
            // 3. Either we're waiting for saved parts OR we're still loading OR we don't have saved parts yet
            // Priority: isWaitingForSavedParts first to prevent flicker
            const shouldUseStreamingParts =
              isLastMessage &&
              streamingThinkingParts.length > 0 &&
              (isWaitingForSavedParts || isLoading || !hasSavedThinkingParts);

            return (
              <PreviewMessage
                chatId={chatId}
                isLoading={isLoading}
                isReadonly={isReadonly}
                key={message.id}
                message={message}
                regenerate={regenerate}
                requiresScrollPadding={
                  hasSentMessage && index === messages.length - 1
                }
                setMessages={setMessages}
                isWaitingForSavedParts={isWaitingForSavedParts}
                streamingThinkingParts={
                  shouldUseStreamingParts ? streamingThinkingParts : []
                }
                vote={
                  votes
                    ? votes.find((vote) => vote.messageId === message.id)
                    : undefined
                }
              />
            );
          })}

          {status === "submitted" && <ThinkingMessage />}

          <div
            className="min-h-[24px] min-w-[24px] shrink-0"
            ref={messagesEndRef}
          />
        </div>
      </div>

      <button
        aria-label="Scroll to bottom"
        className={`-translate-x-1/2 absolute bottom-4 left-1/2 z-10 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted ${
          isAtBottom
            ? "pointer-events-none scale-0 opacity-0"
            : "pointer-events-auto scale-100 opacity-100"
        }`}
        onClick={() => scrollToBottom("smooth")}
        type="button"
      >
        <ArrowDownIcon className="size-4" />
      </button>
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) {
    return true;
  }

  if (prevProps.status !== nextProps.status) {
    return false;
  }
  if (prevProps.selectedModelId !== nextProps.selectedModelId) {
    return false;
  }
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  if (!equal(prevProps.messages, nextProps.messages)) {
    return false;
  }
  if (!equal(prevProps.votes, nextProps.votes)) {
    return false;
  }
  if (
    !equal(prevProps.streamingThinkingParts, nextProps.streamingThinkingParts)
  ) {
    return false;
  }

  return false;
});
