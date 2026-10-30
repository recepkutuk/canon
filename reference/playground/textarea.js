/*
 * Textarea playground: every parameter of the Textarea contract, on its
 * own (named with aria-label). With a label it is a Field.
 * Spec: docs/components/textarea.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Textarea", name: "name", label: "aria-label", type: "text", default: "Notes" },
  { group: "Textarea", name: "placeholder", label: "Placeholder (empty: bare)", type: "text", default: "Anything we should know?" },
  { group: "Textarea", name: "value", label: "Value", type: "text", default: "" },
  { group: "Textarea", name: "maxlength", label: "maxlength", type: "select", options: [["", "(none)"], "140", "280", "500"], default: "" },

  { group: "Height", name: "rows", label: "rows", type: "select", options: ["1", "2", "3", "4", "5", "6"], default: "3" },
  { group: "Height", name: "maxLines", label: "data-max-lines (grow)", type: "select", options: [["", "(none: fixed, scrolls)"], "3", "4", "5", "6", "8", "10", "12", ["none", "none: no limit"]], default: "" },
  { group: "Height", name: "resize", label: "data-resize", type: "select", options: [["", "(theme decides)"], "vertical", "none"], default: "" },

  { group: "State", name: "status", label: "Status", type: "select", options: [["", "(none)"], ["error", 'error: aria-invalid="true"'], ["warning", 'data-intent="warning"'], ["success", 'data-intent="success"']], default: "" },
  { group: "State", name: "required", label: "required", type: "checkbox" },
  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },
  { group: "State", name: "readonly", label: "readonly", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const attrs = [`name="notes"`, `aria-label="${escape(s.name)}"`, `rows="${s.rows}"`];
  if (s.maxLines) attrs.push(`data-max-lines="${s.maxLines}"`);
  if (s.resize) attrs.push(`data-resize="${s.resize}"`);
  if (s.maxlength) attrs.push(`maxlength="${s.maxlength}"`);
  attrs.push(s.placeholder ? `placeholder="${escape(s.placeholder)}"` : "placeholder");
  if (s.status === "error") attrs.push('aria-invalid="true"');
  if (s.required) attrs.push("required");
  if (s.disabled) attrs.push("disabled");
  if (s.readonly) attrs.push("readonly");

  const boxAttrs = [`class="canon-textarea"`];
  if (s.status === "warning" || s.status === "success") boxAttrs.push(`data-intent="${s.status}"`);
  if (s.size) boxAttrs.push(`data-size="${s.size}"`);
  return [
    `<div ${boxAttrs.join(" ")}>`,
    `  <textarea ${attrs.join(" ")}>${escape(s.value)}</textarea>`,
    `</div>`,
  ].join("\n");
}
