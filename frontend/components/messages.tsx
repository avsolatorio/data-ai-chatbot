import type { UseChatHelpers } from "@ai-sdk/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import equal from "fast-deep-equal";
import { ArrowDownIcon } from "lucide-react";
import { memo, useCallback, useEffect, useRef } from "react";
import { useArtifactSelector } from "@/hooks/use-artifact";
import type { ProcessingStage } from "@/hooks/use-data-thinking-stream";
import { useMessages } from "@/hooks/use-messages";
import { appConfig } from "@/lib/config";
import type { Vote } from "@/lib/db/schema";
import { getStreamingThinkingScrollFingerprint } from "@/lib/streaming-thinking-scroll-fingerprint";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { useDataStream } from "./data-stream-provider";
import { PreviewMessage, ThinkingMessage } from "./message";
import { scrollToAndHighlightMessage } from "./quoted-context-block";

const ROW_GAP = 16;
const ESTIMATE_SIZE = 200;
const OVERSCAN = 3;

type MessagesProps = {
  chatId: string;
  followUpSuggestionsPopulateInput: boolean;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  onFollowUpPopulateInput?: (text: string) => void;
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
  /** Stream usage for the last assistant message until lastContext refetch */
  lastMessageUsage?: AppUsage;
  /** Per-message usage from lastContext.byMessageId */
  usageByMessageId?: Record<string, AppUsage>;
};

