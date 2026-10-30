/*
 * Link playground: a link (or a button that looks like one) in a
 * sentence or on its own.
 * Spec: docs/components/link.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Link", name: "element", label: "Element", type: "select", options: [["a", "<a href> (goes somewhere)"], ["button", "<button> (does something)"]], default: "a" },
  { group: "Link", name: "text", label: "Text", type: "text", default: "how payouts work" },
  { group: "Link", name: "icon", label: "Icon (canon-icon)", type: "select", options: [["", "(none)"], ["leading", "before the text"], ["trailing", "after the text"]], default: "" },
  { group: "Link", name: "blank", label: 'target="_blank"', type: "checkbox", default: false, when: (s) => s.element === "a" },

  { group: "Look", name: "standalone", label: "data-standalone", type: "checkbox", default: false },
  { group: "Look", name: "emphasis", label: "data-emphasis", type: "select", options: [["", "(default)"], ["low", "low (the text's color)"]], default: "" },

  { group: "State", name: "disabled", label: "Disabled", type: "checkbox", default: false },

  { group: "Preview", name: "context", label: "Context", type: "select", options: [["sentence", "In a sentence"], ["alone", "On its own"]], default: "sentence" },
  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const button = s.element === "button";
  const attrs = button ? [`type="button"`, `class="canon-link"`] : [`class="canon-link"`];
  if (!button && !s.disabled) attrs.push(`href="#"`);
  if (!button && s.blank) attrs.push(`target="_blank"`);
  if (s.standalone) attrs.push("data-standalone");
  if (s.emphasis) attrs.push(`data-emphasis="${s.emphasis}"`);
  if (s.disabled) attrs.push(button ? "disabled" : `aria-disabled="true"`);
  const tag = button ? "button" : "a";
  const icon = s.icon ? `<span class="canon-icon" data-icon="${s.icon === "leading" ? "download" : "arrow-forward"}" aria-hidden="true"></span>` : "";
  const text = escape(s.text || "how payouts work");
  const inner = s.icon === "leading" ? `${icon}${text}` : s.icon === "trailing" ? `${text}${icon}` : text;
  const link = `<${tag} ${attrs.join(" ")}>${inner}</${tag}>`;
  const dir = s.dir === "rtl" ? ` dir="rtl"` : "";
  return s.context === "alone" ? `<p${dir}>${link}</p>` : `<p${dir}>Payments arrive within two working days. See ${link} for details.</p>`;
}
