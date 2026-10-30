/*
 * Segmented Control playground: the group's parameters, with view,
 * period or alignment options.
 * Spec: docs/components/segmented-control.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const sets = {
  view: { label: "Calendar view", name: "calendar-view", options: [["day", "Day", "calendar"], ["week", "Week", "calendar"], ["month", "Month", "calendar"]] },
  billing: { label: "Billing period", name: "billing-period", options: [["monthly", "Monthly", "calendar"], ["yearly", "Yearly", "calendar"]] },
  align: { label: "Alignment", name: "text-align", options: [["start", "Start", "align-start"], ["center", "Center", "align-center"], ["end", "End", "align-end"], ["justify", "Justify", "align-justify"]] },
};

export const controls = [
  { group: "Segmented Control", name: "set", label: "Options", type: "select", options: [["view", "Day / Week / Month"], ["billing", "Monthly / Yearly"], ["align", "alignment"]], default: "view" },
  { group: "Segmented Control", name: "label", label: "aria-label", type: "text", default: "" },
  { group: "Segmented Control", name: "icons", label: "Icons (canon-icon)", type: "checkbox", default: false, when: (s) => s.set === "align" },

  { group: "State", name: "checked", label: "checked", type: "select", options: [["0", "first option"], ["1", "second option"], ["last", "last option"]], default: "1" },
  { group: "State", name: "disabled", label: "disabled", type: "select", options: [["", "(none)"], ["last", "last option"], ["all", "every option"]], default: "" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },
  { group: "Hints", name: "display", label: "data-display", type: "select", options: [["", "(theme decides)"], ["icon", "icon (text hidden)"]], default: "", when: (s) => s.set === "align" && s.icons },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const set = sets[s.set];
  const icons = s.set === "align" && s.icons;
  const attrs = [`class="canon-segmented"`, `role="radiogroup"`, `aria-label="${escape(s.label || set.label)}"`];
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (icons && s.display) attrs.push(`data-display="${s.display}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const last = set.options.length - 1;
  const chosen = s.checked === "last" ? last : Math.min(Number(s.checked), last);
  const lines = [`<div ${attrs.join(" ")}>`];
  set.options.forEach(([value, label, icon], index) => {
    const extra = [];
    if (index === chosen) extra.push("checked");
    if (s.disabled === "all" || (s.disabled === "last" && index === last)) extra.push("disabled");
    lines.push(
      `  <label class="canon-segmented-option">`,
      `    <input type="radio" name="${set.name}" value="${value}"${extra.length ? " " + extra.join(" ") : ""}>`,
      ...(icons ? [`    <span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span>`] : []),
      `    <span class="canon-segmented-label">${label}</span>`,
      `  </label>`,
    );
  });
  lines.push(`</div>`);
  return lines.join("\n");
}
