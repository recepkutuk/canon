/*
 * Menu playground: a button and its menu, with every kind of item.
 * Spec: docs/components/menu.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Trigger", name: "label", label: "Button label", type: "text", default: "Options" },
  { group: "Items", name: "icons", label: "Icons", type: "checkbox", default: true },
  { group: "Items", name: "shortcuts", label: "Shortcuts (Kbd)", type: "checkbox", default: true },
  { group: "Items", name: "disabled", label: "A disabled item", type: "checkbox", default: true },
  { group: "Items", name: "submenu", label: "A submenu", type: "checkbox", default: true },
  { group: "Items", name: "checks", label: "Checks", type: "select", options: [["", "(none)"], ["checkbox", "menuitemcheckbox"], ["radio", "menuitemradio group"]], default: "checkbox" },
  { group: "Items", name: "danger", label: "A destructive item", type: "checkbox", default: true },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-menu";
  const item = (label, { icon, kbd, keys, role = "menuitem", checked, disabled, intent, sub } = {}) => {
    const attrs = [`type="button"`, `class="canon-menu-item"`, `role="${role}"`];
    if (checked !== undefined) attrs.push(`aria-checked="${checked}"`);
    if (intent) attrs.push(`data-intent="${intent}"`);
    if (disabled) attrs.push(`aria-disabled="true"`);
    if (keys && s.shortcuts) attrs.push(`aria-keyshortcuts="${keys}"`);
    if (sub) attrs.push(`popovertarget="${sub}"`, `aria-haspopup="menu"`);
    const lines = [`  <button ${attrs.join(" ")}>`];
    if (icon && s.icons) lines.push(`    <span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span>`);
    lines.push(`    <span class="canon-menu-label">${label}</span>`);
    if (kbd && s.shortcuts) lines.push(`    <kbd class="canon-kbd" aria-hidden="true">${kbd}</kbd>`);
    lines.push(`  </button>`);
    return lines;
  };
  const size = s.size ? ` data-size="${s.size}"` : "";
  const wrap = [];
  if (s.dir === "rtl" || s.size) wrap.push(`<div${s.dir === "rtl" ? ` dir="rtl"` : ""}${size}>`);
  const lines = [
    `<button type="button" class="canon-button" id="${id}-trigger" data-emphasis="low" data-intent="neutral" popovertarget="${id}" aria-haspopup="menu" aria-expanded="false">`,
    `  <span class="canon-button-label">${escape(s.label)}</span>`,
    `</button>`,
    `<div class="canon-menu" id="${id}" popover role="menu" aria-labelledby="${id}-trigger">`,
    ...item("New file", { icon: "plus", kbd: "⌘N", keys: "Meta+N" }),
    ...item("Duplicate", { icon: "copy", kbd: "⌘D", keys: "Meta+D" }),
  ];
  if (s.disabled) lines.push(...item("Rename", { icon: "settings", kbd: "F2", keys: "F2", disabled: true }));
  if (s.submenu) lines.push(...item("Share", { icon: "link", sub: `${id}-share` }));
  if (s.checks === "checkbox") lines.push(`  <hr class="canon-separator">`, ...item("Show hidden files", { role: "menuitemcheckbox", checked: true }), ...item("Show extensions", { role: "menuitemcheckbox", checked: false }));
  if (s.checks === "radio") {
    lines.push(`  <hr class="canon-separator">`, `  <div class="canon-menu-group" role="group" aria-labelledby="${id}-sort">`, `    <div class="canon-menu-heading" id="${id}-sort">Sort by</div>`);
    for (const [label, on] of [["Name", true], ["Date", false], ["Size", false]]) lines.push(...item(label, { role: "menuitemradio", checked: on }).map((line) => `  ${line}`));
    lines.push(`  </div>`);
  }
  if (s.danger) lines.push(`  <hr class="canon-separator">`, ...item("Delete", { icon: "trash", kbd: "⌘⌫", keys: "Meta+Backspace", intent: "danger" }));
  lines.push(`</div>`);
  if (s.submenu) lines.push(`<div class="canon-menu" id="${id}-share" popover role="menu" aria-label="Share">`, ...item("Copy link"), ...item("Email…"), `</div>`);
  if (!wrap.length) return lines.join("\n");
  return [...wrap, ...lines.map((line) => `  ${line}`), `</div>`].join("\n");
}
