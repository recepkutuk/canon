/*
 * Field playground: every parameter of the Field contract.
 * Spec: docs/components/field.md
 */

import { labelControls, labelLines, describedByDescription } from "./_label.js";

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const icons = [["", "(none)"], "mail", "search", "globe", "tag", "info", "star", "settings"];
const isInput = (s) => s.control === "input";
const isTextarea = (s) => s.control === "textarea";
const isSelect = (s) => s.control === "select";
const isText = (s) => isInput(s) || isTextarea(s);
const isCountable = (s) => isTextarea(s) || (isInput(s) && s.inputType !== "password" && s.action !== "password");

/* The stage's width; the preview's frame narrows it further. */
export const width = "24rem";

export const controls = [
  ...labelControls({ label: "Work email", description: "Use your company address." }),

  { group: "Control", name: "control", label: "Native element", type: "select", options: [["input", "<input>"], ["textarea", "<textarea>"], ["select", "<select>"]], default: "input" },
  { group: "Control", name: "inputType", label: "type", type: "select", options: ["text", "email", "password", "search", "url", "tel", "number"], default: "email", when: isInput },

  { group: "Content", name: "placeholder", label: "placeholder", type: "select", options: [["bare", "bare (empty signal)"], ["text", "example text"], ["missing", "missing (authoring error)"]], default: "bare", when: isText },
  { group: "Content", name: "placeholderText", label: "Placeholder text", type: "text", default: "e.g. jane@acme.com", when: (s) => isText(s) && s.placeholder === "text" },
  { group: "Content", name: "value", label: "Value", type: "text", default: "", when: isText },
  { group: "Content", name: "labelAction", label: "Label action", type: "select", options: [["", "(none)"], ["link", "link"]], default: "" },

  { group: "Message", name: "message", label: "Message", type: "select", options: [["", "(none)"], "danger", "warning", "success", ["live", "empty live region"]], default: "" },
  { group: "Message", name: "messageText", label: "Message text", type: "text", default: "Enter a valid email address.", when: (s) => s.message && s.message !== "live" },

  { group: "Box", name: "leading", label: "Leading icon", type: "select", options: icons, default: "" },
  { group: "Box", name: "prefix", label: "Prefix text", type: "text", default: "", when: isInput },
  { group: "Box", name: "suffix", label: "Suffix text", type: "text", default: "", when: isInput },
  { group: "Box", name: "trailing", label: "Trailing icon", type: "select", options: icons, default: "", when: isInput },
  { group: "Box", name: "action", label: "Trailing action (canon.js)", type: "select", options: [["", "(none)"], ["clear", "clear"], ["password", "show password"], ["copy", "copy"]], default: "", when: isInput, unavailable: { clear: (s) => s.value.trim() ? "" : "nothing to clear yet. It shows once the input has a value: fill in Value, or type in the preview" } },

  { group: "Counter", name: "counter", label: "Character counter (canon.js)", type: "checkbox", when: isCountable },
  { group: "Counter", name: "limit", label: "Limit", type: "select", options: ["20", "80", "160", "280"], default: "80", when: (s) => isCountable(s) && s.counter },

  { group: "Textarea", name: "rows", label: "rows", type: "number", min: 1, max: 12, default: "3", when: isTextarea },
  { group: "Textarea", name: "maxLines", label: "data-max-lines", type: "select", options: [["", "(fixed at rows)"], "3", "5", "8", "none"], default: "", when: isTextarea },
  { group: "Textarea", name: "resize", label: "data-resize", type: "select", options: [["", "(theme decides)"], "vertical", "none"], default: "", when: isTextarea },

  { group: "Select", name: "options", label: "Options", type: "select", options: [["plain", "plain text"], ["rich", "rich (groups, descriptions)"]], default: "plain", when: isSelect },
  { group: "Select", name: "selectedcontent", label: "<selectedcontent> slot", type: "checkbox", default: true, when: (s) => isSelect(s) && s.options === "rich" },

  { group: "State", name: "required", label: "required", type: "checkbox" },
  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },
  { group: "State", name: "readonly", label: "readonly", type: "checkbox", when: isText },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },
  { group: "Hints", name: "expected", label: "Expected length (size)", type: "select", options: [["", "(fill)"], "4", "10", "20"], default: "", when: isInput },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const icon = (name) => `<span class="canon-icon" data-icon="${name}" aria-hidden="true"></span>`;

const plainOptions = ["Viewer", "Editor", "Admin"];
const richOptions = [
  ["General purpose", [["t3.micro", "2 vCPU · 1 GiB"], ["t3.large", "2 vCPU · 8 GiB"]]],
  ["Compute optimized", [["c6i.xlarge", "4 vCPU · 8 GiB"], ["c6i.4xlarge", "16 vCPU · 32 GiB"]]],
];

