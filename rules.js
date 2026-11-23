// Shared by the popup and the content script.
// Rule shape: { id, urlPrefix, elementId?, className?, enabled }
// elementId and className may use * as a wildcard matching any run of characters.

const SnipRules = (() => {
  const REGEX_META = /[\\^$.|?+()[\]{}]/;

  // Converts a v1.1 regex pattern to an equivalent wildcard pattern, or null
  // when it uses regex features wildcards can't express.
  function regexToWildcard(pattern) {
    let p = pattern;
    const anchoredStart = p.startsWith("^");
    const anchoredEnd = p.endsWith("$") && !p.endsWith("\\$");
    if (anchoredStart) p = p.slice(1);
    if (anchoredEnd) p = p.slice(0, -1);
    p = p.replace(/\.\*/g, "*");
    if (REGEX_META.test(p)) return null;
    return ((anchoredStart ? "" : "*") + p + (anchoredEnd ? "" : "*")).replace(/\*+/g, "*");
  }

  // Upgrades rules saved by older versions:
  //   v1.0: { type: "id" | "class", value }
  //   v1.1: elementIdRegex / classNameRegex flags
  function normalize(rule) {
    const r = { ...rule };
    if (r.type) {
      r[r.type === "id" ? "elementId" : "className"] = r.value;
      delete r.type;
      delete r.value;
    }
    for (const [field, flag] of [["elementId", "elementIdRegex"], ["className", "classNameRegex"]]) {
      if (r[flag] && r[field]) {
        const converted = regexToWildcard(r[field]);
        // Unconvertible rules are kept but disabled so the user can fix or delete them.
        if (converted === null) r.enabled = false;
        else r[field] = converted;
      }
      delete r[flag];
    }
    return r;
  }

  return { normalize };
})();
