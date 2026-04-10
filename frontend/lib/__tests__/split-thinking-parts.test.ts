import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { splitDataThinkingPrefixParts } from "../split-thinking-parts";

describe("splitDataThinkingPrefixParts", () => {
  it("returns all parts as thinking when every part is data-thinking", () => {
    const parts = [
      { type: "data-thinking", id: "a", data: { type: "text", text: "x" } },
    ];
    const r = splitDataThinkingPrefixParts(parts);
    assert.equal(r.firstRegularPartIndex, -1);
    assert.equal(r.thinkingParts.length, 1);
    assert.equal(r.regularParts.length, 0);
  });

  it("splits at first non-data-thinking part", () => {
    const parts = [
      { type: "data-thinking", id: "a", data: {} },
      { type: "text", text: "Hello" },
    ];
    const r = splitDataThinkingPrefixParts(parts);
    assert.equal(r.firstRegularPartIndex, 1);
    assert.equal(r.thinkingParts.length, 1);
    assert.equal(r.regularParts.length, 1);
    assert.equal((r.regularParts[0] as { text: string }).text, "Hello");
  });

  it("handles undefined parts as empty", () => {
    const r = splitDataThinkingPrefixParts(undefined);
    assert.equal(r.firstRegularPartIndex, -1);
    assert.equal(r.thinkingParts.length, 0);
    assert.equal(r.regularParts.length, 0);
  });
});
