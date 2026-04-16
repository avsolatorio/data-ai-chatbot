/**
 * Tests for aggregateUsage() in lib/usage.ts
 *
 * Covers:
 * - Basic numeric field summation
 * - Per-node byNode merging, including the new cachedInputTokens / reasoningTokens
 *   fields added in Improvement 1
 * - Multiple messages with the same node name are correctly summed
 * - Absent optional fields (cachedInputTokens, reasoningTokens) default to 0
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregateUsage } from "../usage";
import type { AppUsage, NodeUsage } from "../usage";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUsage(
  overrides: Partial<AppUsage> = {},
): AppUsage {
  return {
    promptTokens: 0,
    completionTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    ...overrides,
  } as AppUsage;
}

function makeNode(overrides: Partial<NodeUsage> = {}): NodeUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Basic aggregation
// ---------------------------------------------------------------------------

describe("aggregateUsage – basic summation", () => {
  it("returns empty/undefined totals for empty input (no crash)", () => {
    // aggregateUsage([]) returns an empty accumulator object; numeric fields are
    // absent (undefined) rather than zero because no values were ever added.
    const result = aggregateUsage([]);
    // The key invariant: it must not throw and byNode must be absent or empty.
    assert.ok(
      result.byNode === undefined || Object.keys(result.byNode).length === 0,
    );
  });

  it("sums inputTokens across multiple usages", () => {
    const result = aggregateUsage([
      makeUsage({ inputTokens: 10, totalTokens: 15 }),
      makeUsage({ inputTokens: 20, totalTokens: 25 }),
    ]);
    assert.equal(result.inputTokens, 30);
    assert.equal(result.totalTokens, 40);
  });

  it("sums cachedInputTokens across usages", () => {
    const result = aggregateUsage([
      makeUsage({ cachedInputTokens: 5, totalTokens: 10 } as AppUsage),
      makeUsage({ cachedInputTokens: 3, totalTokens: 8 } as AppUsage),
    ]);
    assert.equal((result as Record<string, unknown>).cachedInputTokens, 8);
  });
});

// ---------------------------------------------------------------------------
// byNode merging – Improvement 1: cachedInputTokens and reasoningTokens
// ---------------------------------------------------------------------------

describe("aggregateUsage – byNode merging", () => {
  it("merges byNode from a single usage unchanged", () => {
    const usage = makeUsage({
      byNode: {
        router: makeNode({ inputTokens: 10, outputTokens: 3, totalTokens: 13 }),
        narrator: makeNode({ inputTokens: 50, outputTokens: 20, totalTokens: 70 }),
      },
    });
    const result = aggregateUsage([usage]);
    assert.ok(result.byNode, "byNode must be present");
    assert.equal(result.byNode!.router.inputTokens, 10);
    assert.equal(result.byNode!.narrator.inputTokens, 50);
  });

  it("sums inputTokens / outputTokens for the same node across messages", () => {
    const u1 = makeUsage({
      byNode: {
        research: makeNode({ inputTokens: 100, outputTokens: 30, totalTokens: 130 }),
      },
    });
    const u2 = makeUsage({
      byNode: {
        research: makeNode({ inputTokens: 200, outputTokens: 50, totalTokens: 250 }),
      },
    });
    const result = aggregateUsage([u1, u2]);
    assert.equal(result.byNode!.research.inputTokens, 300);
    assert.equal(result.byNode!.research.outputTokens, 80);
  });

  it("accumulates cachedInputTokens per node (Improvement 1)", () => {
    const u1 = makeUsage({
      byNode: {
        research: makeNode({
          inputTokens: 100,
          outputTokens: 20,
          totalTokens: 120,
          cachedInputTokens: 40,
        }),
      },
    });
    const u2 = makeUsage({
      byNode: {
        research: makeNode({
          inputTokens: 80,
          outputTokens: 10,
          totalTokens: 90,
          cachedInputTokens: 30,
        }),
      },
    });
    const result = aggregateUsage([u1, u2]);
    assert.equal(result.byNode!.research.cachedInputTokens, 70);
  });

  it("accumulates reasoningTokens per node (Improvement 1)", () => {
    const u1 = makeUsage({
      byNode: {
        narrator: makeNode({
          inputTokens: 50,
          outputTokens: 40,
          totalTokens: 90,
          reasoningTokens: 15,
        }),
      },
    });
    const u2 = makeUsage({
      byNode: {
        narrator: makeNode({
          inputTokens: 60,
          outputTokens: 35,
          totalTokens: 95,
          reasoningTokens: 25,
        }),
      },
    });
    const result = aggregateUsage([u1, u2]);
    assert.equal(result.byNode!.narrator.reasoningTokens, 40);
  });

  it("accumulates both cachedInputTokens and reasoningTokens simultaneously", () => {
    const u1 = makeUsage({
      byNode: {
        research: makeNode({
          inputTokens: 200,
          outputTokens: 50,
          totalTokens: 250,
          cachedInputTokens: 80,
          reasoningTokens: 20,
        }),
      },
    });
    const u2 = makeUsage({
      byNode: {
        research: makeNode({
          inputTokens: 150,
          outputTokens: 30,
          totalTokens: 180,
          cachedInputTokens: 60,
          reasoningTokens: 10,
        }),
      },
    });
    const result = aggregateUsage([u1, u2]);
    const node = result.byNode!.research;
    assert.equal(node.cachedInputTokens, 140);
    assert.equal(node.reasoningTokens, 30);
  });

  it("treats absent cachedInputTokens as 0 (no crash)", () => {
    const u1 = makeUsage({
      byNode: {
        direct: makeNode({ inputTokens: 10, outputTokens: 5, totalTokens: 15 }),
        // no cachedInputTokens
      },
    });
    const u2 = makeUsage({
      byNode: {
        direct: makeNode({
          inputTokens: 8,
          outputTokens: 4,
          totalTokens: 12,
          cachedInputTokens: 3,
        }),
      },
    });
    const result = aggregateUsage([u1, u2]);
    // 0 (absent) + 3 = 3
    assert.equal(result.byNode!.direct.cachedInputTokens, 3);
  });

  it("treats absent reasoningTokens as 0 (no crash)", () => {
    const u1 = makeUsage({
      byNode: {
        narrator: makeNode({ inputTokens: 10, outputTokens: 5, totalTokens: 15 }),
      },
    });
    const u2 = makeUsage({
      byNode: {
        narrator: makeNode({
          inputTokens: 8,
          outputTokens: 4,
          totalTokens: 12,
          reasoningTokens: 7,
        }),
      },
    });
    const result = aggregateUsage([u1, u2]);
    assert.equal(result.byNode!.narrator.reasoningTokens, 7);
  });

  it("keeps distinct node names from different messages", () => {
    const u1 = makeUsage({
      byNode: { router: makeNode({ inputTokens: 5, outputTokens: 1, totalTokens: 6 }) },
    });
    const u2 = makeUsage({
      byNode: { narrator: makeNode({ inputTokens: 30, outputTokens: 15, totalTokens: 45 }) },
    });
    const result = aggregateUsage([u1, u2]);
    assert.ok("router" in result.byNode!);
    assert.ok("narrator" in result.byNode!);
  });

  it("preserves first seen modelId per node during accumulation", () => {
    const u1 = makeUsage({
      byNode: {
        research: makeNode({
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
          modelId: "gpt-4.1",
        }),
      },
    });
    const u2 = makeUsage({
      byNode: {
        research: makeNode({
          inputTokens: 5,
          outputTokens: 2,
          totalTokens: 7,
          modelId: "gpt-4.1",
        }),
      },
    });
    const result = aggregateUsage([u1, u2]);
    assert.equal(result.byNode!.research.modelId, "gpt-4.1");
  });
});
