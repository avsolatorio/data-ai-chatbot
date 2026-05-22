import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

/** Selected model from the `chat-model` cookie (client-only). */
export function getSelectedChatModelFromCookie(): string {
  if (typeof document === "undefined") return DEFAULT_CHAT_MODEL;
  const match = document.cookie.match(/\bchat-model=([^;]*)/);
  return match?.[1]?.trim() || DEFAULT_CHAT_MODEL;
}
