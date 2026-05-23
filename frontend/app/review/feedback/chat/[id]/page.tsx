"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChatPageClient } from "@/components/chat-page-client";

function ReviewFeedbackChatPageContent() {
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

export default function ReviewFeedbackChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-sm">Loading review...</div>}>
      <ReviewFeedbackChatPageContent />
    </Suspense>
  );
}
