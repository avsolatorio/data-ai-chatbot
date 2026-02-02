import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { ArrowDownIcon } from "lucide-react";
import { memo } from "react";
import type { ProcessingStage } from "@/hooks/use-data-thinking-stream";
import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { useDataStream } from "./data-stream-provider";
import { PreviewMessage, ThinkingMessage } from "./message";

type MessagesProps = {
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  sendMessage?: UseChatHelpers<ChatMessage>["sendMessage"];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  isWaitingForSavedParts?: boolean;
  selectedModelId: string;
  streamingThinkingStage?: ProcessingStage | null;
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
  sendMessage,
  setMessages,
  regenerate,
  isReadonly,
  isWaitingForSavedParts = false,
  selectedModelId: _selectedModelId,
  streamingThinkingStage = null,
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
          {messages.map((message, index) => {
            const isLoading =
              status === "streaming" && messages.length - 1 === index;
            // Pass streaming parts to messages that need them:
            // 1. The last message (currently streaming or just finished)
            // 2. Previous messages that don't have saved parts yet
            const isLastMessage = index === messages.length - 1;
            // Check if message has saved thinking parts
            const hasSavedThinkingParts =
              message.parts?.some(
                (part) =>
                  typeof part.type === "string" &&
                  part.type.startsWith("data-thinking"),
              ) ?? false;
            // Use streaming parts only for the last message
            // Use streaming parts if: we have them AND (we're loading OR no saved parts OR waiting for saved parts)
            const shouldUseStreamingParts =
              isLastMessage &&
              streamingThinkingParts.length > 0 &&
              (isLoading || !hasSavedThinkingParts || isWaitingForSavedParts);

            return (
              <PreviewMessage
                chatId={chatId}
                isLoading={isLoading}
                isReadonly={isReadonly}
                key={message.id}
                message={message}
                regenerate={regenerate}
                sendMessage={sendMessage}
                requiresScrollPadding={
                  hasSentMessage && index === messages.length - 1
                }
                setMessages={setMessages}
                isWaitingForSavedParts={isWaitingForSavedParts}
                streamingThinkingStage={
                  shouldUseStreamingParts ? streamingThinkingStage : null
                }
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
  if (prevProps.streamingThinkingStage !== nextProps.streamingThinkingStage) {
    return false;
  }
  if (prevProps.sendMessage !== nextProps.sendMessage) {
    return false;
  }

  return false;
});
