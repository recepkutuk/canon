/*
 * Button Group playground: the group's parameters, with text-style or
 * alignment buttons.
 * Spec: docs/components/button-group.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const sets = {
  marks: { label: "Text style", buttons: [["bold", "Bold"], ["italic", "Italic"], ["underline", "Underline"], ["strikethrough", "Strikethrough"]] },
  align: { label: "Alignment", buttons: [["align-start", "Align left"], ["align-center", "Center"], ["align-end", "Align right"], ["align-justify", "Justify"]] },
  actions: { label: "Message", buttons: [["copy", "Copy"], ["pin", "Pin"], ["trash", "Delete"]] },
};

export const controls = [
  { group: "Button Group", name: "set", label: "Buttons", type: "select", options: [["marks", "text styles"], ["align", "alignment"], ["actions", "actions"]], default: "marks" },
  { group: "Button Group", name: "label", label: "aria-label", type: "text", default: "" },

  { group: "Button Group", name: "select", label: "data-select", type: "select", options: [["", "(any number on)"], ["one", "one (one at a time)"]], default: "", when: (s) => s.set !== "actions" },

  { group: "State", name: "pressed", label: "Toggles (aria-pressed)", type: "select", options: [["", "not toggles"], ["first", "first on"], ["some", "first and third on"]], default: "first", when: (s) => s.set !== "actions" },
  { group: "State", name: "disabled", label: "disabled", type: "select", options: [["", "(none)"], ["one", "second button"], ["all", "every button"]], default: "" },
  { group: "State", name: "danger", label: 'data-intent="danger" on Delete', type: "checkbox", default: true, when: (s) => s.set === "actions" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "sm" },
  { group: "Hints", name: "display", label: "data-display", type: "select", options: [["", "(theme decides)"], ["icon", "icon (labels hidden)"]], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const set = sets[s.set];
  const attrs = [`class="canon-button-group"`, `role="group"`, `aria-label="${escape(s.label || set.label)}"`];
  const one = s.set !== "actions" && s.select === "one";
  if (one) attrs.push(`data-select="one"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.display) attrs.push(`data-display="${s.display}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const lines = [`<div ${attrs.join(" ")}>`];
  set.buttons.forEach(([icon, label], index) => {
    const extra = [];
    if (s.set !== "actions" && s.pressed) {
      const on = s.pressed === "first" || one ? index === 0 : index === 0 || index === 2;
      extra.push(`aria-pressed="${on}"`);
    }
    if (s.set === "actions" && s.danger && icon === "trash") extra.push(`data-intent="danger"`);
    if (s.disabled === "all" || (s.disabled === "one" && index === 1)) extra.push("disabled");
    lines.push(
      `  <button type="button" class="canon-button"${extra.length ? " " + extra.join(" ") : ""}>`,
      `    <span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span>`,
      `    <span class="canon-button-label">${label}</span>`,
      `  </button>`,
    );
  });
  lines.push(`</div>`);
  return lines.join("\n");
}
