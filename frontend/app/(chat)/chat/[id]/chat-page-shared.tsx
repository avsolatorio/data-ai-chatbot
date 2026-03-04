"use client";

import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import type { Chat as DBChat, DBMessage } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages } from "@/lib/utils";

export type ChatData = {
  chat: DBChat;
  messages: DBMessage[];
  isOwner: boolean;
};

/**
 * Normalize API response messages to UI format. Shared by server and client chat loaders.
 */
export function normalizeMessagesFromApi(
  chat: DBChat,
  messagesFromApi: ChatData["messages"],
): ChatMessage[] {
  // Convert backend message format to DBMessage format
  // Backend returns createdAt as ISO string, but convertToUIMessages expects Date
  const messagesFromDb = messagesFromApi.map(
    (msg: DBMessage) =>
      ({
        id: msg.id,
        chatId: chat.id,
        role: msg.role as "user" | "assistant" | "system",
        parts: msg.parts ?? [],
        attachments: msg.attachments ?? [],
        createdAt: msg.createdAt,
      }) as DBMessage,
  );
  return convertToUIMessages(messagesFromDb);
}

type ChatPageContentProps = {
  chat: DBChat;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  isOwner: boolean;
};

/**
 * Presentational component: renders Chat + DataStreamHandler from resolved chat data.
 * Used by both server (guest) and client (MSAL) chat loaders.
 */
export function ChatPageContent({
  chat,
  initialMessages,
  initialChatModel,
  isOwner,
}: ChatPageContentProps) {
  return (
    <>
      <Chat
        autoResume={true}
        id={chat.id}
        initialChatModel={initialChatModel}
        initialMessages={initialMessages}
        initialVisibilityType={chat.visibility}
        isReadonly={!isOwner}
        lastContext={chat.lastContext ?? undefined}
      />
      <DataStreamHandler />
    </>
  );
}
