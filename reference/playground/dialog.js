/*
 * Dialog playground: the button that opens it, and the dialog's parts.
 * Spec: docs/components/dialog.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Dialog", name: "role", label: "role", type: "select", options: [["", "(dialog)"], ["alertdialog", "alertdialog (a decision)"]], default: "" },
  { group: "Dialog", name: "title", label: "Title", type: "text", default: "Edit event" },
  { group: "Dialog", name: "message", label: "Message (in the body)", type: "text", default: "" },
  { group: "Dialog", name: "close", label: "Close button", type: "checkbox", default: true, when: (s) => s.role !== "alertdialog" },
  { group: "Dialog", name: "sections", label: "Body: sections (canon-dialog-section)", type: "checkbox", default: true, when: (s) => s.role !== "alertdialog" && !s.message },
  { group: "Dialog", name: "footer", label: "Footer", type: "select", options: [["", "(none)"], ["two", "Cancel · Save (data-align=\"end\")"], ["one", "Done"]], default: "two" },
  { group: "Dialog", name: "closedby", label: "closedby", type: "select", options: [["", "(closerequest: Escape)"], ["any", "any (also a click beside it)"], ["none", "none (only its buttons)"]], default: "" },
  { group: "Dialog", name: "width", label: "data-width", type: "select", options: ["sm", ["", "(the theme's: 640px, for a form)"], "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const field = (id, label, value) => [
  `        <div class="canon-field">`,
  `          <div class="canon-label"><label class="canon-label-text" for="${id}">${label}</label></div>`,
  `          <div class="canon-text-input"><input type="text" id="${id}" name="${id}" value="${value}" placeholder></div>`,
  `        </div>`,
];

export function render(s) {
  const alert = s.role === "alertdialog";
  const id = "pg-dialog";
  const attrs = [`class="canon-dialog"`, `id="${id}"`];
  if (alert) attrs.push(`role="alertdialog"`);
  if (s.width) attrs.push(`data-width="${s.width}"`);
  if (s.closedby && !(alert && s.closedby === "any")) attrs.push(`closedby="${s.closedby}"`);
  attrs.push(`aria-labelledby="${id}-title"`);
  const message = s.message || (alert ? "The event is removed for its 3 participants. This can't be undone." : "");
  if (alert) attrs.push(`aria-describedby="${id}-message"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const title = escape(s.title || "Edit event");
  const lines = [
    `<button type="button" class="canon-button" commandfor="${id}" command="show-modal">`,
    `  <span class="canon-button-label">Open the dialog</span>`,
    `</button>`,
    ``,
    `<dialog ${attrs.join(" ")}>`,
    `  <form method="dialog">`,
    `    <header class="canon-dialog-header">`,
    `      <h2 class="canon-dialog-title" id="${id}-title">${title}</h2>`,
  ];
  if (s.close && !alert) lines.push(
    `      <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" commandfor="${id}" command="close">`,
    `        <span class="canon-icon" data-icon="close" aria-hidden="true"></span>`,
    `        <span class="canon-button-label">Close</span>`,
    `      </button>`,
  );
  lines.push(`    </header>`);
  lines.push(`    <div class="canon-dialog-body">`);
  if (message) lines.push(`      <p${alert ? ` id="${id}-message"` : ""}>${escape(message)}</p>`);
  if (!alert) {
    if (s.sections && !message) {
      lines.push(`      <div class="canon-dialog-section">`, ...field("pg-title", "Title", "Hackweek").map((l) => `  ${l}`), `      </div>`);
      lines.push(`      <div class="canon-dialog-section">`, ...field("pg-place", "Place", "Room 4").map((l) => `  ${l}`), `      </div>`);
    } else {
      lines.push(...field("pg-title", "Title", "Hackweek").map((l) => l.slice(2)));
    }
  }
  lines.push(`    </div>`);
  if (s.footer) {
    lines.push(`    <footer class="canon-dialog-footer">`);
    if (s.footer === "two") lines.push(
      `      <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" commandfor="${id}" command="close">`,
      `        <span class="canon-button-label">Cancel</span>`,
      `      </button>`,
      `      <button type="submit" class="canon-button" data-emphasis="high"${alert ? ` data-intent="danger"` : ""} data-align="end" value="save">`,
      `        <span class="canon-button-label">${alert ? "Delete" : "Save"}</span>`,
      `      </button>`,
    );
    else lines.push(
      `      <button type="submit" class="canon-button" data-emphasis="high" data-align="end" value="done">`,
      `        <span class="canon-button-label">Done</span>`,
      `      </button>`,
    );
    lines.push(`    </footer>`);
  }
  lines.push(`  </form>`, `</dialog>`);
  return lines.join("\n");
}
