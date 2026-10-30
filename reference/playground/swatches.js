/*
 * Swatches playground: every parameter of the Swatches contract, in a
 * Field (the group is named by the label).
 * Spec: docs/components/swatches.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const palette = [
  ["#3b82f6", "Blue"], ["#06b6d4", "Cyan"], ["#22c55e", "Green"], ["#eab308", "Yellow"], ["#f97316", "Orange"],
  ["#ef4444", "Red"], ["#ec4899", "Pink"], ["#a855f7", "Purple"], ["#6366f1", "Indigo"], ["#71717a", "Gray"],
  ["#18181b", "Black"], ["#ffffff", "White"],
];

export const controls = [
  { group: "Swatches", name: "label", label: "Label", type: "text", default: "Color" },
  { group: "Swatches", name: "count", label: "Colors", type: "select", options: ["3", "5", "9", "12"], default: "9" },
  { group: "Swatches", name: "chosen", label: "Chosen", type: "select", options: [["", "(none)"], ["0", "the first"], ["2", "the third"]], default: "0" },
  { group: "Swatches", name: "collapse", label: "Expanding (data-collapse, canon.js)", type: "checkbox" },

  { group: "State", name: "disabledOne", label: "Third color disabled", type: "checkbox" },
  { group: "State", name: "disabled", label: "All disabled", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-swatches";
  const fieldAttrs = [`class="canon-field"`];
  if (s.size) fieldAttrs.push(`data-size="${s.size}"`);
  const groupAttrs = [`class="canon-swatches"`, `role="radiogroup"`, `aria-labelledby="${id}-label"`];
  if (s.collapse) groupAttrs.push("data-collapse");

  const lines = [`<div ${fieldAttrs.join(" ")}>`];
  lines.push(`  <div class="canon-label"><span class="canon-label-text" id="${id}-label">${escape(s.label)}</span></div>`);
  lines.push(`  <div ${groupAttrs.join(" ")}>`);
  palette.slice(0, Number(s.count)).forEach(([value, name], i) => {
    const attrs = [`type="radio"`, `name="color"`, `value="${value}"`, `aria-label="${name}"`];
    if (String(i) === s.chosen) attrs.push("checked");
    if (s.disabled || (s.disabledOne && i === 2)) attrs.push("disabled");
    lines.push(`    <input ${attrs.join(" ")}>`);
  });
  lines.push(`  </div>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
