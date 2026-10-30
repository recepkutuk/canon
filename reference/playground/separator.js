/*
 * Separator playground: a line, with or without words.
 * Spec: docs/components/separator.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* The stage's width; the preview's frame narrows it further. */
export const width = "24rem";

export const controls = [
  { group: "Separator", name: "text", label: "Words (empty: a line)", type: "text", default: "or" },
  { group: "Separator", name: "vertical", label: 'aria-orientation="vertical" (no words)', type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const size = s.size ? ` data-size="${s.size}"` : "";
  const dir = s.dir === "rtl" ? ` dir="rtl"` : "";
  if (s.vertical) {
    return [
      `<div style="display: flex; align-items: center; block-size: 2rem"${dir}>`,
      `  <span>Left</span>`,
      `  <hr class="canon-separator" aria-orientation="vertical"${size}>`,
      `  <span>Right</span>`,
      `</div>`,
    ].join("\n");
  }
  const separator = s.text.trim()
    ? `<div class="canon-separator"${size}${dir}>${escape(s.text.trim())}</div>`
    : `<hr class="canon-separator"${size}>`;
  return separator;
}
