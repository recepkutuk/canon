/*
 * Shared by the checkbox, radio and switch playgrounds: they use the same
 * canon-choice anatomy, alone or in a fieldset, with different parameters.
 * Specs: docs/components/checkbox.md, radio.md, switch.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const isGroup = (s) => s.type === "radio" || s.arrangement === "group";
const isSingle = (s) => !isGroup(s);

const allControls = [
  { group: "Component", name: "arrangement", label: "Arrangement", type: "select", options: [["single", "single"], ["group", "group (fieldset)"]], default: "single", when: (s) => s.type !== "radio" },

  { group: "Content", name: "label", label: "Label", type: "text", default: "Email me product updates", when: isSingle },
  { group: "Content", name: "legend", label: "Legend", type: "text", default: "Notify me about", when: isGroup },
  { group: "Content", name: "options", label: "Options (comma separated)", type: "text", default: "Deployments, Incidents, Billing", when: isGroup },
  { group: "Content", name: "hint", label: "Hint", type: "text", default: "" },
  { group: "Content", name: "stateText", label: "State text", type: "checkbox", default: false, when: (s) => s.type === "switch" && isSingle(s) },
  { group: "Content", name: "stateOff", label: "Off text", type: "text", default: "Off", when: (s) => s.type === "switch" && isSingle(s) && s.stateText },
  { group: "Content", name: "stateOn", label: "On text", type: "text", default: "On", when: (s) => s.type === "switch" && isSingle(s) && s.stateText },
  { group: "Content", name: "itemHint", label: "Hint on the second option", type: "text", default: "", when: isGroup },

  { group: "Message", name: "message", label: "Message", type: "select", options: [["", "(none)"], "danger", "warning", "success"], default: "" },
  { group: "Message", name: "messageText", label: "Message text", type: "text", default: "Select at least one option.", when: (s) => s.message },

  { group: "State", name: "checked", label: "checked", type: "checkbox", default: false, when: isSingle },
  { group: "State", name: "checkedOption", label: "Checked option", type: "select", options: [["", "(none)"], ["1", "first"], ["2", "second"], ["3", "third"]], default: "1", when: isGroup },
  { group: "State", name: "indeterminate", label: "indeterminate (DOM property)", type: "checkbox", default: false, when: (s) => s.type === "checkbox" && isSingle(s) },
  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },
  { group: "State", name: "required", label: "required", type: "checkbox", when: (s) => s.type !== "switch" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },
  { group: "Hints", name: "orientation", label: "data-orientation", type: "select", options: [["", "(theme decides)"], "horizontal", "vertical"], default: "", when: isGroup },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

function inputAttrs(s, id, extra = []) {
  const attrs = [];
  attrs.push(`type="${s.type === "radio" ? "radio" : "checkbox"}"`);
  if (s.type === "switch") attrs.push('role="switch"');
  attrs.push(`id="${id}"`, ...extra);
  return attrs;
}

function render(s) {
  const size = s.size ? ` data-size="${s.size}"` : "";
  const lines = [];

  if (isSingle(s)) {
    const id = "pg-choice";
    const describedBy = [];
    if (s.hint) describedBy.push(`${id}-hint`);
    if (s.message) describedBy.push(`${id}-message`);
    const attrs = inputAttrs(s, id, [`name="choice"`]);
    if (s.checked) attrs.push("checked");
    if (s.disabled) attrs.push("disabled");
    if (s.required) attrs.push("required");
    if (s.message === "danger") attrs.push('aria-invalid="true"');
    if (describedBy.length) attrs.push(`aria-describedby="${describedBy.join(" ")}"`);

    lines.push(`<div class="canon-choice"${size}>`);
    lines.push(`  <input ${attrs.join(" ")}>`);
    lines.push(`  <label class="canon-choice-label" for="${id}">${escape(s.label)}</label>`);
    if (s.hint) lines.push(`  <p class="canon-choice-hint" id="${id}-hint">${escape(s.hint)}</p>`);
    if (s.type === "switch" && s.stateText) {
      lines.push(`  <span class="canon-choice-state" aria-hidden="true">`);
      lines.push(`    <span class="canon-choice-state-off">${escape(s.stateOff)}</span>`);
      lines.push(`    <span class="canon-choice-state-on">${escape(s.stateOn)}</span>`);
      lines.push(`  </span>`);
    }
    if (s.message) lines.push(`  <p class="canon-choice-message" id="${id}-message" data-intent="${s.message}">${escape(s.messageText)}</p>`);
    lines.push(`</div>`);
    if (s.type === "checkbox" && s.indeterminate) lines.push(`<!-- from JS: document.getElementById("${id}").indeterminate = true -->`);
    return lines.join("\n");
  }

  const id = "pg-group";
  const describedBy = [];
  if (s.hint) describedBy.push(`${id}-hint`);
  if (s.message) describedBy.push(`${id}-message`);
  const fieldsetAttrs = [`class="canon-fieldset"`];
  if (s.orientation) fieldsetAttrs.push(`data-orientation="${s.orientation}"`);
  if (s.size) fieldsetAttrs.push(`data-size="${s.size}"`);
  if (s.disabled) fieldsetAttrs.push("disabled");
  if (describedBy.length) fieldsetAttrs.push(`aria-describedby="${describedBy.join(" ")}"`);

  lines.push(`<fieldset ${fieldsetAttrs.join(" ")}>`);
  lines.push(`  <legend class="canon-fieldset-legend">${escape(s.legend)}</legend>`);
  if (s.hint) lines.push(`  <p class="canon-fieldset-hint" id="${id}-hint">${escape(s.hint)}</p>`);

  const options = s.options.split(",").map((option) => option.trim()).filter(Boolean);
  options.forEach((option, index) => {
    const optionId = `${id}-${index + 1}`;
    const value = option.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || String(index + 1);
    const hasHint = index === 1 && s.itemHint;
    const attrs = inputAttrs(s, optionId, [`name="${s.type === "radio" ? "choice" : "choices"}"`, `value="${value}"`]);
    if (String(index + 1) === s.checkedOption) attrs.push("checked");
    if (s.required && s.type === "radio") attrs.push("required");
    if (hasHint) attrs.push(`aria-describedby="${optionId}-hint"`);
    lines.push(`  <div class="canon-choice">`);
    lines.push(`    <input ${attrs.join(" ")}>`);
    lines.push(`    <label class="canon-choice-label" for="${optionId}">${escape(option)}</label>`);
    if (hasHint) lines.push(`    <p class="canon-choice-hint" id="${optionId}-hint">${escape(s.itemHint)}</p>`);
    lines.push(`  </div>`);
  });

  if (s.message) lines.push(`  <p class="canon-fieldset-message" id="${id}-message" data-intent="${s.message}">${escape(s.messageText)}</p>`);
  lines.push(`</fieldset>`);
  return lines.join("\n");
}

/* indeterminate has no HTML attribute: it is set on the rendered input. */
function enhance(stage, s) {
  const input = stage.querySelector("#pg-choice");
  if (input && s.type === "checkbox") input.indeterminate = Boolean(s.indeterminate);
}

/* Per-component defaults; controls that don't apply to the type are dropped. */
const defaults = {
  checkbox: { label: "Email me product updates", legend: "Notify me about", options: "Deployments, Incidents, Billing", messageText: "Select at least one option." },
  radio: { legend: "Plan", options: "Free, Team, Enterprise", messageText: "Choose a plan." },
  switch: { label: "Maintenance mode", legend: "Security", options: "Two-factor authentication, Single sign-on only, Audit log", messageText: "Turn on at least one option." },
};

export function choicePlayground(type) {
  const controls = allControls
    .filter((control) => !control.when || appliesTo(control, type))
    .map((control) => {
      const override = defaults[type][control.name];
      return {
        ...control,
        ...(override !== undefined && { default: override }),
        ...(control.when && { when: (s) => control.when({ ...s, type }) }),
      };
    });
  return {
    width: "24rem",
    controls,
    render: (s) => render({ ...s, type }),
    enhance: (stage, s) => enhance(stage, { ...s, type }),
  };
}

/* A control applies if its condition can be true for this type. */
function appliesTo(control, type) {
  return [{ arrangement: "single" }, { arrangement: "group" }].some((state) => control.when({ ...state, type, message: "x", stateText: true }));
}
