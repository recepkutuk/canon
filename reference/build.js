/*
 * The Build page: Core and the bundles an app chooses, as Canon's three
 * files. The rules are tools/bundle.mjs, the same the command line uses,
 * so both build the same files.
 */
import { resolveModules, sourcesFor, assemble } from "../tools/bundle.mjs";

const root = new URL("../", import.meta.url);
/* A source's text, tried again once if the server drops it. */
const fetchText = async (path, tries = 2) => {
  try {
    const response = await fetch(new URL(path, root));
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    return await response.text();
  } catch (error) {
    if (tries > 1) return fetchText(path, tries - 1);
    throw error;
  }
};
/* Every source, six at a time: some servers drop a hundred requests at once. */
const fetchAll = async (paths) => {
  const texts = new Map();
  const queue = [...paths];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const path = queue.shift();
      texts.set(path, await fetchText(path));
    }
  }));
  return texts;
};

const summary = document.getElementById("build-summary");
const list = document.getElementById("build-bundles");
let manifest, orders, texts;
try {
  manifest = JSON.parse(await fetchText("src/manifest.json"));
  orders = { css: JSON.parse(await fetchText("src/css/order.json")), js: JSON.parse(await fetchText("src/js/order.json")) };
  texts = await fetchAll(sourcesFor(orders, resolveModules(manifest, null).wanted));
} catch {
  summary.textContent = "Canon's sources couldn't be loaded. Reload the page to try again.";
  list.removeAttribute("aria-busy");
  throw new Error("Build: the sources didn't load");
}

const fileNames = ["canon.css", "canon.core.css", "canon.js"];
const read = (path) => texts.get(path);
const build = (names) => assemble(orders, resolveModules(manifest, names).wanted, read);
const weight = (files) => fileNames.reduce((sum, name) => sum + files[name].length, 0);
const formatSize = (bytes) => `${Math.max(1, Math.round(bytes / 1024))} KB`;
const gzipped = async (text) => {
  if (typeof CompressionStream === "undefined") return null;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return (await new Response(stream).blob()).size;
};

const bundles = manifest.bundles;
const always = bundles.filter((bundle) => bundle.always).map((bundle) => bundle.id);
const optional = bundles.filter((bundle) => !bundle.always);
const coreWeight = weight(build(always));
const chosen = new Set();

const titleOf = (name) => manifest.modules[name]?.title ?? name;
const element = (tag, className, text) => {
  const made = document.createElement(tag);
  if (className) made.className = className;
  if (text !== undefined) made.textContent = text;
  return made;
};

/* A line per bundle: its checkbox and name, what it's for, how many
   components (a Tooltip names them), its size (what it adds). */
for (const bundle of bundles) {
  const row = element("div", "ref-build-addon");
  const choice = element("div", "canon-choice");
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = `build-${bundle.id}`;
  input.value = bundle.id;
  const label = element("label", "canon-choice-label", bundle.title);
  label.htmlFor = input.id;
  const description = element("p", "canon-choice-hint", bundle.description);
  description.id = `${input.id}-hint`;
  input.setAttribute("aria-describedby", description.id);
  choice.append(input, label, description);

  const count = bundle.modules.length;
  const parts = element("button", "ref-build-count", count === 1 ? "1 component" : `${count} components`);
  parts.type = "button";
  const tip = element("div", "canon-tooltip", bundle.modules.map(titleOf).join(" · "));
  tip.id = `${input.id}-parts`;
  tip.popover = "hint";
  tip.setAttribute("role", "tooltip");
  parts.setAttribute("interestfor", tip.id);

  const size = element("span", "ref-build-weight");
  if (bundle.always) {
    row.classList.add("ref-build-addon-core");
    input.checked = true;
    input.disabled = true;
    size.textContent = formatSize(coreWeight);
  } else {
    size.textContent = `+${formatSize(weight(build([...always, bundle.id])) - coreWeight)}`;
    input.addEventListener("change", () => {
      if (input.checked) chosen.add(bundle.id);
      else chosen.delete(bundle.id);
      update();
    });
    /* The whole line toggles it; the checkbox, its label and the count
       do their own thing. */
    row.addEventListener("click", (event) => {
      if (event.target.closest("input, label, button")) return;
      input.click();
    });
  }
  const end = element("div", "ref-build-end");
  end.append(parts, size);
  row.append(choice, end, tip);
  list.append(row);
}
list.removeAttribute("aria-busy");

const setAll = (on) => {
  for (const bundle of optional) {
    document.getElementById(`build-${bundle.id}`).checked = on;
    if (on) chosen.add(bundle.id);
    else chosen.delete(bundle.id);
  }
  update();
};
document.getElementById("build-all").addEventListener("click", () => setAll(true));
document.getElementById("build-none").addEventListener("click", () => setAll(false));

/* The files: each with its size and its own download. */
const fileRows = new Map();
const files = element("dl", "canon-description-list");
files.dataset.label = "start";
for (const name of fileNames) {
  const row = document.createElement("div");
  const term = document.createElement("dt");
  term.append(element("code", "", name));
  const detail = document.createElement("dd");
  const size = element("span", "ref-build-size");
  const button = element("button", "canon-button");
  button.type = "button";
  button.dataset.emphasis = "low";
  button.dataset.intent = "neutral";
  button.dataset.size = "sm";
  const icon = element("span", "canon-icon");
  icon.dataset.icon = "download";
  icon.setAttribute("aria-hidden", "true");
  button.append(icon, element("span", "canon-button-label", `Download ${name}`));
  button.addEventListener("click", () => download(name));
  detail.append(size, button);
  row.append(term, detail);
  files.append(row);
  fileRows.set(name, size);
}
document.getElementById("build-files").append(files);

let built = null;
const download = (name) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([built[name]], { type: name.endsWith(".js") ? "text/javascript" : "text/css" }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};
document.getElementById("build-download").addEventListener("click", async () => {
  for (const name of fileNames) {
    download(name);
    /* Browsers keep up with downloads started one after another. */
    await new Promise((done) => setTimeout(done, 250));
  }
});

/* What the choice makes: the summary, the files, the command. */
let sizing = 0;
const update = async () => {
  const all = chosen.size === optional.length;
  const names = [...always, ...optional.filter((bundle) => chosen.has(bundle.id)).map((bundle) => bundle.id)];
  built = all ? assemble(orders, resolveModules(manifest, null).wanted, read) : build(names);
  const raw = weight(built);
  const said = all ? "Everything" : chosen.size ? `Core and ${chosen.size === 1 ? "1 bundle" : `${chosen.size} bundles`}` : "Core";
  summary.textContent = `${said}: ${formatSize(raw)}`;
  document.getElementById("build-command").textContent = all
    ? "node tools/build.mjs"
    : `node tools/build.mjs --only ${names.join(",")} --out dist`;
  for (const name of fileNames) fileRows.get(name).textContent = formatSize(built[name].length);
  const turn = ++sizing;
  const zipped = await Promise.all(fileNames.map((name) => gzipped(built[name])));
  if (turn !== sizing || zipped.includes(null)) return;
  fileNames.forEach((name, index) => {
    fileRows.get(name).textContent = `${formatSize(built[name].length)} (${formatSize(zipped[index])} gzipped)`;
  });
  summary.textContent = `${said}: ${formatSize(raw)} (${formatSize(zipped.reduce((sum, size) => sum + size, 0))} gzipped)`;
};

update();
