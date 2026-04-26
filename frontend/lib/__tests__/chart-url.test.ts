import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chartUrlsReferToSameChart } from "../chart-url";

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
