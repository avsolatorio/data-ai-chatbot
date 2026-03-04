"use client";

import { notFound, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ChatData,
  ChatPageContent,
  normalizeMessagesFromApi,
} from "@/app/(chat)/chat/[id]/chat-page-shared";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { apiFetch } from "@/lib/api-client";

function getChatModelFromDocument(): string {
  if (typeof document === "undefined") return DEFAULT_CHAT_MODEL;
  const match = document.cookie.match(/\bchat-model=([^;]*)/);
  return match?.[1]?.trim() || DEFAULT_CHAT_MODEL;
}

export function ChatPageClient({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; statusCode: number }
    | { status: "ok"; data: ChatData }
  >({ status: "loading" });

  const load = useCallback(async () => {
    const response = await apiFetch(`/api/chat/${id}`, {
      credentials: "include",
    });
    if (response.status === 404 || response.status === 403) {
      setState({ status: "error", statusCode: response.status });
      return;
    }
    if (!response.ok) {
      setState({ status: "error", statusCode: response.status });
      return;
    }
    const data = (await response.json()) as ChatData;
    setState({ status: "ok", data });
  }, [id]);

  // Avoid duplicate fetch when React Strict Mode double-invokes the effect.
  const loadedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (loadedIdRef.current === id) return;
    loadedIdRef.current = id;
    load();
  }, [id, load]);

  if (state.status === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center text-muted-foreground">
        Loading chat...
      </div>
    );
  }

  if (state.status === "error") {
    if (state.statusCode === 404 || state.statusCode === 403) {
      notFound();
    }
    router.replace("/");
    return null;
  }

  const { chat, messages: messagesFromApi, isOwner } = state.data;
  const uiMessages = normalizeMessagesFromApi(chat, messagesFromApi);
  const chatModel = getChatModelFromDocument();

  return (
    <ChatPageContent
      chat={chat}
      initialChatModel={chatModel}
      initialMessages={uiMessages}
      isOwner={isOwner}
    />
  );
}
