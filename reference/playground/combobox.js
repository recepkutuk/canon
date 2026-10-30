/*
 * Combobox playground: every parameter of the Combobox contract, on its
 * own (named with aria-label). With a label it is a Field.
 * Spec: docs/components/combobox.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const icon = (name) => `<span class="canon-icon" data-icon="${name}" aria-hidden="true"></span>`;

const contents = {
  plain: [
    { label: "Option 1" }, { label: "Option 2" }, { label: "Option 3" }, { label: "Option 4" }, { label: "Option 5" },
  ],
  icons: [
    { label: "List", icon: "tag" }, { label: "Board", icon: "star" }, { label: "Settings", icon: "settings" }, { label: "Mail", icon: "mail" }, { label: "Links", icon: "link" },
  ],
  people: [
    { label: "Ada Lovelace", avatar: ["0", "AL", true] }, { label: "Grace Hopper", avatar: ["1", "GH"] }, { label: "Alan Turing", avatar: ["4", "AT"] }, { label: "Katherine Johnson", avatar: ["9", "KJ"] }, { label: "Edsger Dijkstra", avatar: ["15", "ED"] },
  ],
  statuses: [
    { label: "Waiting", intent: "warning", dot: true }, { label: "In review", intent: "info", dot: true }, { label: "Done", intent: "success", icon: "circle-check" }, { label: "Failed", intent: "danger", dot: true }, { label: "Archived", intent: "info", icon: "tag" },
  ],
  descriptions: [
    { label: "t3.micro", description: "2 vCPU · 1 GiB" }, { label: "t3.large", description: "2 vCPU · 8 GiB" }, { label: "c6i.xlarge", description: "4 vCPU · 8 GiB" }, { label: "c6i.4xlarge", description: "16 vCPU · 32 GiB" }, { label: "r6i.large", description: "2 vCPU · 16 GiB" },
  ],
};
const seeds = ["15", "3", "8", "5", "11"];

export const controls = [
  { group: "Combobox", name: "name", label: "aria-label", type: "text", default: "Option" },
  { group: "Combobox", name: "multiple", label: "multiple (several values, as tags)", type: "checkbox" },
  { group: "Combobox", name: "placeholder", label: "Placeholder (empty: none)", type: "text", default: "Please select" },
  { group: "Combobox", name: "chosen", label: "Chosen", type: "select", options: [["", "nothing (the placeholder)"], ["0", "the first option"], ["01", "the first two (multiple)"]], default: "" },
  { group: "Combobox", name: "required", label: "required", type: "checkbox" },
  { group: "Combobox", name: "search", label: "data-search", type: "select", options: [["", "(none: typing jumps)"], ["list", "list: a field in the list"], ["inline", "inline: type in the box"]], default: "" },
  { group: "Combobox", name: "creatable", label: "Offer to add new values (data-creatable, with a search)", type: "checkbox" },
  { group: "Combobox", name: "max", label: "data-max (multiple)", type: "select", options: [["", "(no limit)"], "1", "2", "3"], default: "" },
  { group: "Combobox", name: "collapse", label: 'Tags on one row (data-tags="collapse", multiple)', type: "checkbox" },

  { group: "Options", name: "content", label: "Options show", type: "select", options: [["plain", "Text"], ["icons", "An icon"], ["people", "An avatar"], ["descriptions", "A description"], ["statuses", "A status (data-intent, multiple)"], ["none", "None: free values (multiple, inline, creatable)"]], default: "plain" },
  { group: "Options", name: "groups", label: "In two groups, with a separator", type: "checkbox", default: true },
  { group: "Options", name: "disabledOption", label: "Last option disabled", type: "checkbox" },
  { group: "Options", name: "seeds", label: "Colored tags (data-seed, multiple)", type: "checkbox", default: true },

  { group: "Box", name: "leading", label: "Leading icon", type: "select", options: [["", "(none)"], "globe", "tag", "settings", "star"], default: "" },
  { group: "Box", name: "status", label: "Status", type: "select", options: [["", "(none)"], ["error", 'error: aria-invalid="true"'], ["warning", 'data-intent="warning"'], ["success", 'data-intent="success"']], default: "" },
  { group: "Box", name: "clear", label: "Clear button (--canon-clear)", type: "checkbox" },
  { group: "Box", name: "disabled", label: "disabled", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const option = (item, chosen, indent) => {
  const parts = [];
  if (item.dot) parts.push(`<span class="canon-tag-dot"></span>`);
  if (item.icon) parts.push(icon(item.icon));
  if (item.avatar) {
    const [seed, initials, photo] = item.avatar;
    parts.push(`<span class="canon-avatar" data-seed="${seed}">${photo ? '<img class="canon-avatar-image" src="assets/avatar-photo.jpg" alt="">' : ""}<span class="canon-avatar-fallback" aria-hidden="true">${initials}</span></span>`);
  }
  parts.push(item.icon || item.avatar || item.dot || item.description ? `<span class="canon-option-label">${escape(item.label)}</span>` : escape(item.label));
  if (item.description) parts.push(`<span class="canon-option-description">${escape(item.description)}</span>`);
  const attrs = [];
  if (item.seed) attrs.push(`data-seed="${item.seed}"`);
  if (item.intent) attrs.push(`data-intent="${item.intent}"`);
  if (chosen) attrs.push("selected");
  if (item.disabled) attrs.push("disabled");
  if (item.danger) attrs.push('data-intent="danger"');
  return `${indent}<option${attrs.length ? ` ${attrs.join(" ")}` : ""}>${parts.join(" ")}</option>`;
};

/* Free values: no options to pick, only the chosen ones. */
const freeValues = ["Design", "Research"];

