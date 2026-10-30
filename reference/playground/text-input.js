/*
 * Text Input playground: every parameter of the Text Input contract, on its
 * own (named with aria-label). With a label it is a Field.
 * Spec: docs/components/text-input.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const icons = [["", "(none)"], "square-chevron-left", "square-chevron-right", "mail", "search", "globe", "tag", "info", "link", "star", "settings"];
const icon = (name) => `<span class="canon-icon" data-icon="${name}" aria-hidden="true"></span>`;

export const controls = [
  { group: "Input", name: "name", label: "aria-label", type: "text", default: "Work email" },
  { group: "Input", name: "type", label: "type", type: "select", options: ["text", "email", "search", "url", "tel"], default: "email" },
  { group: "Input", name: "placeholder", label: "Placeholder (empty: bare)", type: "text", default: "name@example.com" },
  { group: "Input", name: "value", label: "Value", type: "text", default: "" },

  { group: "Box", name: "leading", label: "Leading icon", type: "select", options: icons, default: "mail" },
  { group: "Box", name: "prefix", label: "Prefix text", type: "text", default: "" },
  { group: "Box", name: "suffix", label: "Suffix text", type: "text", default: "" },
  { group: "Box", name: "trailing", label: "Trailing icon", type: "select", options: icons, default: "" },
  { group: "Box", name: "action", label: "Trailing action (canon.js)", type: "select", options: [["", "(none)"], ["clear", "Clear"], ["copy", "Copy"]], default: "", unavailable: { clear: (s) => s.value.trim() ? "" : "nothing to clear yet. It shows once the input has a value: fill in Value, or type in the preview" } },

  { group: "State", name: "status", label: "Status", type: "select", options: [["", "(none)"], ["error", 'error: aria-invalid="true"'], ["warning", 'data-intent="warning"'], ["success", 'data-intent="success"']], default: "" },
  { group: "State", name: "required", label: "required", type: "checkbox" },
  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },
  { group: "State", name: "readonly", label: "readonly", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-input";
  const type = s.type;
  const attrs = [`id="${id}"`, `type="${type}"`, `name="input"`, `aria-label="${escape(s.name)}"`];
  attrs.push(s.placeholder ? `placeholder="${escape(s.placeholder)}"` : "placeholder");
  if (s.value) attrs.push(`value="${escape(s.value)}"`);
  if (s.status === "error") attrs.push('aria-invalid="true"');
  if (s.required) attrs.push("required");
  if (s.disabled) attrs.push("disabled");
  if (s.readonly) attrs.push("readonly");

  const boxAttrs = [`class="canon-text-input"`];
  if (s.status === "warning" || s.status === "success") boxAttrs.push(`data-intent="${s.status}"`);
  if (s.size) boxAttrs.push(`data-size="${s.size}"`);
  const lines = [`<div ${boxAttrs.join(" ")}>`];
  if (s.leading) lines.push(`  ${icon(s.leading)}`);
  if (s.prefix) lines.push(`  <span class="canon-text-input-prefix" aria-hidden="true">${escape(s.prefix)}</span>`);
  lines.push(`  <input ${attrs.join(" ")}>`);
  if (s.suffix) lines.push(`  <span class="canon-text-input-suffix" aria-hidden="true">${escape(s.suffix)}</span>`);
  if (s.trailing) lines.push(`  ${icon(s.trailing)}`);
  if (s.action) {
    const action = {
      clear: { command: "--canon-clear", icon: "close", label: "Clear", extra: "" },
      copy: { command: "--canon-copy", icon: "copy", label: "Copy", extra: "" },
    }[s.action];
    lines.push(`  <button type="button" class="canon-button" data-emphasis="minimal" data-display="icon"${action.extra}`);
    lines.push(`          commandfor="${id}" command="${action.command}">`);
    lines.push(`    ${icon(action.icon)}`);
    lines.push(`    <span class="canon-button-label">${action.label}</span>`);
    lines.push(`  </button>`);
  }
  lines.push(`</div>`);
  return lines.join("\n");
}
