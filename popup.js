const $ = (id) => document.getElementById(id);

// Rules saved by v1.0 had { type: "id" | "class", value }.
function normalize(rule) {
  if (!rule.type) return rule;
  const { type, value, ...rest } = rule;
  return { ...rest, [type === "id" ? "elementId" : "className"]: value };
}

function getRules() {
  return new Promise((resolve) =>
    chrome.storage.sync.get({ rules: [] }, ({ rules }) => resolve(rules.map(normalize)))
  );
}

function saveRules(rules) {
  return new Promise((resolve) => chrome.storage.sync.set({ rules }, resolve));
}

function chip(label, value, regex) {
  const code = document.createElement("code");
  code.textContent = `${label}: ${regex ? `/${value}/` : value}`;
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
    if (rule.elementId) sel.append(chip("id", rule.elementId, rule.elementIdRegex));
    if (rule.className) sel.append(chip("class", rule.className, rule.classNameRegex));
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

// Returns the cleaned value, or throws with a message for the user.
function readField(inputId, regexId, label, stripPrefix) {
  const regex = $(regexId).checked;
  let value = $(inputId).value.trim();
  if (!value) return { value: "", regex };
  if (regex) {
    try {
      new RegExp(value);
    } catch (err) {
      throw new Error(`Invalid ${label} regex: ${err.message}`);
    }
  } else {
    value = value.replace(stripPrefix, "");
  }
  return { value, regex };
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("error").textContent = "";

  let id, cls;
  try {
    id = readField("elementId", "elementIdRegex", "ID", /^#/);
    cls = readField("className", "classNameRegex", "class", /^\./);
  } catch (err) {
    $("error").textContent = err.message;
    return;
  }
  if (!id.value && !cls.value) {
    $("error").textContent = "Enter an ID, a class, or both.";
    return;
  }

  const rules = await getRules();
  rules.push({
    id: crypto.randomUUID(),
    urlPrefix: $("prefix").value.trim(),
    elementId: id.value,
    elementIdRegex: id.regex,
    className: cls.value,
    classNameRegex: cls.regex,
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
