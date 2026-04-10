import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseFollowUps } from "../parse-follow-ups";

describe("parseFollowUps", () => {
  it("returns empty array for empty input", () => {
    assert.deepEqual(parseFollowUps(""), []);
  });

  it("returns nothing when the heading is missing", () => {
    const text = `Here is the answer.

- Not a follow-up section
- Still not`;
    assert.deepEqual(parseFollowUps(text), []);
  });

  it("parses bullet list after heading", () => {
    const text = `**Suggested follow-ups:**
- First question?
- Second question?`;
    assert.deepEqual(parseFollowUps(text), [
      "First question?",
      "Second question?",
    ]);
  });

  it("tolerates heading variants (case, bold, colon, markdown heading)", () => {
    assert.deepEqual(parseFollowUps("suggested follow-ups:\n- A"), ["A"]);
    assert.deepEqual(parseFollowUps("**Suggested follow-ups**\n- B"), ["B"]);
    assert.deepEqual(parseFollowUps("### **Suggested follow-ups:**\n- C"), [
      "C",
    ]);
  });

  it("parses *, •, and numbered list markers", () => {
    const text = `**Suggested follow-ups:**
* Star item
• Bullet item
1. One
2. Two`;
    assert.deepEqual(parseFollowUps(text), [
      "Star item",
      "Bullet item",
      "One",
      "Two",
    ]);
  });

  it("skips blank lines after heading and between items", () => {
    const text = `**Suggested follow-ups:**


- First

- Second`;
    assert.deepEqual(parseFollowUps(text), ["First", "Second"]);
  });

  it("caps at four items", () => {
    const text = `**Suggested follow-ups:**
- One
- Two
- Three
- Four
- Five
- Six`;
    assert.deepEqual(parseFollowUps(text), ["One", "Two", "Three", "Four"]);
  });

  it("ignores non-list lines before the first list item", () => {
    const text = `**Suggested follow-ups:**
You might also ask:
- Real question?`;
    assert.deepEqual(parseFollowUps(text), ["Real question?"]);
  });
});
