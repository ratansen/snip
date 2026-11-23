const $ = (id) => document.getElementById(id);

function getRules() {
  return new Promise((resolve) =>
    chrome.storage.sync.get({ rules: [] }, ({ rules }) => resolve(rules))
  );
}

function saveRules(rules) {
  return new Promise((resolve) => chrome.storage.sync.set({ rules }, resolve));
}

async function render() {
  const rules = await getRules();
  const list = $("rules");
  list.innerHTML = "";

  if (!rules.length) {
    list.innerHTML = '<li class="empty">No rules yet.</li>';
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
    const code = document.createElement("code");
    code.textContent = (rule.type === "id" ? "#" : ".") + rule.value;
    sel.append(rule.type + " ", code);
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

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const value = $("value").value.trim().replace(/^[#.]/, "");
  if (!value) return;
  const rules = await getRules();
  rules.push({
    id: crypto.randomUUID(),
    urlPrefix: $("prefix").value.trim(),
    type: $("type").value,
    value,
    enabled: true,
  });
  await saveRules(rules);
  $("value").value = "";
  render();
});

// Prefill the prefix with the current tab's origin.
chrome.tabs?.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab?.url && /^https?:/.test(tab.url)) {
    $("prefix").value = new URL(tab.url).origin + "/";
  }
});

render();
