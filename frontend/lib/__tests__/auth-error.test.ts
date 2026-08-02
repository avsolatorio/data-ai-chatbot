import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuthError } from "../auth-service";

describe("AuthError", () => {
  it("stores status, message, and signInHint", () => {
    const err = new AuthError(400, "This email is already registered.", true);
    assert.ok(err instanceof Error);
    assert.equal(err.name, "AuthError");
    assert.equal(err.status, 400);
    assert.equal(err.message, "This email is already registered.");
    assert.equal(err.signInHint, true);
  });

  it("defaults signInHint to false", () => {
    const err = new AuthError(401, "Invalid credentials");
    assert.equal(err.signInHint, false);
  });

  it("is catchable as Error", () => {
    try {
      throw new AuthError(429, "Too many attempts.");
    } catch (e) {
      assert.ok(e instanceof Error);
      assert.ok(e instanceof AuthError);
      assert.equal((e as AuthError).status, 429);
    }
  });
});
