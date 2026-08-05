import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  REVIEW_FEEDBACK_ITEM,
  buildAdminNavItems,
} from "../admin/nav";

describe("buildAdminNavItems", () => {
  it("includes Review feedback when canViewTokenUsage is true", () => {
    const items = buildAdminNavItems({ canViewTokenUsage: true });
    const labels = items.map((i) => i.label);
    assert.deepEqual(labels, [
      "Analytics",
      "Moderation",
      "Health",
      "Review feedback",
    ]);
    assert.ok(
      items.some(
        (i) => i.href === "/review/feedback" && i.label === "Review feedback",
      ),
      "Review feedback item is present",
    );
  });

  it("omits Review feedback when canViewTokenUsage is false", () => {
    const items = buildAdminNavItems({ canViewTokenUsage: false });
    assert.equal(items.length, 3);
    assert.ok(
      !items.some((i) => i.href === "/review/feedback"),
      "Review feedback item is NOT present",
    );
  });

  it("omits Review feedback when canViewTokenUsage is undefined", () => {
    const items = buildAdminNavItems({});
    assert.equal(items.length, 3);
  });

  it("always returns the three base admin links in order", () => {
    const items = buildAdminNavItems({ canViewTokenUsage: true });
    assert.equal(items[0].href, "/admin/analytics");
    assert.equal(items[1].href, "/admin/moderation");
    assert.equal(items[2].href, "/admin/health");
    assert.equal(items[3].href, "/review/feedback");
  });

  it("REVIEW_FEEDBACK_ITEM has the expected shape", () => {
    assert.equal(REVIEW_FEEDBACK_ITEM.href, "/review/feedback");
    assert.equal(REVIEW_FEEDBACK_ITEM.label, "Review feedback");
  });
});
