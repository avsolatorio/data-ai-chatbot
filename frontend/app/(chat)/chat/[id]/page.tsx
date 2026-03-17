import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ChatPageClient } from "@/app/(chat)/chat/[id]/chat-page-client";
import {
  type ChatData,
  ChatPageContent,
} from "@/app/(chat)/chat/[id]/chat-page-shared";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { authProvider } from "@/lib/auth/config";
import { normalizeMessagesFromApi } from "@/lib/chat-messages";
import { getBasePath } from "@/lib/config";
import { ChatSDKError } from "@/lib/errors";
import { serverApiFetch } from "@/lib/server-api-client";

// Note: With cacheComponents, params are runtime data. Resolve params inside Suspense
// so uncached data access (params, cookies, serverApiFetch) is properly deferred.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes#with-cache-components

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      {props.params.then(({ id }) => (
        <ChatPage id={id} />
      ))}
    </Suspense>
  );
}

async function ChatPage({ id }: { id: string }) {
  // MSAL: token is in session storage only; server has no cookie. Fetch chat on the client
  // so the request includes Authorization header from session storage.
  // data360: searchToken is set by parent app; serverApiFetch does not read it. Fetch on client
  // so apiFetch can add Authorization: Bearer <searchToken> from document.cookie.
  if (authProvider === "msal" || authProvider === "data360") {
    return <ChatPageClient id={id} />;
  }

  // Guest: fetch chat on the server (cookies are available).
  let chatData: ChatData;
  try {
    const response = await serverApiFetch(`/api/chat/${id}`);

    if (!response.ok) {
      // Handle authentication errors - redirect to guest creation
      if (response.status === 401) {
        // Not authenticated - redirect to guest creation
        redirect(`${getBasePath()}/api/auth/guest`);
      }

      if (response.status === 404) {
        notFound();
      }

      if (response.status === 403) {
        // Forbidden - user doesn't have access to this chat
        // This could happen if:
        // 1. User is trying to access someone else's private chat
        // 2. User's session changed (e.g., guest session expired and new one created)
        // For security, treat as not found
        notFound();
      }

      const errorData = await response.json().catch(() => ({}));
      throw new ChatSDKError(
        errorData.code || "bad_request:api",
        errorData.cause || `Failed to fetch chat: ${response.statusText}`,
      );
    }

    chatData = await response.json();
  } catch (error) {
    // Handle redirect errors (from redirect() call above)
    if (error && typeof error === "object" && "digest" in error) {
      throw error; // Re-throw Next.js redirect errors
    }

    if (error instanceof ChatSDKError && error.code === "not_found:chat") {
      notFound();
    }
    // Re-throw other errors
    throw error;
  }

  const { chat, messages: messagesFromApi, isOwner } = chatData;
  const initialMessages = normalizeMessagesFromApi(chat, messagesFromApi);

  const cookieStore = await cookies();
  const chatModel =
    cookieStore.get("chat-model")?.value?.trim() || DEFAULT_CHAT_MODEL;

  return (
    <ChatPageContent
      chat={chat}
      initialMessages={initialMessages}
      initialChatModel={chatModel}
      isOwner={isOwner}
    />
  );
}
