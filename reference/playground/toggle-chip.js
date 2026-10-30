/*
 * Toggle Chip playground: a set of chips, checkboxes or radios.
 * Spec: docs/components/toggle-chip.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const sets = {
  jobs: { label: "Job type", name: "pg-job-type", chips: [["remote", "Remote", "globe"], ["full-time", "Full-time", "calendar"], ["part-time", "Part-time", "calendar"], ["contract", "Contract", "receipt"], ["internship", "Internship", "sparkles"]] },
  show: { label: "Show", name: "pg-show", chips: [["starred", "Starred", "star"], ["pinned", "Pinned", "pin"], ["tagged", "Tagged", "tag"]] },
  sizes: { label: "Size", name: "pg-size", chips: [["s", "S"], ["m", "M"], ["l", "L"], ["xl", "XL"]] },
};

export const controls = [
  { group: "Toggle Chips", name: "set", label: "Chips", type: "select", options: [["jobs", "job types"], ["show", "show (with icons)"], ["sizes", "sizes"]], default: "jobs" },
  { group: "Toggle Chips", name: "type", label: "Input", type: "select", options: [["checkbox", "checkbox (any number on)"], ["radio", "radio (one at a time)"]], default: "checkbox" },
  { group: "Toggle Chips", name: "label", label: "aria-label", type: "text", default: "" },
  { group: "Toggle Chips", name: "icons", label: "Icons (canon-icon)", type: "checkbox", default: false, when: (s) => s.set !== "sizes" },

  { group: "State", name: "checked", label: "checked", type: "select", options: [["", "(none)"], ["first", "first chip"], ["some", "first and third"]], default: "first" },
  { group: "State", name: "disabled", label: "disabled", type: "select", options: [["", "(none)"], ["last", "last chip"], ["all", "every chip"]], default: "" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const set = sets[s.set];
  const radio = s.type === "radio";
  const icons = s.set !== "sizes" && s.icons;
  const attrs = [`class="canon-toggle-chips"`, `role="${radio ? "radiogroup" : "group"}"`, `aria-label="${escape(s.label || set.label)}"`];
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const last = set.chips.length - 1;
  const lines = [`<div ${attrs.join(" ")}>`];
  set.chips.forEach(([value, label, icon], index) => {
    const on = s.checked === "first" ? index === 0 : s.checked === "some" ? index === 0 || (!radio && index === 2) : false;
    const extra = [];
    if (on) extra.push("checked");
    if (s.disabled === "all" || (s.disabled === "last" && index === last)) extra.push("disabled");
    lines.push(
      `  <label class="canon-toggle-chip">`,
      `    <input type="${radio ? "radio" : "checkbox"}" name="${set.name}" value="${value}"${extra.length ? " " + extra.join(" ") : ""}>`,
      ...(icons && icon ? [`    <span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span>`] : []),
      `    <span class="canon-toggle-chip-label">${label}</span>`,
      `  </label>`,
    );
  });
  lines.push(`</div>`);
  return lines.join("\n");
}
