/*
 * Select playground: every parameter of the Select contract, on its own
 * (named with aria-label). With a label it is a Field.
 * Spec: docs/components/select.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const icon = (name) => `<span class="canon-icon" data-icon="${name}" aria-hidden="true"></span>`;

const contents = {
  plain: [
    { label: "Option 1" }, { label: "Option 2" }, { label: "Option 3" },
  ],
  icons: [
    { label: "List", icon: "tag" }, { label: "Board", icon: "star" }, { label: "Settings", icon: "settings" },
  ],
  people: [
    { label: "Ada Lovelace", avatar: ["0", "AL", true] }, { label: "Grace Hopper", avatar: ["1", "GH"] }, { label: "Alan Turing", avatar: ["4", "AT"] },
  ],
  descriptions: [
    { label: "t3.micro", description: "2 vCPU · 1 GiB" }, { label: "t3.large", description: "2 vCPU · 8 GiB" }, { label: "c6i.xlarge", description: "4 vCPU · 8 GiB" },
  ],
};

export const controls = [
  { group: "Select", name: "name", label: "aria-label", type: "text", default: "Option" },
  { group: "Select", name: "placeholder", label: "Placeholder (empty: none)", type: "text", default: "Please select" },
  { group: "Select", name: "chosen", label: "Chosen option", type: "select", options: [["", "(the placeholder)"], ["0", "first"], ["1", "second"]], default: "" },
  { group: "Select", name: "required", label: "required", type: "checkbox" },

  { group: "Options", name: "content", label: "Options show", type: "select", options: [["plain", "Text"], ["icons", "An icon"], ["people", "An avatar"], ["descriptions", "A description"]], default: "plain" },
  { group: "Options", name: "groups", label: "In two groups, with a separator", type: "checkbox", default: true },
  { group: "Options", name: "disabledOption", label: "Last option disabled", type: "checkbox" },
  { group: "Options", name: "danger", label: 'Add a destructive option (data-intent="danger")', type: "checkbox" },
  { group: "Options", name: "selectedcontent", label: "Show the chosen icon or avatar when closed (selectedcontent)", type: "checkbox", default: true },

  { group: "Box", name: "leading", label: "Leading icon", type: "select", options: [["", "(none)"], "globe", "tag", "settings", "star"], default: "" },
  { group: "Box", name: "status", label: "Status", type: "select", options: [["", "(none)"], ["error", 'error: aria-invalid="true"'], ["warning", 'data-intent="warning"'], ["success", 'data-intent="success"']], default: "" },
  { group: "Box", name: "disabled", label: "disabled", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const option = (item, chosen, indent) => {
  const parts = [];
  if (item.icon) parts.push(icon(item.icon));
  if (item.avatar) {
    const [seed, initials, photo] = item.avatar;
    parts.push(`<span class="canon-avatar" data-seed="${seed}">${photo ? '<img class="canon-avatar-image" src="assets/avatar-photo.jpg" alt="">' : ""}<span class="canon-avatar-fallback" aria-hidden="true">${initials}</span></span>`);
  }
  parts.push(item.icon || item.avatar || item.description ? `<span class="canon-option-label">${escape(item.label)}</span>` : escape(item.label));
  if (item.description) parts.push(`<span class="canon-option-description">${escape(item.description)}</span>`);
  const attrs = [];
  if (chosen) attrs.push("selected");
  if (item.disabled) attrs.push("disabled");
  if (item.danger) attrs.push('data-intent="danger"');
  return `${indent}<option${attrs.length ? ` ${attrs.join(" ")}` : ""}>${parts.join(" ")}</option>`;
};

export function render(s) {
  const items = contents[s.content].map((item) => ({ ...item }));
  if (s.disabledOption) items[items.length - 1].disabled = true;
  const chosen = s.chosen === "" ? -1 : Number(s.chosen);

  const boxAttrs = [`class="canon-select"`];
  if (s.status === "warning" || s.status === "success") boxAttrs.push(`data-intent="${s.status}"`);
  if (s.size) boxAttrs.push(`data-size="${s.size}"`);
  const selectAttrs = [`name="option"`, `aria-label="${escape(s.name)}"`];
  if (s.required) selectAttrs.push("required");
  if (s.status === "error") selectAttrs.push('aria-invalid="true"');
  if (s.disabled) selectAttrs.push("disabled");

  const lines = [`<div ${boxAttrs.join(" ")}>`];
  if (s.leading) lines.push(`  ${icon(s.leading)}`);
  lines.push(`  <select ${selectAttrs.join(" ")}>`);
  if (s.selectedcontent && s.content !== "plain") lines.push(`    <button><selectedcontent></selectedcontent></button>`);
  if (s.placeholder) lines.push(`    <option value="" hidden>${escape(s.placeholder)}</option>`);

  if (s.groups) {
    lines.push(`    <optgroup label="Recent">`);
    items.slice(0, 2).forEach((item, i) => lines.push(option(item, i === chosen, "      ")));
    lines.push(`    </optgroup>`);
    lines.push(`    <hr class="canon-separator">`);
    lines.push(`    <optgroup label="All">`);
    items.slice(2).forEach((item, i) => lines.push(option(item, i + 2 === chosen, "      ")));
    lines.push(`    </optgroup>`);
  } else {
    items.forEach((item, i) => lines.push(option(item, i === chosen, "    ")));
  }
  if (s.danger) {
    lines.push(`    <hr class="canon-separator">`);
    lines.push(`    <option data-intent="danger">Remove</option>`);
  }
  lines.push(`  </select>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
