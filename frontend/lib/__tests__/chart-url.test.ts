import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chartUrlsReferToSameChart,
  splitAssistantTextIntoChartSegments,
} from "../chart-url";

/** Same shape as `buildChartUrlRegexes()` when `basePath` is empty (tests avoid config). */
const TEST_CHART_REGEXES = (() => {
  const relativePart = `(?:/api/v1/charts/[^\\s"'<>)\\]]+)`;
  const bare = new RegExp(
    `(?:${relativePart}|https?:\\/\\/[^\\s]*/api/v1/charts/[^\\s"'<>)\\]]+)`,
  );
  const markdownLink = new RegExp(
    `\\[[^\\]]*\\]\\s*\\(\\s*(${bare.source})\\s*\\)`,
  );
  return { bare, markdownLink };
})();

describe("splitAssistantTextIntoChartSegments", () => {
  it("returns a single text segment when there is no chart URL", () => {
    assert.deepEqual(
      splitAssistantTextIntoChartSegments("Hello world", TEST_CHART_REGEXES),
      [{ kind: "text", text: "Hello world", startOffset: 0 }],
    );
  });

  it("splits multiple markdown chart links into alternating segments", () => {
    const u1 = "/api/v1/charts/aaa/spec";
    const u2 = "/api/v1/charts/bbb/spec";
    const text = `First [A](${u1}) then [B](${u2}) end.`;
    const md1 = `[A](${u1})`;
    const md2 = `[B](${u2})`;
    const afterMd1 = 6 + md1.length;
    const chart2Start = afterMd1 + " then ".length;
    const tailStart = chart2Start + md2.length;
    assert.deepEqual(splitAssistantTextIntoChartSegments(text, TEST_CHART_REGEXES), [
      { kind: "text", text: "First ", startOffset: 0 },
      { kind: "chart", chartUrl: u1, startOffset: 6 },
      { kind: "text", text: " then ", startOffset: afterMd1 },
      { kind: "chart", chartUrl: u2, startOffset: chart2Start },
      { kind: "text", text: " end.", startOffset: tailStart },
    ]);
  });

  it("prefers markdown link over bare URL when both start at the same index", () => {
    const u = "https://host/api/v1/charts/x/spec";
    const text = `[View](${u})`;
    assert.deepEqual(splitAssistantTextIntoChartSegments(text, TEST_CHART_REGEXES), [
      { kind: "chart", chartUrl: u, startOffset: 0 },
    ]);
  });

  it("includes a bare chart URL as its own segment", () => {
    const u = "/api/v1/charts/z/spec";
    assert.deepEqual(
      splitAssistantTextIntoChartSegments(`See ${u} here`, TEST_CHART_REGEXES),
      [
        { kind: "text", text: "See ", startOffset: 0 },
        { kind: "chart", chartUrl: u, startOffset: 4 },
        { kind: "text", text: " here", startOffset: 4 + u.length },
      ],
    );
  });
});

describe("chartUrlsReferToSameChart", () => {
  it("treats absolute and path-only chart URLs as the same", () => {
    assert.ok(
      chartUrlsReferToSameChart(
        "https://example.com/api/v1/charts/abc/spec",
        "/api/v1/charts/abc/spec",
      ),
    );
  });
});
