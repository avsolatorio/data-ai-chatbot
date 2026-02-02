"use client";

import { useEffect, useState } from "react";
import type { ChatModel } from "@/lib/ai/models";
import { chatModels as fallbackModels } from "@/lib/ai/models";
import { fetchAvailableChatModels } from "@/lib/ai/models-client";

export type UseAvailableChatModelsResult = {
  models: ChatModel[];
  isLoading: boolean;
  error: Error | null;
};

/**
 * Fetch available chat models from the backend.
 * Starts with static fallback so the UI is never empty; then replaces with API result.
 */
export function useAvailableChatModels(): UseAvailableChatModelsResult {
  const [models, setModels] = useState<ChatModel[]>(fallbackModels);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchAvailableChatModels()
      .then((fetched) => {
        if (!cancelled) {
          setModels(fetched);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          // Keep fallback models already in state
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { models, isLoading, error };
}
