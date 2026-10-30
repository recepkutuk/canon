/*
 * Popover playground: a button and the panel it opens.
 * Spec: docs/components/popover.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Popover", name: "title", label: "Title (empty: aria-label)", type: "text", default: "Edit link" },
  { group: "Popover", name: "content", label: "Content", type: "select", options: [["form", "a form with actions"], ["words", "a few words and a link"]], default: "form" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-popover";
  const size = s.size ? ` data-size="${s.size}"` : "";
  const name = s.title ? `aria-labelledby="${id}-title"` : `aria-label="Edit link"`;
  const lines = [];
  if (s.dir === "rtl") lines.push(`<div dir="rtl">`);
  lines.push(
    `<button type="button" class="canon-button" data-emphasis="low" data-intent="neutral"${size} popovertarget="${id}" aria-expanded="false">`,
    `  <span class="canon-button-label">Open</span>`,
    `</button>`,
    `<div class="canon-popover" id="${id}" popover role="dialog" ${name}${size}>`,
  );
  if (s.title) lines.push(`  <h3 class="canon-popover-title" id="${id}-title">${escape(s.title)}</h3>`);
  if (s.content === "form") {
    lines.push(
      `  <form class="canon-form">`,
      `    <div class="canon-field">`,
      `      <div class="canon-label"><label class="canon-label-text" for="${id}-url">Link</label></div>`,
      `      <div class="canon-text-input"><input type="url" id="${id}-url" name="url" placeholder="https://"></div>`,
      `    </div>`,
      `    <div class="canon-form-actions">`,
      `      <button type="submit" class="canon-button" data-emphasis="high"><span class="canon-button-label">Apply</span></button>`,
      `      <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" popovertarget="${id}" popovertargetaction="hide"><span class="canon-button-label">Cancel</span></button>`,
      `    </div>`,
      `  </form>`,
    );
  } else {
    lines.push(`  <p>You pay for the seats in use on the first of each month.</p>`, `  <a href="#">Read the billing guide</a>`);
  }
  lines.push(`</div>`);
  if (s.dir === "rtl") lines.push(`</div>`);
  return lines.join("\n");
}
