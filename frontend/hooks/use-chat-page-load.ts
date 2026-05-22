"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatData } from "@/app/(chat)/chat/[id]/chat-page-shared";
import { apiFetch } from "@/lib/api-client";

export type ChatPageLoadState<T extends ChatData = ChatData> =
  | { status: "loading" }
  | { status: "error"; statusCode: number }
  | { status: "ok"; data: T };

/**
 * Fetches chat + messages for a client-rendered chat page. Dedupes Strict Mode double-fetch.
 */
export function useChatPageLoad<T extends ChatData = ChatData>(
  id: string,
  buildUrl: (chatId: string) => string,
): ChatPageLoadState<T> {
  const [state, setState] = useState<ChatPageLoadState<T>>({ status: "loading" });

  const load = useCallback(async () => {
    if (!id) {
      setState({ status: "error", statusCode: 404 });
      return;
    }
    try {
      const response = await apiFetch(buildUrl(id), {
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
      const data = (await response.json()) as T;
      setState({ status: "ok", data });
    } catch {
      setState({ status: "error", statusCode: 500 });
    }
  }, [id, buildUrl]);

  const loadedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (loadedIdRef.current === id) return;
    loadedIdRef.current = id;
    load();
  }, [id, load]);

  return state;
}
