/*
 * Password playground: every parameter of the Password contract: the box,
 * the strength meter, the rules and a confirmation, on their own (named
 * with aria-label). With a label it is a Field.
 * Spec: docs/components/password.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ruleStates = [["", "pending"], ["met", "met"], ["error", "error"]];
const rules = [
  ["min-length:8", "at least 8 characters"],
  ["digit", "at least 1 number"],
  ["lowercase", "at least 1 lowercase letter"],
  ["uppercase", "at least 1 uppercase letter"],
  ["symbol", "at least 1 special character"],
];
const words = ["", "Weakest", "Weak", "Medium", "Strong"];
const checked = (s) => s.rules && s.check;

export const controls = [
  { group: "Box", name: "name", label: "aria-label", type: "text", default: "Password" },
  { group: "Box", name: "value", label: "Value", type: "text", default: "" },
  { group: "Box", name: "autocomplete", label: "autocomplete", type: "select", options: ["new-password", "current-password"], default: "new-password" },
  { group: "Box", name: "toggle", label: "Show / hide button", type: "checkbox", default: true },
  { group: "Box", name: "generate", label: "Generate button", type: "checkbox", default: true },
  { group: "Box", name: "status", label: "Status", type: "select", options: [["", "(none)"], ["error", 'error: aria-invalid="true"'], ["warning", 'data-intent="warning"'], ["success", 'data-intent="success"']], default: "" },
  { group: "Box", name: "disabled", label: "disabled", type: "checkbox" },

  { group: "Rules", name: "rules", label: "Rules list", type: "checkbox", default: true },
  { group: "Rules", name: "check", label: "Checked by canon.js (data-rule)", type: "checkbox", default: true, when: (s) => s.rules },
  { group: "Rules", name: "reveal", label: 'Show while they matter (data-reveal="focus")', type: "checkbox", default: true, when: checked },
  ...rules.map(([, rule], i) => ({ group: "Rules", name: `rule${i}`, label: rule, type: "select", options: ruleStates, default: "", when: (s) => s.rules && !s.check })),

  { group: "Strength", name: "strength", label: "Meter", type: "select", options: [["", "(none)"], ["rules", 'scored from the rules (data-score="rules")'], ["0", "app: 0, empty"], ["1", "app: 1, weakest"], ["2", "app: 2, weak"], ["3", "app: 3, medium"], ["4", "app: 4, strong"]], default: "rules" },
  { group: "Strength", name: "word", label: "Show the word", type: "checkbox", default: true, when: (s) => s.strength },

  { group: "Confirmation", name: "confirm", label: "Confirm password (data-match)", type: "checkbox", default: true },

  { group: "Hints", name: "size", label: "data-size (the boxes)", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const box = (s, id, name, extra) => {
  const boxAttrs = [`class="canon-password"`];
  if (id === "pg-password" && (s.status === "warning" || s.status === "success")) boxAttrs.push(`data-intent="${s.status}"`);
  if (s.size) boxAttrs.push(`data-size="${s.size}"`);
  const attrs = [`id="${id}"`, `type="password"`, `name="${id}"`, `aria-label="${escape(name)}"`, "placeholder", `autocomplete="${s.autocomplete}"`, ...extra];
  if (s.disabled) attrs.push("disabled");
  const lines = [`<div ${boxAttrs.join(" ")}>`, `  <input ${attrs.join(" ")}>`];
  if (s.generate && id === "pg-password") {
    lines.push(`  <button type="button" class="canon-button" data-emphasis="minimal" data-display="icon"`);
    lines.push(`          commandfor="${id}" command="--canon-generate-password">`);
    lines.push(`    <span class="canon-icon" data-icon="sparkles" aria-hidden="true"></span>`);
    lines.push(`    <span class="canon-button-label">Generate password</span>`);
    lines.push(`  </button>`);
  }
  if (s.toggle) {
    lines.push(`  <button type="button" class="canon-button" data-emphasis="minimal" data-display="icon" aria-pressed="false"`);
    lines.push(`          commandfor="${id}" command="--canon-toggle-password">`);
    lines.push(`    <span class="canon-icon" data-icon="eye" aria-hidden="true"></span>`);
    lines.push(`    <span class="canon-button-label">Show password</span>`);
    lines.push(`  </button>`);
  }
  lines.push(`</div>`);
  return lines;
};

export function render(s) {
  const id = "pg-password";
  const describedBy = [];
  if (s.strength) describedBy.push(`${id}-strength`);
  if (s.rules) describedBy.push(`${id}-rules`);

  const extra = [];
  if (s.value) extra.push(`value="${escape(s.value)}"`);
  if (s.status === "error") extra.push('aria-invalid="true"');
  if (describedBy.length) extra.push(`aria-describedby="${describedBy.join(" ")}"`);
  const lines = box(s, id, s.name, extra);

  if (s.strength) {
    const scored = s.strength === "rules";
    const value = scored ? "0" : s.strength;
    const word = scored ? "" : words[Number(value)];
    const attrs = [`class="canon-password-strength"`, `id="${id}-strength"`, `min="0"`, `max="4"`, `value="${value}"`, `aria-label="Password strength"`];
    if (word) attrs.push(`aria-valuetext="${word}"`);
    if (scored) attrs.push(`data-score="rules"`);
    lines.push(`<meter ${attrs.join(" ")}></meter>`);
    if (s.word) lines.push(`<p class="canon-password-strength-label" aria-hidden="true">${word}</p>`);
  }
  if (s.rules) {
    lines.push(`<div class="canon-password-rules" id="${id}-rules"${checked(s) && s.reveal ? ' data-reveal="focus"' : ""}>`);
    lines.push(`  <p class="canon-password-rules-title">Password must contain:</p>`);
    lines.push(`  <ul>`);
    rules.forEach(([check, rule], i) => {
      const state = !s.check && s[`rule${i}`];
      const attrs = [`class="canon-password-rule"`];
      if (checked(s)) attrs.push(`data-rule="${check}"`);
      if (state) attrs.push(`data-state="${state}"`);
      lines.push(`    <li ${attrs.join(" ")}>${rule}</li>`);
    });
    lines.push(`  </ul>`);
    lines.push(`</div>`);
  }
  if (s.confirm) lines.push(...box(s, `${id}-confirm`, "Confirm password", [`data-match="${id}"`]));
  return lines.join("\n");
}