function PureMessages({
  chatId,
  followUpSuggestionsPopulateInput,
  status,
  votes,
  messages,
  onFollowUpPopulateInput,
  sendMessage,
  setMessages,
  regenerate,
  isReadonly,
  isArtifactVisible,
  isWaitingForSavedParts = false,
  selectedModelId: _selectedModelId,
  streamingThinkingStage = null,
  streamingThinkingParts = [],
  lastMessageUsage,
  usageByMessageId,
}: MessagesProps) {
  const artifactScrollBehavior = appConfig.artifactScrollBehavior;
  const artifactTriggerMessageId = useArtifactSelector(
    (state) => state.triggerMessageId,
  );
  const prevArtifactVisibleRef = useRef(isArtifactVisible);
  const lastTriggerMessageIdRef = useRef<string | undefined>(undefined);
  const hasScrolledInitialForChatRef = useRef(false);
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

  const virtualItemCount = messages.length + (status === "submitted" ? 1 : 0);

  const virtualizer = useVirtualizer({
    count: virtualItemCount,
    getScrollElement: () => messagesContainerRef.current,
    estimateSize: () => ESTIMATE_SIZE + ROW_GAP,
    overscan: OVERSCAN,
    getItemKey: (index) =>
      index < messages.length ? messages[index].id : "thinking",
    measureElement:
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (el) =>
            (el?.getBoundingClientRect().height ?? ESTIMATE_SIZE) + ROW_GAP
        : undefined,
  });

  // Smooth scroll to bottom when user sends a new message (status becomes "submitted")
  useEffect(() => {
    if (status !== "submitted" || virtualItemCount === 0) {
      return;
    }
    requestAnimationFrame(() => {
      virtualizer.scrollToIndex(virtualItemCount - 1, {
        align: "end",
        behavior: "smooth",
      });
    });
  }, [status, virtualItemCount, virtualizer]);

  // When artifact panel opens: store trigger message id so we can show it when the panel closes (chat is hidden while artifact is open). When panel closes: scroll to trigger message if we have one, otherwise scroll to bottom if behavior is "bottom".
  useEffect(() => {
    const wasVisible = prevArtifactVisibleRef.current;
    prevArtifactVisibleRef.current = isArtifactVisible;

    if (!wasVisible && isArtifactVisible && artifactTriggerMessageId) {
      lastTriggerMessageIdRef.current = artifactTriggerMessageId;
      return undefined;
    }

    if (wasVisible && !isArtifactVisible && virtualItemCount > 0) {
      const triggerId = lastTriggerMessageIdRef.current;
      lastTriggerMessageIdRef.current = undefined;
      if (triggerId) {
        const index = messages.findIndex((m) => m.id === triggerId);
        if (index >= 0) {
          const t = setTimeout(() => {
            virtualizer.scrollToIndex(index, {
              align: "start",
              behavior: "auto",
            });
          }, 150);
          return () => clearTimeout(t);
        }
      }
      if (artifactScrollBehavior === "bottom") {
        const t = setTimeout(() => {
          virtualizer.scrollToIndex(virtualItemCount - 1, {
            align: "end",
            behavior: "auto",
          });
          scrollToBottom("auto");
        }, 150);
        return () => clearTimeout(t);
      }
    }
  }, [
    isArtifactVisible,
    artifactScrollBehavior,
    artifactTriggerMessageId,
    messages,
    virtualItemCount,
    virtualizer,
    scrollToBottom,
  ]);

  // Scroll to bottom on load/refresh when conversation already has messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset initial-scroll flag when switching chats
  useEffect(() => {
    hasScrolledInitialForChatRef.current = false;
  }, [chatId]);
  useEffect(() => {
    if (
      virtualItemCount === 0 ||
      status !== "ready" ||
      hasScrolledInitialForChatRef.current
    ) {
      return;
    }
    hasScrolledInitialForChatRef.current = true;
    const t = setTimeout(() => {
      virtualizer.scrollToIndex(virtualItemCount - 1, {
        align: "end",
        behavior: "auto",
      });
    }, 100);
    return () => clearTimeout(t);
  }, [virtualItemCount, status, virtualizer]);

  // Last assistant text length (main message row grows while streaming).
  const lastMessageTextLength =
    messages.length > 0
      ? (messages.at(-1)?.parts ?? [])
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .reduce((sum, p) => sum + (p.text?.length ?? 0), 0)
      : 0;

  // Stick-to-bottom while streaming (FE-003): only when the user is already at the bottom
  // (`isAtBottom`). If they scroll up to read history, we do not force the viewport back
  // down. A future product flag could add "always follow during thinking" if needed.
  const streamingThinkingScrollKey = getStreamingThinkingScrollFingerprint(
    streamingThinkingStage,
    streamingThinkingParts,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps re-run when message or thinking content appends
  useEffect(() => {
    if (
      (status !== "streaming" && status !== "submitted") ||
      !isAtBottom ||
      virtualItemCount === 0
    ) {
      return;
    }
    virtualizer.scrollToIndex(virtualItemCount - 1, {
      align: "end",
      behavior: "auto",
    });
  }, [
    status,
    isAtBottom,
    virtualItemCount,
    virtualizer,
    lastMessageTextLength,
    streamingThinkingScrollKey,
  ]);

  // Scroll to a message by ID then highlight (for "go to response" / quoted block click in virtualized list)
  const onScrollToMessageId = useCallback(
    (messageId: string) => {
      const index = messages.findIndex((m) => m.id === messageId);
      if (index < 0) return;
      virtualizer.scrollToIndex(index, {
        align: "start",
        behavior: "auto",
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToAndHighlightMessage(messageId, { scroll: false });
        });
      });
    },
    [messages, virtualizer],
  );

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="relative flex-1">
      <div
        className="absolute inset-0 touch-pan-y overflow-y-auto"
        ref={messagesContainerRef}
      >
        <div
          className="mx-auto min-w-0 max-w-4xl px-2 py-4 md:px-4"
          ref={messagesEndRef}
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
            width: "100%",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const index = virtualRow.index;
            if (index >= messages.length) {
              return (
                <div
                  key="thinking"
                  className="mb-4 md:mb-6"
                  data-index={index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    willChange: "transform",
                  }}
                >
                  <ThinkingMessage />
                </div>
              );
            }

            const message = messages[index];
            const isLoading =
              status === "streaming" && messages.length - 1 === index;
            const isLastMessage = index === messages.length - 1;
            const isLastAssistantMessage =
              isLastMessage && message.role === "assistant";
            const hasSavedThinkingParts =
              message.parts?.some(
                (part) =>
                  typeof part.type === "string" &&
                  part.type.startsWith("data-thinking"),
              ) ?? false;
            const shouldUseStreamingParts =
              isLastMessage &&
              streamingThinkingParts.length > 0 &&
              (isLoading || !hasSavedThinkingParts || isWaitingForSavedParts);

            return (
              <div
                key={message.id}
                className="mb-4 md:mb-6"
                data-index={index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  willChange: "transform",
                }}
              >
                <PreviewMessage
                  chatId={chatId}
                  followUpSuggestionsPopulateInput={
                    followUpSuggestionsPopulateInput
                  }
                  isLoading={isLoading}
                  isReadonly={isReadonly}
                  message={message}
                  onFollowUpPopulateInput={onFollowUpPopulateInput}
                  onScrollToMessageId={onScrollToMessageId}
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
                  usageOverride={
                    message.role === "assistant"
                      ? (usageByMessageId?.[message.id] ??
                        (isLastAssistantMessage ? lastMessageUsage : undefined))
                      : undefined
                  }
                  vote={
                    votes
                      ? votes.find((vote) => vote.messageId === message.id)
                      : undefined
                  }
                />
              </div>
            );
          })}
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
  if (prevProps.isArtifactVisible !== nextProps.isArtifactVisible) {
    return false;
  }

  // While streaming, always re-render so streamed message.parts (no data-thinking) are shown incrementally
  if (nextProps.status === "streaming") {
    return false;
  }

  if (prevProps.chatId !== nextProps.chatId) {
    return false;
  }
  if (prevProps.status !== nextProps.status) {
    return false;
  }
  if (prevProps.selectedModelId !== nextProps.selectedModelId) {
    return false;
  }
  if (prevProps.isReadonly !== nextProps.isReadonly) {
    return false;
  }
  if (prevProps.isWaitingForSavedParts !== nextProps.isWaitingForSavedParts) {
    return false;
  }
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  if (!equal(prevProps.messages, nextProps.messages)) {
    return false;
  }
  if (!equal(prevProps.lastMessageUsage, nextProps.lastMessageUsage)) {
    return false;
  }
  if (!equal(prevProps.usageByMessageId, nextProps.usageByMessageId)) {
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
  if (
    prevProps.followUpSuggestionsPopulateInput !==
    nextProps.followUpSuggestionsPopulateInput
  ) {
    return false;
  }
  if (prevProps.onFollowUpPopulateInput !== nextProps.onFollowUpPopulateInput) {
    return false;
  }

  return true;
});
