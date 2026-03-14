"use server";

import { serverApiFetch } from "@/lib/server-api-client";

export async function getSuggestions({ documentId }: { documentId: string }) {
  try {
    const response = await serverApiFetch(
      `/api/chat/suggestions?documentId=${encodeURIComponent(documentId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      return [];
    }
    const suggestions = await response.json();
    return Array.isArray(suggestions) ? suggestions : [];
  } catch {
    return [];
  }
}
