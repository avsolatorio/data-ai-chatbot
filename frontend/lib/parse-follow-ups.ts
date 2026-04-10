/**
 * Parse "Suggested follow-ups:" section from assistant message markdown.
 *
 * **Heading (case-insensitive):** optional markdown `### ` prefix, optional
 * bold `**` around the label, optional trailing `:`. Example lines that match:
 * `Suggested follow-ups:`, `**Suggested follow-ups**`, `### **Suggested follow-ups:**`
 *
 * **List items:** `-`, `*`, `•`, or numbered `1.` … with space after the marker.
 * Blank lines after the heading or between items are skipped (the list does not
 * have to be contiguous with no gaps). Non-list lines before the first item are
 * ignored; non-list lines after items are ignored until the next list line or
 * end of text. At most 4 items are returned.
 */
const FOLLOW_UPS_HEADING =
  /^\s*(?:#{1,3}\s+)?\*{0,2}Suggested follow-ups\*{0,2}\s*:?/im;
const LIST_ITEM = /^\s*[-*•]\s+(.+)$|^\s*\d+\.\s+(.+)$/;

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
    if (trimmed === "") continue;

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
