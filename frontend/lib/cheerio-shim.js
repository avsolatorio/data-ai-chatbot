// Data360 claim verification looks up <claim> nodes via cheerio.load(...).
// In the browser bundle we only need that selector to safely resolve to "no claims".
const CLAIM_SELECTOR = "claim";

// The bundled client path only needs the cheerio subset used by $("claim").map(...).get().
// Returning an empty array makes claim extraction a safe no-op in browser builds.
const emptyCollection = {
  map() {
    return {
      get() {
        return [];
      },
    };
  },
};

/**
 * Wrap a selector or pseudo-element with inert cheerio-like helpers for browser bundles.
 *
 * @param {unknown} value Selector or element-like value passed through the shimmed loader.
 * @returns {{attr: () => undefined, text: () => string, toString: () => string}}
 */
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
 * Create a minimal browser-only cheerio loader.
 *
 * @returns {(selectorOrElement: unknown) => unknown}
 * A selector function where "claim" returns an empty collection so claim extraction becomes a no-op,
 * and any other selector/element gets a tiny wrapper with inert attr/text/toString methods.
 */
export function load() {
  return (selectorOrElement) =>
    selectorOrElement === CLAIM_SELECTOR ? emptyCollection : wrapElement(selectorOrElement);
}
