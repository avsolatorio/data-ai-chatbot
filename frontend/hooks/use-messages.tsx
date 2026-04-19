import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { useScrollToBottom } from "./use-scroll-to-bottom";

export function useMessages({
  status,
  disableAutoScroll,
}: {
  status: UseChatHelpers<ChatMessage>["status"];
  /** When true, do not auto-scroll to bottom on content change (e.g. when artifact panel should show trigger message). */
  disableAutoScroll?: boolean;
}) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    isScrollSettled,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom({ disableAutoScroll });

  const [hasSentMessage, setHasSentMessage] = useState(false);

  useEffect(() => {
    if (status === "submitted") {
      setHasSentMessage(true);
    }
  }, [status]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    isScrollSettled,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
}
