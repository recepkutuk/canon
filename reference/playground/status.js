/*
 * Status Indicator playground: a status in text, a dot and its label.
 * Spec: docs/components/status.md
 */

export const STATUSES = [
  ["", "Draft"],
  ["info", "Sent"],
  ["success", "Paid"],
  ["warning", "Due soon"],
  ["danger", "Overdue"],
];

export const status = ([intent, label], { pulse = false, size = "", display = "" } = {}) => {
  const attrs = [`class="canon-status"`];
  if (intent) attrs.push(`data-intent="${intent}"`);
  if (pulse) attrs.push("data-pulse");
  if (size) attrs.push(`data-size="${size}"`);
  if (display) attrs.push(`data-display="${display}"`);
  return `<span ${attrs.join(" ")}><span class="canon-status-label">${label}</span></span>`;
};

export const controls = [
  { group: "Status", name: "intent", label: "data-intent", type: "select", options: [["", "(none: neutral)"], "info", "success", "warning", "danger"], default: "success" },
  { group: "Status", name: "label", label: "Label", type: "text", default: "Paid" },
  { group: "Status", name: "pulse", label: "data-pulse (in progress)", type: "checkbox", default: false },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },
  { group: "Hints", name: "display", label: "data-display", type: "select", options: [["", "(theme decides)"], ["icon", "icon (the dot only)"]], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  return status([s.intent, s.label.trim() || "Paid"], { pulse: s.pulse, size: s.size, display: s.display });
}
