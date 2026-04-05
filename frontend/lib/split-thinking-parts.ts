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
  if (firstRegularPartIndex === -1) {
    return {
      firstRegularPartIndex: -1,
      thinkingParts: list,
      regularParts: [],
    };
  }
  return {
    firstRegularPartIndex,
    thinkingParts: list.slice(0, firstRegularPartIndex),
    regularParts: list.slice(firstRegularPartIndex),
  };
}
