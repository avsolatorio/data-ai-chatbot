/**
 * Splits assistant message parts into a data-thinking prefix and "regular" parts.
 * The UI renders the prefix inside the thinking panel and the rest as the main narrative.
 */
export function splitDataThinkingPrefixParts<T extends { type?: string }>(
  parts: T[] | undefined,
): {
  firstRegularPartIndex: number;
  thinkingParts: T[];
  regularParts: T[];
} {
  const list = parts ?? [];
  const firstRegularPartIndex = list.findIndex(
    (part) =>
      typeof part.type !== "string" || !part.type.startsWith("data-thinking"),
  );

  const thinkingParts = list.filter(
    (part) => typeof part.type === "string" && part.type.startsWith("data-thinking")
  );

  const regularParts = list.filter(
    (part) => typeof part.type !== "string" || !part.type.startsWith("data-thinking")
  );

  return {
    firstRegularPartIndex: firstRegularPartIndex !== -1 ? firstRegularPartIndex : -1,
    thinkingParts,
    regularParts,
  };
}
