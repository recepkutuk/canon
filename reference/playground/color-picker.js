/*
 * Color Picker playground: every parameter of the Color Picker contract,
 * in a Field.
 * Spec: docs/components/color-picker.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const palette = [
  ["#3b82f6", "Blue"], ["#06b6d4", "Cyan"], ["#22c55e", "Green"], ["#eab308", "Yellow"], ["#f97316", "Orange"],
  ["#ef4444", "Red"], ["#ec4899", "Pink"], ["#a855f7", "Purple"], ["#6366f1", "Indigo"],
];

export const controls = [
  { group: "Color Picker", name: "label", label: "Label", type: "text", default: "Brand color" },
  { group: "Color Picker", name: "value", label: "value", type: "text", default: "#3b82f6" },
  { group: "Color Picker", name: "alpha", label: "alpha (opacity: an 8-digit hex value)", type: "checkbox" },
  { group: "Color Picker", name: "inline", label: "data-inline (in the page, no box)", type: "checkbox" },
  { group: "Color Picker", name: "swatches", label: "Swatches (a <datalist>)", type: "select", options: [["", "(none)"], ["3", "3 colors"], ["9", "9 colors"]], default: "9" },

  { group: "State", name: "status", label: "Status", type: "select", options: [["", "(none)"], ["error", 'error: aria-invalid="true"']], default: "" },
  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-color";
  const fieldAttrs = [`class="canon-field"`];
  if (s.size) fieldAttrs.push(`data-size="${s.size}"`);
  const attrs = [`type="color"`, `id="${id}"`, `name="color"`, `value="${escape(s.value)}"`];
  if (s.alpha) attrs.push("alpha");
  if (s.swatches) attrs.push(`list="${id}-swatches"`);
  if (s.status === "error") attrs.push('aria-invalid="true"', `aria-describedby="${id}-message"`);
  if (s.disabled) attrs.push("disabled");

  const lines = [`<div ${fieldAttrs.join(" ")}>`];
  lines.push(`  <div class="canon-label"><label class="canon-label-text" for="${id}">${escape(s.label)}</label></div>`);
  lines.push(`  <div class="canon-color"${s.inline ? " data-inline" : ""}>`);
  lines.push(`    <input ${attrs.join(" ")}>`);
  if (s.swatches) {
    lines.push(`    <datalist id="${id}-swatches">`);
    for (const [value, name] of palette.slice(0, Number(s.swatches))) lines.push(`      <option value="${value}" label="${name}"></option>`);
    lines.push(`    </datalist>`);
  }
  lines.push(`  </div>`);
  if (s.status === "error") lines.push(`  <p class="canon-field-message" id="${id}-message" data-intent="danger">Choose a darker color.</p>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
