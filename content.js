// Removes elements matching stored rules whose URL prefix matches the current page.
// Rule shape: { id, urlPrefix, elementId?, elementIdRegex, className?, classNameRegex, enabled }
// When both elementId and className are set, an element must match both.

(() => {
  const STYLE_ID = "__snip-style__";
  let matchers = [];
  let observer = null;

  // Rules saved by v1.0 had { type: "id" | "class", value }.
  function normalize(rule) {
    if (!rule.type) return rule;
    const { type, value, ...rest } = rule;
    return { ...rest, [type === "id" ? "elementId" : "className"]: value };
  }

  function compileRegex(pattern) {
    try {
      return new RegExp(pattern);
    } catch {
      return null;
    }
  }

  // Returns { test, selector } or null. selector is a CSS selector when the
  // rule has no regex parts, so it can be hidden before it's even parsed.
  function compile(rule) {
    const idValue = (rule.elementId || "").trim();
    const classValue = (rule.className || "").trim();
    if (!idValue && !classValue) return null;

    let idTest = null, idSel = "";
    if (idValue) {
      if (rule.elementIdRegex) {
        const re = compileRegex(idValue);
        if (!re) return null;
        idTest = (el) => re.test(el.id);
      } else {
        const id = idValue.replace(/^#/, "");
        idTest = (el) => el.id === id;
        idSel = "#" + CSS.escape(id);
      }
    }

    let classTest = null, classSel = "";
    if (classValue) {
      if (rule.classNameRegex) {
        // A regex matches if any single class name on the element matches.
        const re = compileRegex(classValue);
        if (!re) return null;
        classTest = (el) => Array.from(el.classList).some((c) => re.test(c));
      } else {
        // "a b" or ".a.b" means an element having all those classes.
        const names = classValue.replace(/\./g, " ").split(/\s+/).filter(Boolean);
        classTest = (el) => names.every((n) => el.classList.contains(n));
        classSel = names.map((n) => "." + CSS.escape(n)).join("");
      }
    }

    const literal = (!idValue || idSel) && (!classValue || classSel);
    return {
      test: (el) => (!idTest || idTest(el)) && (!classTest || classTest(el)),
      selector: literal ? idSel + classSel : null,
    };
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
      .map(normalize)
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
