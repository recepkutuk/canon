/*
 * Drawer playground: a Dialog from an edge, and the button that opens it.
 * Spec: docs/components/drawer.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Drawer", name: "side", label: "data-side", type: "select", options: [["end", "end"], ["start", "start"]], default: "end" },
  { group: "Drawer", name: "width", label: "data-width", type: "select", options: ["sm", ["", "(the theme's: 480px, for filters or a form)"], "lg"], default: "" },
  { group: "Drawer", name: "title", label: "Title", type: "text", default: "Filters" },
  { group: "Drawer", name: "sections", label: "Body: sections (canon-dialog-section)", type: "checkbox", default: true },
  { group: "Drawer", name: "footer", label: "Footer", type: "checkbox", default: true },
  { group: "Drawer", name: "closedby", label: "closedby", type: "select", options: [["", "(closerequest: Escape)"], ["any", "any (also a click beside it)"], ["none", "none (only its buttons)"]], default: "any" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const choices = (legend, name, options) => [
  `        <fieldset class="canon-fieldset">`,
  `          <legend class="canon-fieldset-legend">${legend}</legend>`,
  ...options.map(([value, label], i) => `          <div class="canon-choice"><input type="checkbox" id="pg-${name}-${value}" name="${name}" value="${value}"${i === 0 ? " checked" : ""}><label class="canon-choice-label" for="pg-${name}-${value}">${label}</label></div>`),
  `        </fieldset>`,
];

export function render(s) {
  const id = "pg-drawer";
  const attrs = [`class="canon-dialog"`, `id="${id}"`, `data-side="${s.side}"`];
  if (s.width) attrs.push(`data-width="${s.width}"`);
  if (s.closedby) attrs.push(`closedby="${s.closedby}"`);
  attrs.push(`aria-labelledby="${id}-title"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const team = choices("Team", "team", [["design", "Design"], ["engineering", "Engineering"], ["research", "Research"]]);
  const type = choices("Type", "type", [["full-time", "Full-time"], ["contract", "Contract"]]);
  const lines = [
    `<button type="button" class="canon-button" commandfor="${id}" command="show-modal">`,
    `  <span class="canon-button-label">Open the drawer</span>`,
    `</button>`,
    ``,
    `<dialog ${attrs.join(" ")}>`,
    `  <form method="dialog">`,
    `    <header class="canon-dialog-header">`,
    `      <h2 class="canon-dialog-title" id="${id}-title">${escape(s.title || "Filters")}</h2>`,
    `      <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" commandfor="${id}" command="close">`,
    `        <span class="canon-icon" data-icon="close" aria-hidden="true"></span>`,
    `        <span class="canon-button-label">Close</span>`,
    `      </button>`,
    `    </header>`,
    `    <div class="canon-dialog-body">`,
  ];
  if (s.sections) lines.push(
    `      <div class="canon-dialog-section">`, ...team.map((l) => `  ${l}`), `      </div>`,
    `      <div class="canon-dialog-section">`, ...type.map((l) => `  ${l}`), `      </div>`,
  );
  else lines.push(...team.map((l) => l.slice(2)));
  lines.push(`    </div>`);
  if (s.footer) lines.push(
    `    <footer class="canon-dialog-footer">`,
    `      <button type="reset" class="canon-button" data-emphasis="low" data-intent="neutral">`,
    `        <span class="canon-button-label">Reset</span>`,
    `      </button>`,
    `      <button type="submit" class="canon-button" data-emphasis="high" data-align="end" value="apply">`,
    `        <span class="canon-button-label">Apply</span>`,
    `      </button>`,
    `    </footer>`,
  );
  lines.push(`  </form>`, `</dialog>`);
  return lines.join("\n");
}
