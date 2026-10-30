/*
 * Date playground: every parameter of the Date contract, in a Field.
 * Spec: docs/components/date.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Date", name: "label", label: "Label", type: "text", default: "Start date" },
  { group: "Date", name: "value", label: "value (2025-10-10, a week 2025-W42)", type: "text", default: "2025-10-10" },
  { group: "Date", name: "placeholder", label: "placeholder", type: "text", default: "" },
  { group: "Date", name: "kind", label: "Kind", type: "select", options: [["date", 'a date: type="date"'], ["range", "a range: two date inputs"], ["week", 'a week: type="week"']], default: "date" },
  { group: "Date", name: "end", label: "End value (range)", type: "text", default: "2025-10-24", when: (s) => s.kind === "range" },
  { group: "Date", name: "presets", label: "Presets (a <datalist>, range)", type: "checkbox", when: (s) => s.kind === "range" },
  { group: "Date", name: "inline", label: "data-inline (the calendar in the page)", type: "checkbox" },
  { group: "Date", name: "header", label: 'data-header="select" (month and year Selects)', type: "checkbox", when: (s) => s.kind !== "range" && !s.strip },
  { group: "Date", name: "strip", label: "data-strip (a week of days in the page)", type: "checkbox", when: (s) => s.kind === "date" && !s.inline },

  { group: "Can't be chosen", name: "min", label: "min", type: "text", default: "" },
  { group: "Can't be chosen", name: "max", label: "max", type: "text", default: "" },
  { group: "Can't be chosen", name: "weekdays", label: "data-weekdays (1 is Monday)", type: "text", default: "" },
  { group: "Can't be chosen", name: "unavailable", label: "data-unavailable", type: "text", default: "" },

  { group: "State", name: "status", label: "Status", type: "select", options: [["", "(none)"], ["error", 'error: aria-invalid="true"']], default: "" },
  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },
  { group: "State", name: "readonly", label: "readonly", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },
  { group: "Hints", name: "weekStart", label: "data-week-start", type: "select", options: [["", "(the language's)"], ["1", "1: Monday"], ["6", "6: Saturday"], ["7", "7: Sunday"]], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-date";
  const fieldAttrs = [`class="canon-field"`];
  if (s.size) fieldAttrs.push(`data-size="${s.size}"`);
  const boxAttrs = [`class="canon-date"`];
  if (s.inline) boxAttrs.push("data-inline");
  if (s.header && s.kind !== "range" && !s.strip) boxAttrs.push('data-header="select"');
  if (s.strip && s.kind === "date" && !s.inline) boxAttrs.push("data-strip");
  if (s.weekStart) boxAttrs.push(`data-week-start="${s.weekStart}"`);
  const attrs = [`type="${s.kind === "week" ? "week" : "date"}"`, `id="${id}"`, `name="date"`];
  if (s.value) attrs.push(`value="${escape(s.value)}"`);
  if (s.placeholder) attrs.push(`placeholder="${escape(s.placeholder)}"`);
  if (s.min) attrs.push(`min="${escape(s.min)}"`);
  if (s.max) attrs.push(`max="${escape(s.max)}"`);
  if (s.weekdays) attrs.push(`data-weekdays="${escape(s.weekdays)}"`);
  if (s.unavailable) attrs.push(`data-unavailable="${escape(s.unavailable)}"`);
  if (s.status === "error") attrs.push('aria-invalid="true"', `aria-describedby="${id}-message"`);
  if (s.disabled) attrs.push("disabled");
  if (s.readonly) attrs.push("readonly");

  if (s.kind === "range") {
    fieldAttrs.push('role="group"', `aria-labelledby="${id}-label"`);
    attrs[1] = `id="${id}"`;
    attrs[2] = `name="start"`;
    attrs.push(`aria-label="Start"`);
  }
  const lines = [`<div ${fieldAttrs.join(" ")}>`];
  lines.push(s.kind === "range"
    ? `  <div class="canon-label"><span class="canon-label-text" id="${id}-label">${escape(s.label)}</span></div>`
    : `  <div class="canon-label"><label class="canon-label-text" for="${id}">${escape(s.label)}</label></div>`);
  lines.push(`  <div ${boxAttrs.join(" ")}>`);
  lines.push(`    <input ${attrs.join(" ")}>`);
  if (s.kind === "range") {
    const end = attrs.filter((a) => !/^(id|name|value|aria-label)=/.test(a));
    end.splice(1, 0, `id="${id}-end"`, `name="end"`);
    if (s.end) end.push(`value="${escape(s.end)}"`);
    end.push(`aria-label="End"`);
    lines.push(`    <input ${end.join(" ")}>`);
    if (s.presets) {
      lines.push(`    <datalist>`);
      for (const value of ["all", "today", "yesterday", "this-week", "last-week", "this-month", "last-month", "this-year", "last-year"]) lines.push(`      <option value="${value}"></option>`);
      lines.push(`    </datalist>`);
    }
  }
  lines.push(`  </div>`);
  if (s.status === "error") lines.push(`  <p class="canon-field-message" id="${id}-message" data-intent="danger">Choose a later date.</p>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
