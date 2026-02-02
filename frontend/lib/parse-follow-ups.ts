/**
 * Parse "Suggested follow-ups:" section from assistant message markdown.
 * Matches a line containing "Suggested follow-ups" (with optional **) then
 * list items (- or * or • or 1. etc.). Returns up to 4 questions.
 */
const FOLLOW_UPS_HEADING = /\*{0,2}Suggested follow-ups\*{0,2}\s*:?/im;
const LIST_ITEM = /^\s*[-*•]\s+(.+)$|^\s*\d+\.\s+(.+)$/m;

export function parseFollowUps(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  const lines = text.split(/\r?\n/);
  let inSection = false;
  const followUps: string[] = [];
  const maxFollowUps = 4;

  for (const line of lines) {
    if (FOLLOW_UPS_HEADING.test(line)) {
      inSection = true;
      continue;
    }
    if (!inSection) continue;

    const trimmed = line.trim();
    if (trimmed === "") break;

    const match = trimmed.match(LIST_ITEM);
    if (match) {
      const question = (match[1] ?? match[2] ?? "").trim();
      if (question && followUps.length < maxFollowUps) {
        followUps.push(question);
      }
    }
  }

  return followUps;
}
