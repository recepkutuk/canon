/*
 * Slider playground. Spec: docs/components/slider.md
 */

import { labelControls, labelLines, describedByDescription } from "./_label.js";

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const markSets = {
  priority: { min: 0, max: 2, step: 1, value: 1, marks: [[0, "Low"], [1, "Medium"], [2, "High"]] },
  retention: { min: 30, max: 365, step: 1, value: 180, marks: [[30, "1 month"], [180, "6 months"], [365, "1 year"]] },
};

/* The stage's width; the preview's frame narrows it further. */
export const width = "24rem";

export const controls = [
  ...labelControls({ label: "CPU limit" }),


  { group: "Range", name: "marks", label: "Named marks (datalist)", type: "select", options: [["", "(none)"], ["priority", "Low / Medium / High (even)"], ["retention", "1 month / 6 months / 1 year (uneven)"]], default: "" },
  { group: "Range", name: "min", label: "min", type: "number", min: -1000, max: 1000, default: "0", when: (s) => !s.marks },
  { group: "Range", name: "max", label: "max", type: "number", min: -1000, max: 10000, default: "16", when: (s) => !s.marks },
  { group: "Range", name: "step", label: "step", type: "select", options: ["1", "0.5", "0.1", "5", "10"], default: "1", when: (s) => !s.marks },
  { group: "Range", name: "value", label: "value", type: "number", min: -1000, max: 10000, default: "4", when: (s) => !s.marks },

  { group: "Box", name: "output", label: "Value (<output>)", type: "checkbox", default: true },
  { group: "Box", name: "prefix", label: "Min label (prefix)", type: "text", default: "0", when: (s) => !s.marks },
  { group: "Box", name: "suffix", label: "Max label (suffix)", type: "text", default: "16 vCPU", when: (s) => !s.marks },

  { group: "Message", name: "message", label: "Message", type: "select", options: [["", "(none)"], "danger", "warning", "success"], default: "" },
  { group: "Message", name: "messageText", label: "Message text", type: "text", default: "Your plan allows up to 8 vCPU.", when: (s) => s.message },

  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },

  { group: "Hints", name: "orientation", label: "data-orientation", type: "select", options: [["", "(horizontal)"], "vertical"], default: "" },
  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-slider";
  const set = markSets[s.marks];
  const range = set ?? { min: Number(s.min), max: Number(s.max), step: s.step, value: Number(s.value) };
  const describedBy = [];
  describedBy.push(...describedByDescription(s, id));
  if (s.message) describedBy.push(`${id}-message`);

  const fieldAttrs = [`class="canon-field"`];
  if (s.orientation) fieldAttrs.push(`data-orientation="${s.orientation}"`);
  if (s.size) fieldAttrs.push(`data-size="${s.size}"`);

  const attrs = [`type="range"`, `id="${id}"`, `name="slider"`, `min="${range.min}"`, `max="${range.max}"`, `step="${range.step}"`, `value="${range.value}"`];
  if (set) attrs.push(`list="${id}-marks"`);
  if (s.disabled) attrs.push("disabled");
  if (s.message === "danger") attrs.push('aria-invalid="true"');
  if (describedBy.length) attrs.push(`aria-describedby="${describedBy.join(" ")}"`);

  const shown = set ? (set.marks.find(([value]) => value === range.value)?.[1] ?? range.value) : range.value;

  const lines = [];
  lines.push(`<div ${fieldAttrs.join(" ")}>`);
  lines.push(...labelLines(s, { forId: id, idBase: id }));
  lines.push(`  <div class="canon-control">`);
  if (!set && s.prefix) lines.push(`    <span class="canon-control-prefix" aria-hidden="true">${escape(s.prefix)}</span>`);
  lines.push(`    <input ${attrs.join(" ")}>`);
  if (!set && s.suffix) lines.push(`    <span class="canon-control-suffix" aria-hidden="true">${escape(s.suffix)}</span>`);
  if (s.output) lines.push(`    <output class="canon-control-value" for="${id}" aria-hidden="true">${escape(String(shown))}</output>`);
  if (set) {
    lines.push(`    <datalist id="${id}-marks">`);
    for (const [value, text] of set.marks) lines.push(`      <option value="${value}">${text}</option>`);
    lines.push(`    </datalist>`);
  }
  lines.push(`  </div>`);
  if (s.message) lines.push(`  <p class="canon-field-message" id="${id}-message" data-intent="${s.message}">${escape(s.messageText)}</p>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
