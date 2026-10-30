/*
 * Sidebar playground: the column beside an app's pages, open or a rail.
 * Spec: docs/components/sidebar.md
 */

import { sidebar, CURRENT } from "./_shell.js";

export const controls = [
  { group: "Sidebar", name: "rail", label: "data-display=\"icon\" (a rail)", type: "checkbox", default: false },
  { group: "Sidebar", name: "sections", label: "Sections (details)", type: "checkbox", default: true },
  { group: "Sidebar", name: "footer", label: "A footer", type: "checkbox", default: false },
  { group: "Sidebar", name: "tag", label: "A tag on Quotes (New)", type: "checkbox", default: false },
  { group: "Sidebar", name: CURRENT[0], label: CURRENT[1], type: "select", options: CURRENT[2], default: CURRENT[3] },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  return sidebar({ rail: s.rail, current: s.current, sections: s.sections, footer: s.footer, tag: s.tag, size: s.size });
}
