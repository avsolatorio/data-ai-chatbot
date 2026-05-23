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

export function load() {
  return (selectorOrElement) =>
    selectorOrElement === CLAIM_SELECTOR ? emptyCollection : wrapElement(selectorOrElement);
}
