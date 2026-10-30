/*
 * Split Button playground: every parameter of the Split Button contract.
 * Spec: docs/components/split-button.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Content", name: "label", label: "Label", type: "text", default: "Add" },
  { group: "Content", name: "icon", label: "Leading icon", type: "select", options: [["", "(none)"], "plus", "download", "trash", "copy"], default: "plus" },
  { group: "Content", name: "more", label: "Arrow's label (hidden)", type: "text", default: "More ways to add" },

  { group: "Meaning", name: "emphasis", label: "data-emphasis", type: "select", options: ["high", "medium", "low", "minimal"], default: "high" },
  { group: "Meaning", name: "intent", label: "data-intent", type: "select", options: [["", "(none: the accent)"], "neutral", "success", "warning", "danger"], default: "" },

  { group: "State", name: "disabled", label: "disabled", type: "select", options: [["", "(none)"], ["menu", "the arrow"], ["both", "both"]], default: "" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-split";
  const common = [`data-emphasis="${s.emphasis}"`];
  if (s.intent) common.push(`data-intent="${s.intent}"`);
  const wrap = [`class="canon-split-button"`];
  if (s.size) wrap.push(`data-size="${s.size}"`);
  const lines = [`<div ${wrap.join(" ")}>`];
  lines.push(`  <button type="button" class="canon-button" ${common.join(" ")}${s.disabled === "both" ? " disabled" : ""}>`);
  if (s.icon) lines.push(`    <span class="canon-icon" data-icon="${s.icon}" aria-hidden="true"></span>`);
  lines.push(`    <span class="canon-button-label">${escape(s.label)}</span>`, `  </button>`);
  lines.push(`  <button type="button" class="canon-button" ${common.join(" ")} data-display="icon" popovertarget="${id}-menu" aria-haspopup="menu" aria-expanded="false"${s.disabled ? " disabled" : ""}>`);
  lines.push(`    <span class="canon-button-label">${escape(s.more)}</span>`, `  </button>`, `</div>`);
  lines.push(`<div class="canon-menu" id="${id}-menu" popover role="menu" aria-label="${escape(s.more)}"${s.size ? ` data-size="${s.size}"` : ""}>`);
  for (const [label, icon] of [["Add from template", "copy"], ["Import…", "download"]]) {
    lines.push(`  <button type="button" class="canon-menu-item" role="menuitem">`, `    <span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span>`, `    <span class="canon-menu-label">${label}</span>`, `  </button>`);
  }
  lines.push(`</div>`);
  if (s.dir !== "rtl") return lines.join("\n");
  return [`<div dir="rtl">`, ...lines.map((line) => `  ${line}`), `</div>`].join("\n");
}
