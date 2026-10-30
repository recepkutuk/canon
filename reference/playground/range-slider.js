/*
 * Range Slider playground. Spec: docs/components/range-slider.md
 */

import { labelControls, labelLines, describedByDescription } from "./_label.js";

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const severity = { min: 0, max: 3, step: 1, from: 1, to: 3, marks: [[0, "Info"], [1, "Low"], [2, "High"], [3, "Critical"]] };

/* The stage's width; the preview's frame narrows it further. */
export const width = "24rem";

export const controls = [
  ...labelControls({ label: "Price" }),

  { group: "Content", name: "minName", label: "First thumb's name (aria-label)", type: "text", default: "Minimum" },
  { group: "Content", name: "maxName", label: "Second thumb's name (aria-label)", type: "text", default: "Maximum" },

  { group: "Range", name: "marks", label: "Named marks (datalist)", type: "select", options: [["", "(none)"], ["severity", "Info / Low / High / Critical"]], default: "" },
  { group: "Range", name: "min", label: "min", type: "number", min: -1000, max: 10000, default: "0", when: (s) => !s.marks },
  { group: "Range", name: "max", label: "max", type: "number", min: -1000, max: 10000, default: "1000", when: (s) => !s.marks },
  { group: "Range", name: "step", label: "step", type: "select", options: ["1", "10", "50", "100"], default: "10", when: (s) => !s.marks },
  { group: "Range", name: "from", label: "First value", type: "number", min: -1000, max: 10000, default: "200", when: (s) => !s.marks },
  { group: "Range", name: "to", label: "Second value", type: "number", min: -1000, max: 10000, default: "800", when: (s) => !s.marks },

  { group: "Box", name: "output", label: "Values (<output>)", type: "checkbox", default: true },
  { group: "Box", name: "prefix", label: "Min label (prefix)", type: "text", default: "", when: (s) => !s.marks },
  { group: "Box", name: "suffix", label: "Max label (suffix)", type: "text", default: "", when: (s) => !s.marks },

  { group: "Message", name: "message", label: "Message", type: "select", options: [["", "(none)"], "danger", "warning", "success"], default: "" },
  { group: "Message", name: "messageText", label: "Message text", type: "text", default: "The range is wider than your budget.", when: (s) => s.message },

  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },

  { group: "Hints", name: "orientation", label: "data-orientation", type: "select", options: [["", "(horizontal)"], "vertical"], default: "" },
  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-range";
  const set = s.marks ? severity : null;
  const range = set ?? { min: Number(s.min), max: Number(s.max), step: s.step, from: Number(s.from), to: Number(s.to) };
  const describedBy = [];
  describedBy.push(...describedByDescription(s, id));
  if (s.message) describedBy.push(`${id}-message`);

  const fieldAttrs = [`class="canon-field"`, `role="group"`, `aria-labelledby="${id}-label"`];
  if (describedBy.length) fieldAttrs.push(`aria-describedby="${describedBy.join(" ")}"`);
  if (s.orientation) fieldAttrs.push(`data-orientation="${s.orientation}"`);
  if (s.size) fieldAttrs.push(`data-size="${s.size}"`);

  const input = (part, name, value) => {
    const attrs = [`type="range"`, `id="${id}-${part}"`, `name="${part}"`, `min="${range.min}"`, `max="${range.max}"`, `step="${range.step}"`, `value="${value}"`];
    if (set) attrs.push(`list="${id}-marks"`);
    attrs.push(`aria-label="${escape(name)}"`);
    if (s.disabled) attrs.push("disabled");
    if (s.message === "danger") attrs.push('aria-invalid="true"');
    return `    <input ${attrs.join(" ")}>`;
  };
  const shown = (value) => set ? (set.marks.find(([v]) => v === value)?.[1] ?? value) : value;

  const lines = [];
  lines.push(`<div ${fieldAttrs.join(" ")}>`);
  lines.push(...labelLines(s, { labelId: `${id}-label`, idBase: id }));
  lines.push(`  <div class="canon-control">`);
  if (s.output) lines.push(`    <output class="canon-control-value" for="${id}-min" aria-hidden="true">${escape(String(shown(range.from)))}</output>`);
  if (!set && s.prefix) lines.push(`    <span class="canon-control-prefix" aria-hidden="true">${escape(s.prefix)}</span>`);
  lines.push(input("min", s.minName, range.from));
  lines.push(input("max", s.maxName, range.to));
  if (!set && s.suffix) lines.push(`    <span class="canon-control-suffix" aria-hidden="true">${escape(s.suffix)}</span>`);
  if (s.output) lines.push(`    <output class="canon-control-value" for="${id}-max" aria-hidden="true">${escape(String(shown(range.to)))}</output>`);
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
