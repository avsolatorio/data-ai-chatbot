import { describe, expect, it } from "vitest";
import {
  assistantTextWithoutLegacyPolicyMarker,
  CONTENT_POLICY_BLOCKED_PART_TYPE,
  getContentPolicyBlockedFromParts,
  LEGACY_POLICY_BLOCKED_TEXT,
} from "../content-policy";

describe("getContentPolicyBlockedFromParts", () => {
  it("returns data part payload when present", () => {
    const result = getContentPolicyBlockedFromParts([
      {
        type: CONTENT_POLICY_BLOCKED_PART_TYPE,
        data: {
          node: "followup",
          message: "Policy blocked message.",
        },
      },
    ]);
    expect(result?.message).toBe("Policy blocked message.");
  });

  it("detects legacy [blocked] text part", () => {
    const result = getContentPolicyBlockedFromParts([
      { type: "text", text: "Answer" },
      { type: "text", text: LEGACY_POLICY_BLOCKED_TEXT },
    ]);
    expect(result?.node).toBe("followup");
    expect(result?.message).toContain("content safety rules");
  });

  it("returns null when no policy marker", () => {
    expect(getContentPolicyBlockedFromParts([{ type: "text", text: "Hello" }])).toBeNull();
  });
});

describe("assistantTextWithoutLegacyPolicyMarker", () => {
  it("removes trailing legacy marker", () => {
    expect(
      assistantTextWithoutLegacyPolicyMarker("Answer text\n\n[blocked]"),
    ).toBe("Answer text");
  });
});
