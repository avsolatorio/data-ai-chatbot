// Data360 claim verification looks up <claim> nodes via cheerio.load(...).
// In the browser bundle we only need that selector to safely resolve to "no claims".
const CLAIM_SELECTOR = "claim";

const emptyCollection = {
  map() {
    return {
      get() {
        return [];
      },
    };
  },
};

const wrapElement = (value) => ({
  attr() {
    return undefined;
  },
  text() {
    return "";
  },
  toString() {
    return typeof value === "string" ? value : "";
  },
});

/**
 * Minimal browser-only cheerio shim:
 * - "claim" returns an empty collection so claim extraction becomes a no-op.
 * - Any other selector/element gets a tiny wrapper with inert attr/text/toString methods.
 */
export function load() {
  return (selectorOrElement) =>
    selectorOrElement === CLAIM_SELECTOR ? emptyCollection : wrapElement(selectorOrElement);
}
