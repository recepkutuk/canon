/*
 * Label playground: every parameter of the Label contract, on its own.
 * The label points at a hidden stand-in for the control it names; the
 * required marker comes from that control's native required.
 * Spec: docs/components/label.md
 */

import { labelControls, labelLines, describedByDescription } from "./_label.js";

export const controls = [
  ...labelControls({ label: "Phone number", description: "Include the country code." }),

  { group: "Control", name: "required", label: "required (native, on the control)", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-label";
  const describedBy = describedByDescription(s, id);
  const attrs = [`id="${id}"`, "hidden"];
  if (s.required) attrs.push("required");
  if (describedBy.length) attrs.push(`aria-describedby="${describedBy.join(" ")}"`);

  const lines = [`<div${s.size ? ` data-size="${s.size}"` : ""}>`];
  lines.push(...labelLines(s, { forId: id, idBase: id }));
  lines.push(`  <!-- Stands in for the control it labels. -->`);
  lines.push(`  <input ${attrs.join(" ")}>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
