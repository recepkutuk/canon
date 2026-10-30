/*
 * Number Input playground: every parameter of the Number Input contract,
 * in a Field.
 * Spec: docs/components/number-input.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Number Input", name: "label", label: "Label", type: "text", default: "Guests" },
  { group: "Number Input", name: "value", label: "value", type: "text", default: "2" },
  { group: "Number Input", name: "min", label: "min", type: "text", default: "1" },
  { group: "Number Input", name: "max", label: "max", type: "text", default: "8" },
  { group: "Number Input", name: "step", label: "step", type: "text", default: "" },
  { group: "Number Input", name: "buttons", label: "Buttons", type: "select", options: [["around", "Around the value (− 2 +)"], ["end", "At the end, stacked"]], default: "around" },

  { group: "State", name: "status", label: "Status", type: "select", options: [["", "(none)"], ["error", 'error: aria-invalid="true"']], default: "" },
  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },
  { group: "State", name: "readonly", label: "readonly", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-number";
  const field = [`class="canon-field"`];
  if (s.size) field.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") field.push(`dir="rtl"`);
  const attrs = [`type="number"`, `id="${id}"`, `name="guests"`];
  if (s.value) attrs.push(`value="${escape(s.value)}"`);
  for (const key of ["min", "max", "step"]) if (s[key]) attrs.push(`${key}="${escape(s[key])}"`);
  if (s.status === "error") attrs.push(`aria-invalid="true"`, `aria-describedby="${id}-message"`);
  if (s.disabled) attrs.push("disabled");
  if (s.readonly) attrs.push("readonly");
  const button = (command, icon, label) => [
    `    <button type="button" class="canon-button" data-display="icon" commandfor="${id}" command="${command}">`,
    `      <span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span>`,
    `      <span class="canon-button-label">${label}</span>`,
    `    </button>`,
  ];
  const lines = [
    `<div ${field.join(" ")}>`,
    `  <div class="canon-label"><label class="canon-label-text" for="${id}">${escape(s.label)}</label></div>`,
    `  <div class="canon-number">`,
    ...(s.buttons === "end"
      ? [`    <input ${attrs.join(" ")}>`, ...button("--canon-step-up", "chevron-up", "Increase"), ...button("--canon-step-down", "chevron-down", "Decrease")]
      : [...button("--canon-step-down", "minus", "Decrease"), `    <input ${attrs.join(" ")}>`, ...button("--canon-step-up", "plus", "Increase")]),
    `  </div>`,
  ];
  if (s.status === "error") lines.push(`  <p class="canon-field-message" id="${id}-message" data-intent="danger">Choose a number from ${escape(s.min || "1")} to ${escape(s.max || "8")}.</p>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
