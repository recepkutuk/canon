/*
 * App Shell playground: a Sidebar, a Top Bar and the page.
 * Spec: docs/components/app-shell.md
 */

import { sidebar, topBar, palette, CURRENT } from "./_shell.js";

export const controls = [
  { group: "App Shell", name: "rail", label: "Sidebar a rail", type: "checkbox", default: false },
  { group: "App Shell", name: "footer", label: "A sidebar footer", type: "checkbox", default: false },
  { group: "App Shell", name: "tag", label: "A tag on Quotes (New)", type: "checkbox", default: false },
  { group: "App Shell", name: "bar", label: "A top bar", type: "checkbox", default: true },
  { group: "App Shell", name: CURRENT[0], label: CURRENT[1], type: "select", options: CURRENT[2], default: CURRENT[3] },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  return [
    `<div class="canon-app-shell"${s.size ? ` data-size="${s.size}"` : ""}>`,
    sidebar({ rail: s.rail, current: s.current, footer: s.footer, tag: s.tag, headerToggle: !s.bar, pad: "  " }),
    ...(s.bar ? [topBar({ sidebarToggle: !s.rail, help: true, pad: "  " })] : []),
    `  <main class="ref-shell-content">`,
    `    <h1>Dashboard</h1>`,
    `    <div class="ref-shell-box"></div>`,
    `    <div class="ref-shell-box"></div>`,
    `    <div class="ref-shell-box ref-shell-box-wide"></div>`,
    `  </main>`,
    ...(s.bar ? [palette("  ")] : []),
    `</div>`,
  ].join("\n");
}
