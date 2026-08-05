import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDateRange,
  dateRangeQuery,
  formatInt,
  formatUsd,
  newUsersToBars,
  ratingDistributionToBars,
  tokensByModelToBars,
  toIsoDate,
  topModelsToBars,
  DATE_RANGE_PRESETS,
} from "../admin/analytics";

describe("buildDateRange", () => {
  it("builds a 7d range ending at end of today", () => {
    const now = new Date(2026, 7, 2, 12, 0, 0); // Aug 2 2026 noon
    const r = buildDateRange("7d", now);
    assert.equal(r.preset, "7d");
    assert.equal(toIsoDate(r.from), "2026-07-26");
    assert.equal(toIsoDate(r.to), "2026-08-02");
    assert.equal(r.from.getHours(), 0);
    assert.equal(r.to.getHours(), 23);
  });

  it("builds a 30d range", () => {
    const now = new Date(2026, 0, 31, 0, 0, 0);
    const r = buildDateRange("30d", now);
    assert.equal(toIsoDate(r.from), "2026-01-01");
    assert.equal(toIsoDate(r.to), "2026-01-31");
  });

  it("builds a 90d range", () => {
    const now = new Date(2026, 6, 15, 9, 30, 0);
    const r = buildDateRange("90d", now);
    assert.equal(toIsoDate(r.from), "2026-04-16");
    assert.equal(toIsoDate(r.to), "2026-07-15");
  });

  it("exposes all three presets", () => {
    assert.deepEqual(DATE_RANGE_PRESETS, ["7d", "30d", "90d"]);
  });
});

describe("dateRangeQuery", () => {
  it("encodes from and to as ISO dates", () => {
    const now = new Date(2026, 7, 2);
    const r = buildDateRange("30d", now);
    assert.equal(dateRangeQuery(r), "?from=2026-07-03&to=2026-08-02");
  });
});

describe("toIsoDate", () => {
  it("zero-pads single-digit months and days", () => {
    assert.equal(toIsoDate(new Date(2026, 0, 5)), "2026-01-05");
    assert.equal(toIsoDate(new Date(2026, 11, 31)), "2026-12-31");
  });
});

describe("tokensByModelToBars", () => {
  it("returns an empty array for undefined input", () => {
    assert.deepEqual(tokensByModelToBars(undefined), []);
  });

  it("returns an empty array for non-object input", () => {
    assert.deepEqual(tokensByModelToBars(null as unknown as undefined), []);
  });

  it("converts and sorts descending by value", () => {
    const out = tokensByModelToBars({
      "gpt-4o": 100,
      "gpt-4o-mini": 500,
      "claude-3.5-sonnet": 250,
    });
    assert.deepEqual(out, [
      { name: "gpt-4o-mini", value: 500 },
      { name: "claude-3.5-sonnet", value: 250 },
      { name: "gpt-4o", value: 100 },
    ]);
  });

  it("coerces non-numeric values to 0", () => {
    const out = tokensByModelToBars({ a: 1, b: "x" as unknown as number });
    assert.deepEqual(out, [{ name: "a", value: 1 }, { name: "b", value: 0 }]);
  });
});

describe("topModelsToBars", () => {
  it("maps model + count to bar data", () => {
    const out = topModelsToBars([
      { model: "gpt-4o", count: 10 },
      { model: "gpt-4o-mini", count: 5 },
    ]);
    assert.deepEqual(out, [
      { name: "gpt-4o", value: 10 },
      { name: "gpt-4o-mini", value: 5 },
    ]);
  });

  it("handles empty / missing arrays", () => {
    assert.deepEqual(topModelsToBars([]), []);
    assert.deepEqual(topModelsToBars(undefined as unknown as []), []);
  });
});

describe("ratingDistributionToBars", () => {
  it("orders 5..1 regardless of input key order", () => {
    const out = ratingDistributionToBars({
      "1": 1,
      "3": 30,
      "5": 50,
    });
    assert.deepEqual(
      out.map((b) => b.name),
      ["5", "4", "3", "2", "1"],
    );
    assert.equal(out[0].value, 50);
    assert.equal(out[2].value, 30);
  });

  it("zero-fills missing keys", () => {
    const out = ratingDistributionToBars({});
    assert.deepEqual(out, [
      { name: "5", value: 0 },
      { name: "4", value: 0 },
      { name: "3", value: 0 },
      { name: "2", value: 0 },
      { name: "1", value: 0 },
    ]);
  });
});

describe("newUsersToBars", () => {
  it("returns 7d then 30d labels", () => {
    const out = newUsersToBars({
      totalUsers: 100,
      registeredUsers: 80,
      guestUsers: 20,
      newUsers7d: 5,
      newUsers30d: 22,
      activeUsers7d: 30,
      activeUsers30d: 80,
    });
    assert.deepEqual(out, [
      { name: "Last 7d", value: 5 },
      { name: "Last 30d", value: 22 },
    ]);
  });
});

describe("formatInt", () => {
  it("uses thousands separators", () => {
    assert.equal(formatInt(1234), "1,234");
    assert.equal(formatInt(1_000_000), "1,000,000");
  });

  it("handles 0 and non-finite", () => {
    assert.equal(formatInt(0), "0");
    assert.equal(formatInt(Number.NaN), "0");
    assert.equal(formatInt(Number.POSITIVE_INFINITY), "0");
  });

  it("rounds non-integers", () => {
    assert.equal(formatInt(3.6), "4");
  });
});

describe("formatUsd", () => {
  it("formats with two decimals and dollar sign", () => {
    assert.equal(formatUsd(1.234), "$1.23");
    assert.equal(formatUsd(0), "$0.00");
  });

  it("handles non-finite", () => {
    assert.equal(formatUsd(Number.NaN), "$0.00");
  });
});
