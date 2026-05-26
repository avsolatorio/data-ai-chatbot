/** Shared contract with backend `llm_invoke.content_policy_blocked_part`. */

export const CONTENT_POLICY_BLOCKED_PART_TYPE = "data-contentPolicyBlocked" as const;

/** Legacy sentinel persisted before BE-003. */
export const LEGACY_POLICY_BLOCKED_TEXT = "[blocked]";

export type ContentPolicyBlockedData = {
  node: string;
  message: string;
};

export type ContentPolicyBlockedPart = {
  type: typeof CONTENT_POLICY_BLOCKED_PART_TYPE;
  data: ContentPolicyBlockedData;
};

type MessagePartLike = { type?: string; text?: string; data?: unknown };

export function getContentPolicyBlockedFromParts(
  parts: MessagePartLike[],
): ContentPolicyBlockedData | null {
  const dataPart = parts.find(
    (p) => p.type === CONTENT_POLICY_BLOCKED_PART_TYPE,
  );
  if (dataPart?.data && typeof dataPart.data === "object") {
    const data = dataPart.data as ContentPolicyBlockedData;
    if (typeof data.message === "string" && data.message.length > 0) {
      return data;
    }
  }

  const hasLegacyMarker = parts.some(
    (p) =>
      p.type === "text" &&
      (p.text ?? "").trim() === LEGACY_POLICY_BLOCKED_TEXT,
  );
  if (hasLegacyMarker) {
    return {
      node: "followup",
      message:
        "This response is incomplete because the model provider blocked this reply under its content safety rules. Try rephrasing your question, narrowing the topic, or contacting support.",
    };
  }

  return null;
}

/** Strip legacy `[blocked]` tail from assistant text before follow-up parsing. */
export function assistantTextWithoutLegacyPolicyMarker(text: string): string {
  return text.replace(/\n*\[blocked\]\s*$/, "").trimEnd();
}
