import type { ProcessingStage } from "@/hooks/use-data-thinking-stream";
import type { ChatMessage } from "@/lib/types";

/** Avoids megabyte JSON.stringify work when building the streaming scroll fingerprint. */
const MAX_STREAMING_PART_DATA_JSON = 16_384;

function stringifyForStreamingFingerprint(value: unknown): string {
  try {
    const s = JSON.stringify(value);
    if (s.length > MAX_STREAMING_PART_DATA_JSON) {
      return `${s.slice(0, MAX_STREAMING_PART_DATA_JSON)}…`;
    }
    return s;
  } catch {
    return "[unserializable]";
  }
}

export type StreamingThinkingPartForFingerprint = {
  type: string;
  id: string;
  data: ChatMessage["parts"][number];
};

/**
 * Bumps when any thinking/tool part changes (not only last-part text length) so the
 * virtual list can scrollToIndex while streaming (FE-003).
 */
export function getStreamingThinkingScrollFingerprint(
  stage: ProcessingStage | null,
  parts: StreamingThinkingPartForFingerprint[],
): string {
  if (parts.length === 0) {
    return `${stage ?? ""}|0`;
  }
  const pieceStrings = parts.map(
    (p) =>
      `${p.type}\u001f${p.id}\u001f${stringifyForStreamingFingerprint(p.data)}`,
  );
  return `${stage ?? ""}|${parts.length}\u001e${pieceStrings.join("\u001e")}`;
}
