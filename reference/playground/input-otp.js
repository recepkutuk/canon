/*
 * Input OTP playground: every parameter of the Input OTP contract,
 * in a Field.
 * Spec: docs/components/input-otp.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Input OTP", name: "label", label: "Label", type: "text", default: "Verification code" },
  { group: "Input OTP", name: "length", label: "maxlength", type: "select", options: ["4", "6", "8"], default: "6" },
  { group: "Input OTP", name: "groups", label: "data-groups", type: "text", default: "3 3" },
  { group: "Input OTP", name: "numeric", label: 'inputmode="numeric" (digits only)', type: "checkbox", default: true },
  { group: "Input OTP", name: "placeholder", label: "placeholder", type: "text", default: "" },
  { group: "Input OTP", name: "password", label: 'type="password" (dots)', type: "checkbox" },
  { group: "Input OTP", name: "value", label: "value", type: "text", default: "" },

  { group: "State", name: "status", label: "Status", type: "select", options: [["", "(none)"], ["error", 'error: aria-invalid="true"']], default: "" },
  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-otp";
  const fieldAttrs = [`class="canon-field"`];
  if (s.size) fieldAttrs.push(`data-size="${s.size}"`);
  const boxAttrs = [`class="canon-otp"`];
  if (s.groups.trim()) boxAttrs.push(`data-groups="${escape(s.groups.trim())}"`);
  const attrs = [`type="${s.password ? "password" : "text"}"`, `id="${id}"`, `name="code"`];
  if (s.numeric) attrs.push(`inputmode="numeric"`);
  attrs.push(`autocomplete="one-time-code"`, `maxlength="${s.length}"`);
  if (s.placeholder) attrs.push(`placeholder="${escape(s.placeholder)}"`);
  if (s.value) attrs.push(`value="${escape(s.value)}"`);
  if (s.status === "error") attrs.push('aria-invalid="true"', `aria-describedby="${id}-message"`);
  if (s.disabled) attrs.push("disabled");

  const lines = [`<div ${fieldAttrs.join(" ")}>`];
  lines.push(`  <div class="canon-label"><label class="canon-label-text" for="${id}">${escape(s.label)}</label></div>`);
  lines.push(`  <div ${boxAttrs.join(" ")}>`);
  lines.push(`    <input ${attrs.join(" ")}>`);
  lines.push(`  </div>`);
  if (s.status === "error") lines.push(`  <p class="canon-field-message" id="${id}-message" data-intent="danger">That code didn't work. Check it or send a new one.</p>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
