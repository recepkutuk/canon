/*
 * Stat playground: a label, a value, how it moved, more context and the
 * app's sparkline.
 * Spec: docs/components/stat.md
 */

/* A sparkline as an app would draw it: a line, and optionally the area
   under it, in currentColor. */
const SPARK = "0,26 10,24 20,25 30,21 40,22 50,18 60,19 70,14 80,15 90,10 100,11 110,6 120,4";
const sparkline = (area) => `<svg viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true">${
  area ? `<path d="M${SPARK.replaceAll(" ", " L").replaceAll(",", " ")} L120 32 L0 32 Z" fill="currentColor" fill-opacity="0.12" stroke="none"/>` : ""
}<polyline points="${SPARK}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

export const controls = [
  { group: "Content", name: "label", label: "Label", type: "text", default: "Revenue this month" },
  { group: "Content", name: "value", label: "Value (empty: a dash, heard as \"Not set\")", type: "text", default: "$48,210" },
  { group: "Content", name: "description", label: "Description (empty: none)", type: "text", default: "Goal: $50,000" },
  { group: "Content", name: "link", label: "Linked (the whole stat goes to its list)", type: "checkbox", default: false },

  { group: "Change", name: "change", label: "Change (your app's words; empty: none)", type: "text", default: "Up 12% from last month" },
  { group: "Change", name: "direction", label: "data-direction", type: "select", options: [["", "(none: no arrow)"], "up", "down", "flat"], default: "up", when: (s) => s.change.trim() },
  { group: "Change", name: "intent", label: "data-intent", type: "select", options: [["", "(none: neutral)"], ["success", "success (good)"], ["danger", "danger (bad)"], "warning", "info"], default: "success", when: (s) => s.change.trim() },

  { group: "Chart", name: "chart", label: "Sparkline", type: "select", options: [["", "None"], ["line", "Line"], ["area", "Line and area"]], default: "" },

  { group: "State", name: "loading", label: "Loading (aria-busy)", type: "checkbox", default: false },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const attrs = [`class="canon-stat"`];
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.loading) attrs.push(`aria-busy="true"`);
  const label = s.label.trim() || "Revenue this month";
  const lines = [`<div ${attrs.join(" ")}>`];
  lines.push(s.link
    ? `  <p class="canon-stat-label"><a class="canon-stat-link" href="#">${label}</a></p>`
    : `  <p class="canon-stat-label">${label}</p>`);
  lines.push(s.loading
    ? `  <p class="canon-stat-value"><span class="canon-skeleton" data-shape="block" aria-hidden="true"></span></p>`
    : `  <p class="canon-stat-value">${s.value.trim()}</p>`);
  if (!s.loading && s.change.trim()) {
    const change = [`class="canon-stat-change"`];
    if (s.direction) change.push(`data-direction="${s.direction}"`);
    if (s.intent) change.push(`data-intent="${s.intent}"`);
    lines.push(`  <p ${change.join(" ")}>${s.change.trim()}</p>`);
  }
  if (s.description.trim()) lines.push(`  <p class="canon-stat-description">${s.description.trim()}</p>`);
  if (s.chart && !s.loading) lines.push(`  <div class="canon-stat-chart">${sparkline(s.chart === "area")}</div>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
