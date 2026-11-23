// Removes elements matching stored rules whose URL prefix matches the current page.
// Rule shape: { id, urlPrefix, type: "id" | "class", value }

(() => {
  const STYLE_ID = "__snip-style__";
  let selector = "";
  let observer = null;

  function toSelector(rule) {
    const value = rule.value.trim();
    if (!value) return "";
    if (rule.type === "id") {
      return "#" + CSS.escape(value.replace(/^#/, ""));
    }
    // Class: allow "a b" or ".a.b" to mean an element having all those classes.
    const classes = value.replace(/\./g, " ").split(/\s+/).filter(Boolean);
    return classes.map((c) => "." + CSS.escape(c)).join("");
  }

  function buildSelector(rules) {
    const url = location.href;
    return rules
      .filter((r) => r.enabled !== false && url.startsWith(r.urlPrefix || ""))
      .map(toSelector)
      .filter(Boolean)
      .join(", ");
  }

  function removeMatches() {
    if (!selector) return;
    document.querySelectorAll(selector).forEach((el) => el.remove());
  }

  // A hiding stylesheet prevents a flash of content before elements are removed.
  function applyStyle() {
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
    if (!selector) return;
    observer = new MutationObserver(removeMatches);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["id", "class"],
    });
  }

  function apply(rules) {
    selector = buildSelector(rules || []);
    applyStyle();
    removeMatches();
    startObserver();
  }

  function load() {
    chrome.storage.sync.get({ rules: [] }, ({ rules }) => apply(rules));
  }

  load();
  document.addEventListener("DOMContentLoaded", removeMatches);

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
