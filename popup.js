const $ = (id) => document.getElementById(id);

function getRules() {
  return new Promise((resolve) =>
    chrome.storage.sync.get({ rules: [] }, ({ rules }) => resolve(rules.map(SnipRules.normalize)))
  );
}

function saveRules(rules) {
  return new Promise((resolve) => chrome.storage.sync.set({ rules }, resolve));
}

function chip(label, value) {
  const code = document.createElement("code");
  code.textContent = `${label}: ${value}`;
  return code;
}

async function render() {
  const rules = await getRules();
  const list = $("rules");
  list.replaceChildren();

  if (!rules.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No rules yet.";
    list.appendChild(li);
    return;
  }

  for (const rule of rules) {
    const li = document.createElement("li");

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = rule.enabled !== false;
    toggle.title = "Enabled";
    toggle.addEventListener("change", async () => {
      const all = await getRules();
      const r = all.find((x) => x.id === rule.id);
      if (r) r.enabled = toggle.checked;
      await saveRules(all);
    });

    const info = document.createElement("div");
    info.className = "info";
    const sel = document.createElement("div");
    if (rule.elementId) sel.append(chip("id", rule.elementId));
    if (rule.className) sel.append(chip("class", rule.className));
    const prefix = document.createElement("div");
    prefix.className = "prefix";
    prefix.textContent = rule.urlPrefix || "(all pages)";
    prefix.title = prefix.textContent;
    info.append(sel, prefix);

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.addEventListener("click", async () => {
      await saveRules((await getRules()).filter((x) => x.id !== rule.id));
      render();
    });

    li.append(toggle, info, del);
    list.appendChild(li);
  }
}

const onlyWildcards = (p) => /^\*+$/.test(p);

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("error").textContent = "";

  const elementId = $("elementId").value.trim().replace(/^#/, "");
  const className = $("className").value.trim().replace(/^\./, "");
  if (!elementId && !className) {
    $("error").textContent = "Enter an ID, a class, or both.";
    return;
  }
  if (onlyWildcards(elementId) || className.split(/[\s.]+/).some(onlyWildcards)) {
    $("error").textContent = "A pattern of only * would match every element. Add some text around it.";
    return;
  }

  const rules = await getRules();
  rules.push({
    id: crypto.randomUUID(),
    urlPrefix: $("prefix").value.trim(),
    elementId,
    className,
    enabled: true,
  });
  await saveRules(rules);
  $("elementId").value = "";
  $("className").value = "";
  render();
});

// Prefill the prefix with the current tab's origin.
chrome.tabs?.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab?.url && /^https?:/.test(tab.url)) {
    $("prefix").value = new URL(tab.url).origin + "/";
  }
});

render();