export function render(s) {
  const id = "pg-field";
  const describedBy = [];
  describedBy.push(...describedByDescription(s, id));
  if (s.message || (isCountable(s) && s.counter)) describedBy.push(`${id}-message`);

  const lines = [];
  lines.push(`<div class="canon-field"${s.size ? ` data-size="${s.size}"` : ""}>`);
  lines.push(...labelLines(s, { forId: id, idBase: id }));

  if (s.labelAction === "link") lines.push(`  <a class="canon-field-action" href="#example">Forgot password?</a>`);

  const isPassword = isInput(s) && (s.inputType === "password" || s.action === "password");
  lines.push(`  <div class="${isPassword ? "canon-password" : isInput(s) ? "canon-text-input" : isSelect(s) ? "canon-select" : isTextarea(s) ? "canon-textarea" : "canon-control"}">`);
  if (s.leading && !isTextarea(s)) lines.push(`    ${icon(s.leading)}`);
  if (isInput(s) && !isPassword && s.prefix) lines.push(`    <span class="canon-text-input-prefix" aria-hidden="true">${escape(s.prefix)}</span>`);

  /* The native element */
  const attrs = [`id="${id}"`, `name="field"`];
  if (isInput(s)) attrs.push(`type="${s.action === "password" ? "password" : s.inputType}"`);
  if (isTextarea(s)) {
    attrs.push(`rows="${s.rows || 3}"`);
    if (s.maxLines) attrs.push(`data-max-lines="${s.maxLines}"`);
    if (s.resize) attrs.push(`data-resize="${s.resize}"`);
  }
  if (isText(s)) {
    if (s.placeholder === "bare") attrs.push("placeholder");
    if (s.placeholder === "text") attrs.push(`placeholder="${escape(s.placeholderText)}"`);
  }
  if (isInput(s) && s.value) attrs.push(`value="${escape(s.value)}"`);
  if (isInput(s) && s.expected) attrs.push(`size="${s.expected}"`);
  if (isCountable(s) && s.counter) attrs.push(`maxlength="${s.limit}"`);
  if (s.required) attrs.push("required");
  if (s.disabled) attrs.push("disabled");
  if (isText(s) && s.readonly) attrs.push("readonly");
  if (s.message === "danger") attrs.push('aria-invalid="true"');
  if (describedBy.length) attrs.push(`aria-describedby="${describedBy.join(" ")}"`);

  if (isInput(s)) lines.push(`    <input ${attrs.join(" ")}>`);
  if (isTextarea(s)) lines.push(`    <textarea ${attrs.join(" ")}>${escape(s.value)}</textarea>`);
  if (isSelect(s)) {
    lines.push(`    <select ${attrs.join(" ")}>`);
    if (s.options === "rich") {
      if (s.selectedcontent) lines.push(`      <button><selectedcontent></selectedcontent></button>`);
      for (const [group, options] of richOptions) {
        lines.push(`      <optgroup label="${group}">`);
        for (const [value, description] of options) {
          lines.push(`        <option value="${value}">`);
          lines.push(`          <span class="canon-option-label">${value}</span>`);
          lines.push(`          <span class="canon-option-description">${description}</span>`);
          lines.push(`        </option>`);
        }
        lines.push(`      </optgroup>`);
      }
    } else {
      for (const option of plainOptions) lines.push(`      <option>${option}</option>`);
    }
    lines.push(`    </select>`);
  }

  if (isInput(s) && !isPassword && s.suffix) lines.push(`    <span class="canon-text-input-suffix" aria-hidden="true">${escape(s.suffix)}</span>`);
  if (isInput(s) && s.trailing) lines.push(`    ${icon(s.trailing)}`);
  if (isInput(s) && s.action) {
    const action = {
      clear: { command: "--canon-clear", icon: "close", label: "Clear", extra: "" },
      password: { command: "--canon-toggle-password", icon: "eye", label: "Show password", extra: ' aria-pressed="false"' },
      copy: { command: "--canon-copy", icon: "copy", label: "Copy", extra: "" },
    }[s.action];
    lines.push(`    <button type="button" class="canon-button" data-emphasis="minimal" data-display="icon"${action.extra}`);
    lines.push(`            commandfor="${id}" command="${action.command}">`);
    lines.push(`      ${icon(action.icon)}`);
    lines.push(`      <span class="canon-button-label">${action.label}</span>`);
    lines.push(`    </button>`);
  }
  lines.push(`  </div>`);

  if (s.message === "live") lines.push(`  <p class="canon-field-message" id="${id}-message" aria-live="polite"></p>`);
  else if (s.message) lines.push(`  <p class="canon-field-message" id="${id}-message" data-intent="${s.message}">${escape(s.messageText)}</p>`);
  else if (isCountable(s) && s.counter) lines.push(`  <p class="canon-field-message" id="${id}-message" aria-live="polite"></p>`);
  if (isCountable(s) && s.counter) lines.push(`  <p class="canon-field-counter"></p>`);
  lines.push(`</div>`);

  return lines.join("\n");
}
