import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getStreamingThinkingScrollFingerprint } from "../streaming-thinking-scroll-fingerprint";

describe("getStreamingThinkingScrollFingerprint", () => {
  const stageA = "Understanding your question" as const;
  const stageB = "Retrieving data" as const;

  it("is stable for identical stage and parts", () => {
    const parts = [
      {
        type: "data-thinking",
        id: "outer-1",
        data: { type: "text", text: "hello" } as const,
      },
    ];
    const a = getStreamingThinkingScrollFingerprint(stageA, parts);
    const b = getStreamingThinkingScrollFingerprint(stageA, parts);
    assert.equal(a, b);
  });

  it("changes when processing stage changes with same parts", () => {
    const parts = [
      {
        type: "data-thinking",
        id: "outer-1",
        data: { type: "text", text: "x" } as const,
      },
    ];
    const a = getStreamingThinkingScrollFingerprint(stageA, parts);
    const b = getStreamingThinkingScrollFingerprint(stageB, parts);
    assert.notEqual(a, b);
  });

  it("changes when a non-last part updates (not only last-part text length)", () => {
    const before = [
      {
        type: "data-thinking",
        id: "p1",
        data: { type: "text", text: "a" } as const,
      },
      {
        type: "data-thinking",
        id: "p2",
        data: { type: "text", text: "zzz" } as const,
      },
    ];
    const after = [
      {
        type: "data-thinking",
        id: "p1",
        data: { type: "text", text: "bbbb" } as const,
      },
      {
        type: "data-thinking",
        id: "p2",
        data: { type: "text", text: "zzz" } as const,
      },
    ];
    assert.notEqual(
      getStreamingThinkingScrollFingerprint(null, before),
      getStreamingThinkingScrollFingerprint(null, after),
    );
  });

  it("changes when tool state updates but last-part text length is unchanged (FE-003)", () => {
    const lastText = "same length str";
    const before = [
      {
        type: "data-thinking",
        id: "t1",
        data: {
          type: "tool-invocation",
          toolCallId: "call-1",
          state: "call",
          toolName: "search",
        } as Record<string, unknown>,
      },
      {
        type: "data-thinking",
        id: "t2",
        data: { type: "text", text: lastText } as const,
      },
    ];
    const after = [
      {
        type: "data-thinking",
        id: "t1",
        data: {
          type: "tool-invocation",
          toolCallId: "call-1",
          state: "result",
          toolName: "search",
          output: { ok: true },
        } as Record<string, unknown>,
      },
      {
        type: "data-thinking",
        id: "t2",
        data: { type: "text", text: lastText } as const,
      },
    ];
    assert.notEqual(
      getStreamingThinkingScrollFingerprint(null, before),
      getStreamingThinkingScrollFingerprint(null, after),
    );
  });

  it("uses empty-parts shape that still reflects stage", () => {
    assert.equal(getStreamingThinkingScrollFingerprint(null, []), "|0");
    assert.equal(
      getStreamingThinkingScrollFingerprint(stageA, []),
      `${stageA}|0`,
    );
  });
});
