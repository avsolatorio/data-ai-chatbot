"use client";

import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import type { Chat as DBChat, DBMessage } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { normalizeMessagesFromApi } from "@/lib/chat-messages";

export type ChatData = {
  chat: DBChat;
  messages: DBMessage[];
  isOwner: boolean;
};

type ChatPageContentProps = {
  chat: DBChat;
  /** Pre-normalized UI messages (when provided, messagesFromApi is ignored). */
  initialMessages?: ChatMessage[];
  /** Raw API messages; normalized inside this client component when initialMessages is not provided. */
  messagesFromApi?: ChatData["messages"];
  initialChatModel: string;
  isOwner: boolean;
};

/**
 * Presentational component: renders Chat + DataStreamHandler from resolved chat data.
 * Used by both server (guest) and client (MSAL) chat loaders.
 * Server passes messagesFromApi (raw); client passes initialMessages (already normalized)
 * or messagesFromApi. Normalization runs only on the client.
 */
export function ChatPageContent({
  chat,
  initialMessages,
  messagesFromApi,
  initialChatModel,
  isOwner,
}: ChatPageContentProps) {
  const uiMessages =
    initialMessages ??
    (messagesFromApi ? normalizeMessagesFromApi(chat, messagesFromApi) : []);
  return (
    <>
      <Chat
        autoResume={true}
        id={chat.id}
        initialChatModel={initialChatModel}
        initialMessages={uiMessages}
        initialVisibilityType={chat.visibility}
        isReadonly={!isOwner}
        lastContext={chat.lastContext ?? undefined}
      />
      <DataStreamHandler />
    </>
  );
}
