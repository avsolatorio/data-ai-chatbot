import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isRegistrationDisabled } from "../auth/registration";

describe("isRegistrationDisabled", () => {
  it("returns true for msal — bounces to /", () => {
    assert.equal(isRegistrationDisabled("msal"), true);
  });

  it("returns false for guest — /register must render the form", () => {
    assert.equal(isRegistrationDisabled("guest"), false);
  });

  it("returns false for user — /register renders the form", () => {
    assert.equal(isRegistrationDisabled("user"), false);
  });

  it("returns false for data360 — /register renders the form", () => {
    assert.equal(isRegistrationDisabled("data360"), false);
  });

  it("returns false for unknown providers (defensive default)", () => {
    assert.equal(isRegistrationDisabled(""), false);
    assert.equal(isRegistrationDisabled("something-else"), false);
  });
});
