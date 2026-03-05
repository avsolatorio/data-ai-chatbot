import type { Chat as DBChat, DBMessage } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages } from "@/lib/utils";

/**
 * Normalize API response messages to UI format.
 * Safe to use on server and client. Reusable by chat loaders, API routes, or any consumer
 * that has raw chat + messages from the API.
 */
export function normalizeMessagesFromApi(
  chat: DBChat,
  messagesFromApi: DBMessage[],
): ChatMessage[] {
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
