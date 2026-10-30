/*
 * Tag playground: every parameter of the Tag contract.
 * Spec: docs/components/tag.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const icons = ["square-chevron-left", "square-chevron-right", "circle-check", "tag", "star", "pin", "info", "mail", "globe", "link", "eye", "search", "settings", "plus", "close"];

export const controls = [
  { group: "Content", name: "label", label: "Label", type: "text", default: "Label" },
  { group: "Content", name: "avatar", label: "Avatar", type: "select", options: [["", "(none)"], ["photo", "Photo"], ["initials", "Initials"]], default: "" },
  { group: "Content", name: "iconStart", label: "Leading icon", type: "select", options: [["", "(none)"], ...icons], default: "" },
  { group: "Content", name: "dot", label: "Dot", type: "checkbox" },
  { group: "Content", name: "iconEnd", label: "Trailing icon", type: "select", options: [["", "(none)"], ...icons], default: "" },
  { group: "Content", name: "kbd", label: "Key (empty: none)", type: "text", default: "" },

  { group: "Color", name: "color", label: "Color from", type: "select", options: [["", "Nothing (neutral)"], ["intent", "data-intent (meaning)"], ["seed", "data-seed (identity)"]], default: "" },
  { group: "Color", name: "intent", label: "data-intent", type: "select", options: ["info", "success", "warning", "danger"], default: "success", when: (s) => s.color === "intent" },
  { group: "Color", name: "seed", label: "data-seed", type: "text", default: "0", when: (s) => s.color === "seed" },

  { group: "Variant", name: "emphasis", label: "data-emphasis", type: "select", options: [["", "(theme decides)"], "high", "medium", "low"], default: "" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(sm; in a Combobox, the box's size)"], "sm", "md", "lg"], default: "" },
  { group: "Hints", name: "display", label: "data-display", type: "select", options: [["", "(label shown)"], "icon"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const attrs = ['class="canon-tag"'];
  if (s.emphasis) attrs.push(`data-emphasis="${s.emphasis}"`);
  if (s.color === "intent") attrs.push(`data-intent="${s.intent}"`);
  if (s.color === "seed" && s.seed.trim()) attrs.push(`data-seed="${escape(s.seed.trim())}"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.display) attrs.push(`data-display="${s.display}"`);

  const icon = (name) => `<span class="canon-icon" data-icon="${name}" aria-hidden="true"></span>`;
  const children = [];
  if (s.avatar === "photo") children.push('<span class="canon-avatar">\n    <img class="canon-avatar-image" src="assets/avatar-photo.jpg" alt="">\n    <span class="canon-avatar-fallback" aria-hidden="true">AL</span>\n  </span>');
  if (s.avatar === "initials") children.push('<span class="canon-avatar" data-seed="1">\n    <span class="canon-avatar-fallback" aria-hidden="true">AL</span>\n  </span>');
  if (s.iconStart) children.push(icon(s.iconStart));
  if (s.dot) children.push('<span class="canon-tag-dot"></span>');
  children.push(`<span class="canon-tag-label">${escape(s.label)}</span>`);
  if (s.iconEnd) children.push(icon(s.iconEnd));
  if (s.kbd.trim()) children.push(`<kbd class="canon-kbd">${escape(s.kbd.trim())}</kbd>`);

  return `<span ${attrs.join(" ")}>\n  ${children.join("\n  ")}\n</span>`;
}
