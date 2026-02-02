/**
 * Client for fetching available chat models from the backend.
 * Uses static list as fallback when the API is unavailable.
 */

import { getApiUrl } from "@/lib/api-client";
import { apiFetch } from "@/lib/api-client";
import type { ChatModel } from "./models";
import { chatModels as fallbackModels } from "./models";

export type ChatModelsResponse = ChatModel[];

const CACHE_TTL_MS = 60_000; // 1 minute

let cached: { models: ChatModel[]; at: number } | null = null;

function isCacheValid(): boolean {
  if (!cached) return false;
  return Date.now() - cached.at < CACHE_TTL_MS;
}

/**
 * Fetch available chat models from the backend.
 * Returns cached result if still valid. Falls back to static list on error.
 */
export async function fetchAvailableChatModels(): Promise<ChatModel[]> {
  if (typeof window !== "undefined" && isCacheValid() && cached) {
    return cached.models;
  }

  try {
    const url = getApiUrl("/api/models");
    const response = await apiFetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Models API returned ${response.status}`);
    }

    const data = (await response.json()) as ChatModelsResponse;

    if (!Array.isArray(data)) {
      throw new Error("Invalid models response");
    }

    const models = data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
    }));

    if (typeof window !== "undefined") {
      cached = { models, at: Date.now() };
    }

    return models;
  } catch {
    return fallbackModels;
  }
}

/**
 * Reset the in-memory cache (e.g. for tests or after logout).
 */
export function clearModelsCache(): void {
  cached = null;
}
