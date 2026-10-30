/*
 * Toolbar playground: a formatting toolbar, its controls chosen here.
 * Spec: docs/components/toolbar.md
 */

/* The stage's width; the preview's frame narrows it further. */
export const width = "48rem";

export const controls = [
  { group: "Controls", name: "history", label: "Undo · Redo", type: "checkbox", default: true },
  { group: "Controls", name: "block", label: "Text style (Select)", type: "checkbox", default: true },
  { group: "Controls", name: "align", label: "Alignment (one at a time)", type: "checkbox", default: true },
  { group: "Controls", name: "marks", label: "Bold · Italic · Underline", type: "checkbox", default: true },
  { group: "Controls", name: "link", label: "Link (a single button)", type: "checkbox", default: true },
  { group: "Controls", name: "insert", label: "Insert (a menu)", type: "checkbox", default: true },
  { group: "Toolbar", name: "orientation", label: "aria-orientation", type: "select", options: [["", "(horizontal)"], "vertical"], default: "" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "sm" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const button = (icon, label, extra = "") => [
  `  <button type="button" class="canon-button"${extra}>`,
  `    <span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span>`,
  `    <span class="canon-button-label">${label}</span>`,
  `  </button>`,
];
const group = (label, items, attrs = "", toggles = false) => [
  `<div class="canon-button-group" role="group" aria-label="${label}" data-display="icon"${attrs}>`,
  ...items.flatMap(([icon, text], index) => button(icon, text, toggles ? ` aria-pressed="${attrs && index === 0}"` : "")),
  `</div>`,
];

export function render(s) {
  const attrs = [`class="canon-toolbar"`, `role="toolbar"`, `aria-label="Formatting"`];
  if (s.orientation) attrs.push(`aria-orientation="${s.orientation}"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const body = [];
  if (s.history) body.push(...group("History", [["undo", "Undo"], ["redo", "Redo"]]));
  if (s.block) body.push(
    `<div class="canon-select">`,
    `  <span class="canon-icon" data-icon="text-cursor" aria-hidden="true"></span>`,
    `  <select aria-label="Text style">`,
    `    <option>Paragraph</option>`,
    `    <option>Heading 1</option>`,
    `    <option>Heading 2</option>`,
    `  </select>`,
    `</div>`,
  );
  if (s.align) body.push(...group("Alignment", [["align-start", "Align left"], ["align-center", "Center"], ["align-end", "Align right"]], ` data-select="one"`, true));
  if (s.marks) body.push(...group("Text style", [["bold", "Bold"], ["italic", "Italic"], ["underline", "Underline"]], "", true));
  if (s.link) body.push(...button("link", "Link", ` data-emphasis="low" data-intent="neutral" data-display="icon"`).map((line) => line.slice(2)));
  if (s.insert) body.push(
    `<button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" popovertarget="pg-insert" aria-haspopup="menu" aria-expanded="false">`,
    `  <span class="canon-icon" data-icon="plus" aria-hidden="true"></span>`,
    `  <span class="canon-button-label">Insert</span>`,
    `</button>`,
    `<div class="canon-menu" id="pg-insert" popover role="menu" aria-label="Insert">`,
    `  <button type="button" class="canon-menu-item" role="menuitem"><span class="canon-menu-label">Image…</span></button>`,
    `  <button type="button" class="canon-menu-item" role="menuitem"><span class="canon-menu-label">Table…</span></button>`,
    `</div>`,
  );
  return [`<div ${attrs.join(" ")}>`, ...body.map((line) => `  ${line}`), `</div>`].join("\n");
}
