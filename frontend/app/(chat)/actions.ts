"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { titlePrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { serverApiFetch } from "@/lib/server-api-client";
import { getTextFromMessage } from "@/lib/utils";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel("title-model"),
    system: titlePrompt,
    prompt: getTextFromMessage(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const response = await serverApiFetch("/api/chat/messages", {
    method: "DELETE",
    body: JSON.stringify({ id, includeTrailing: true }),
  });

  if (!response.ok) {
    console.error(
      "Failed to delete trailing messages:",
      response.status,
      await response.text().catch(() => ""),
    );
  }
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const response = await serverApiFetch("/api/chat/visibility", {
    method: "PATCH",
    body: JSON.stringify({ chatId, visibility }),
  });

  if (!response.ok) {
    console.error(
      "Failed to update chat visibility:",
      response.status,
      await response.text().catch(() => ""),
    );
  }
}
