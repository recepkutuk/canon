/*
 * Time playground: a time of day, or a range, in a Field.
 * Spec: docs/components/time.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Time", name: "label", label: "Label", type: "text", default: "Starts at" },
  { group: "Time", name: "range", label: "A range (start and end)", type: "checkbox", default: false },
  { group: "Time", name: "value", label: "value (empty: none)", type: "text", default: "08:00" },
  { group: "Time", name: "end", label: "End value", type: "text", default: "16:30", when: (s) => s.range },
  { group: "Time", name: "overnight", label: "data-overnight (the end may be the next day)", type: "checkbox", default: false, when: (s) => s.range },
  { group: "Time", name: "step", label: "step", type: "select", options: [["", "(1 minute)"], ["300", "300 (5 minutes)"], ["900", "900 (15 minutes)"], ["1800", "1800 (30 minutes)"], ["1", "1 (seconds)"]], default: "" },

  { group: "State", name: "status", label: "Status", type: "select", options: [["", "(none)"], ["error", 'error: aria-invalid="true"']], default: "" },
  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },
  { group: "State", name: "readonly", label: "readonly", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "lang", label: "Language", type: "select", options: [["en-GB", "English (24 hours)"], ["en-US", "English, US (12 hours)"], ["de", "German"]], default: "en-GB" },
  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-time";
  const field = [`class="canon-field"`, `lang="${s.lang}"`];
  if (s.range) field.push(`role="group"`, `aria-labelledby="${id}-label"`);
  if (s.size) field.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") field.push(`dir="rtl"`);
  const input = (inputId, name, value, extra = []) => {
    const attrs = [`type="time"`, `id="${inputId}"`, `name="${name}"`, ...extra];
    if (value.trim()) attrs.push(`value="${escape(value.trim())}"`);
    if (s.step) attrs.push(`step="${s.step}"`);
    if (s.status === "error") attrs.push(`aria-invalid="true"`, `aria-describedby="${id}-message"`);
    if (s.disabled) attrs.push("disabled");
    if (s.readonly) attrs.push("readonly");
    return `    <input ${attrs.join(" ")}>`;
  };
  const lines = [
    `<div ${field.join(" ")}>`,
    s.range
      ? `  <div class="canon-label"><span class="canon-label-text" id="${id}-label">${escape(s.label)}</span></div>`
      : `  <div class="canon-label"><label class="canon-label-text" for="${id}">${escape(s.label)}</label></div>`,
    `  <div class="canon-time"${s.range && s.overnight ? " data-overnight" : ""}>`,
    ...(s.range
      ? [input(`${id}`, "from", s.value, [`aria-label="Start"`]), input(`${id}-end`, "to", s.end, [`aria-label="End"`])]
      : [input(id, "time", s.value)]),
    `  </div>`,
  ];
  if (s.status === "error") lines.push(`  <p class="canon-field-message" id="${id}-message" data-intent="danger">Choose a time within opening hours.</p>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