export function render(s) {
  if (s.content === "none") s = { ...s, groups: false };
  const statuses = s.content === "statuses";
  const items = (s.content === "none" ? [] : contents[statuses && !s.multiple ? "plain" : s.content]).map((item, i) => ({ ...item, seed: s.multiple && s.seeds && !item.avatar && !item.intent ? seeds[i] : undefined }));
  if (s.disabledOption && items.length) items[items.length - 1].disabled = true;
  const chosen = new Set(s.chosen === "" ? [] : s.multiple ? [...s.chosen].map(Number) : [Number(s.chosen[0])]);

  const boxAttrs = [`class="canon-combobox"`];
  if (s.status === "warning" || s.status === "success") boxAttrs.push(`data-intent="${s.status}"`);
  if (s.size) boxAttrs.push(`data-size="${s.size}"`);
  if (s.search) boxAttrs.push(`data-search="${s.search}"`);
  if (s.creatable && s.search) boxAttrs.push("data-creatable");
  if (s.collapse && s.multiple) boxAttrs.push('data-tags="collapse"');
  const selectAttrs = [`id="pg-combobox"`, `name="option"`, `aria-label="${escape(s.name)}"`];
  if (s.multiple) selectAttrs.push("multiple");
  if (s.multiple && s.max) selectAttrs.push(`data-max="${s.max}"`);
  if (s.required) selectAttrs.push("required");
  if (s.status === "error") selectAttrs.push('aria-invalid="true"');
  if (s.disabled) selectAttrs.push("disabled");

  const lines = [`<div ${boxAttrs.join(" ")}>`];
  if (s.leading) lines.push(`  ${icon(s.leading)}`);
  lines.push(`  <select ${selectAttrs.join(" ")}>`);
  if (s.placeholder) lines.push(`    <option value="" hidden>${escape(s.placeholder)}</option>`);

  if (s.groups) {
    lines.push(`    <optgroup label="Recent">`);
    items.slice(0, 2).forEach((item, i) => lines.push(option(item, chosen.has(i), "      ")));
    lines.push(`    </optgroup>`);
    lines.push(`    <hr class="canon-separator">`);
    lines.push(`    <optgroup label="All">`);
    items.slice(2).forEach((item, i) => lines.push(option(item, chosen.has(i + 2), "      ")));
    lines.push(`    </optgroup>`);
  } else if (s.content === "none") {
    freeValues.forEach((label, i) => { if (chosen.has(i)) lines.push(option({ label }, true, "    ")); });
  } else {
    items.forEach((item, i) => lines.push(option(item, chosen.has(i), "    ")));
  }
  lines.push(`  </select>`);
  if (s.clear) {
    lines.push(`  <button type="button" class="canon-button" data-emphasis="minimal" data-display="icon" commandfor="pg-combobox" command="--canon-clear">`);
    lines.push(`    ${icon("close")}`);
    lines.push(`    <span class="canon-button-label">Clear</span>`);
    lines.push(`  </button>`);
  }
  lines.push(`</div>`);
  return lines.join("\n");
}
