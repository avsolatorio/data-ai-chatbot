import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
    assert.equal(result?.message, "Policy blocked message.");
  });

  it("detects legacy [blocked] text part", () => {
    const result = getContentPolicyBlockedFromParts([
      { type: "text", text: "Answer" },
      { type: "text", text: LEGACY_POLICY_BLOCKED_TEXT },
    ]);
    assert.equal(result?.node, "followup");
    assert.match(result?.message ?? "", /content safety rules/);
  });

  it("returns null when no policy marker", () => {
    assert.equal(
      getContentPolicyBlockedFromParts([{ type: "text", text: "Hello" }]),
      null,
    );
  });
});

describe("assistantTextWithoutLegacyPolicyMarker", () => {
  it("removes trailing legacy marker", () => {
    assert.equal(
      assistantTextWithoutLegacyPolicyMarker("Answer text\n\n[blocked]"),
      "Answer text",
    );
  });
});
