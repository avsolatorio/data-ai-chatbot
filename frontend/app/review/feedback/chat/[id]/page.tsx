"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ChatPageClient } from "@/components/chat-page-client";

export default function ReviewFeedbackChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = typeof params.id === "string" ? params.id : "";

  return (
    <ChatPageClient
      highlightMessageId={searchParams.get("messageId")}
      id={id}
      variant="review"
    />
  );
}
