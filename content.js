// Removes elements matching stored rules whose URL prefix matches the current page.
// See rules.js for the rule shape. When both elementId and className are set,
// an element must match both.

(() => {
  const STYLE_ID = "__snip-style__";
  // Cap on CSS selector combinations generated per rule for pre-hiding.
  const MAX_SELECTORS = 16;
  let matchers = [];
  let observer = null;

  // Glob match where * matches any run of characters (including none).
  // Greedy left-to-right scan: linear in practice, no backtracking blow-up.
  function wildcardMatch(pattern, s) {
    const parts = pattern.split("*");
    if (parts.length === 1) return s === pattern;
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (s.length < first.length + last.length) return false;
    if (!s.startsWith(first) || !s.endsWith(last)) return false;
    let pos = first.length;
    const end = s.length - last.length;
    for (let i = 1; i < parts.length - 1; i++) {
      const idx = s.indexOf(parts[i], pos);
      if (idx === -1 || idx + parts[i].length > end) return false;
      pos = idx + parts[i].length;
    }
    return true;
  }

  const cssString = (v) => `"${v.replace(/["\\]/g, "\\$&")}"`;

  // Classifies a pattern into a shape CSS attribute selectors can express.
  function shape(p) {
    if (!p.includes("*")) return { kind: "exact", text: p };
    const parts = p.split("*");
    if (parts.length === 2 && parts[0] && !parts[1]) return { kind: "prefix", text: parts[0] };
    if (parts.length === 2 && !parts[0] && parts[1]) return { kind: "suffix", text: parts[1] };
    if (parts.length === 3 && !parts[0] && parts[1] && !parts[2]) return { kind: "contains", text: parts[1] };
    return null;
  }

  // CSS alternatives matching an element whose id matches p, or null.
  function idSelectors(p) {
    const s = shape(p);
    if (!s) return null;
    const q = cssString(s.text);
    return {
      exact: ["#" + CSS.escape(s.text)],
      prefix: [`[id^=${q}]`],
      suffix: [`[id$=${q}]`],
      contains: [`[id*=${q}]`],
    }[s.kind];
  }

  // CSS alternatives matching an element with some class matching p, or null.
  function classSelectors(p) {
    const s = shape(p);
    if (!s) return null;
    const t = s.text;
    return {
      exact: ["." + CSS.escape(t)],
      prefix: [`[class^=${cssString(t)}]`, `[class*=${cssString(" " + t)}]`],
      suffix: [`[class$=${cssString(t)}]`, `[class*=${cssString(t + " ")}]`],
      contains: [`[class*=${cssString(t)}]`],
    }[s.kind];
  }

  // Cartesian product of compound-selector alternatives, or "" if too many.
  function combine(groups) {
    let out = [""];
    for (const alts of groups) {
      out = out.flatMap((pre) => alts.map((a) => pre + a));
      if (out.length > MAX_SELECTORS) return "";
    }
    return out.join(", ");
  }

  // Returns { test, selector } or null. selector is a CSS selector list used to
  // hide matches before they're parsed; "" when the patterns can't be expressed.
  function compile(rule) {
    const idPattern = (rule.elementId || "").trim().replace(/^#/, "");
    // "a b" or ".a.b" means an element having all those classes.
    const classPatterns = (rule.className || "").trim().replace(/\./g, " ").split(/\s+/).filter(Boolean);
    if (!idPattern && !classPatterns.length) return null;

    const test = (el) =>
      (!idPattern || (el.id !== "" && wildcardMatch(idPattern, el.id))) &&
      classPatterns.every((p) => Array.from(el.classList).some((c) => wildcardMatch(p, c)));

    const groups = [];
    if (idPattern) groups.push(idSelectors(idPattern));
    classPatterns.forEach((p) => groups.push(classSelectors(p)));
    const selector = groups.every(Boolean) ? combine(groups) : "";

    return { test, selector };
  }

  function matches(el) {
    return matchers.some((m) => m.test(el));
  }

  function scan(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (matches(root)) {
      root.remove();
      return;
    }
    root.querySelectorAll("[id], [class]").forEach((el) => {
      if (el.isConnected && matches(el)) el.remove();
    });
  }

  // A hiding stylesheet prevents a flash of content before elements are removed.
  function applyStyle() {
    const selector = matchers.map((m) => m.selector).filter(Boolean).join(", ");
    let style = document.getElementById(STYLE_ID);
    if (!selector) {
      style?.remove();
      return;
    }
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = `${selector} { display: none !important; }`;
  }

  function startObserver() {
    observer?.disconnect();
    if (!matchers.length) return;
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes") {
          if (m.target.isConnected && matches(m.target)) m.target.remove();
        } else {
          m.addedNodes.forEach(scan);
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["id", "class"],
    });
  }

  function apply(rules) {
    const url = location.href;
    matchers = (rules || [])
      .map(SnipRules.normalize)
      .filter((r) => r.enabled !== false && url.startsWith(r.urlPrefix || ""))
      .map(compile)
      .filter(Boolean);
    applyStyle();
    scan(document.documentElement);
    startObserver();
  }

  function load() {
    chrome.storage.sync.get({ rules: [] }, ({ rules }) => apply(rules));
  }

  load();
  document.addEventListener("DOMContentLoaded", () => scan(document.documentElement));

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.rules) apply(changes.rules.newValue);
  });

  // SPA navigations change the URL without reloading; re-evaluate prefixes.
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      load();
    }
  }, 500);
})();
