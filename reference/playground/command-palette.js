/*
 * Command Palette playground: the trigger and the palette's parts.
 * Spec: docs/components/command-palette.md
 */

const pages = [["receipt", "Invoices", "Billing"], ["calendar", "Calendar", ""], ["settings", "Settings", ""]];
const actions = [["plus", "Create invoice", "N"], ["download", "Download this month's report", ""], ["sparkles", "Switch to the dark theme", ""]];

export const controls = [
  { group: "Command Palette", name: "groups", label: "Groups with headings", type: "checkbox", default: true },
  { group: "Command Palette", name: "hints", label: "Hints (canon-command-hint)", type: "checkbox", default: true },
  { group: "Command Palette", name: "keys", label: "Shortcuts (Kbd)", type: "checkbox", default: true },
  { group: "Command Palette", name: "footer", label: "Footer of hints", type: "checkbox", default: true },
  { group: "Command Palette", name: "shortcut", label: "aria-keyshortcuts on the trigger", type: "checkbox", default: true },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-palette";
  const item = (tag, [icon, label, extra], kind) => {
    const open = tag === "a" ? `<a class="canon-command-item" href="#${label.toLowerCase().replace(/\W+/g, "-")}">` : `<button type="button" class="canon-command-item">`;
    const parts = [`<span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span>`, `<span class="canon-command-label">${label}</span>`];
    if (kind === "hint" && extra && s.hints) parts.push(`<span class="canon-command-hint">${extra}</span>`);
    if (kind === "key" && extra && s.keys) parts.push(`<kbd class="canon-kbd" aria-hidden="true">${extra}</kbd>`);
    return `      ${open}${parts.join("")}</${tag === "a" ? "a" : "button"}>`;
  };
  const trigger = [`<button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" commandfor="${id}" command="show-modal"${s.shortcut ? ` aria-keyshortcuts="Meta+K Control+K"` : ""}>`,
    `  <span class="canon-icon" data-icon="search" aria-hidden="true"></span>`,
    `  <span class="canon-button-label">Search</span>`,
    ...(s.shortcut ? [`  <kbd class="canon-kbd" aria-hidden="true">⌘K</kbd>`] : []),
    `</button>`];
  const lines = [...trigger, ``,
    `<dialog class="canon-command-palette" id="${id}" aria-label="Command palette"${s.dir === "rtl" ? ` dir="rtl"` : ""}>`,
    `  <div class="canon-command-search">`,
    `    <span class="canon-icon" data-icon="search" aria-hidden="true"></span>`,
    `    <input type="search" aria-label="Search commands and pages" placeholder="Search commands and pages">`,
    `  </div>`,
    `  <div class="canon-command-list">`];
  if (s.groups) {
    lines.push(`    <div class="canon-command-group" aria-labelledby="${id}-pages">`, `      <p class="canon-command-heading" id="${id}-pages">Pages</p>`,
      ...pages.map((p) => item("a", p, "hint")), `    </div>`,
      `    <div class="canon-command-group" aria-labelledby="${id}-actions">`, `      <p class="canon-command-heading" id="${id}-actions">Actions</p>`,
      ...actions.map((a) => item("button", a, "key")), `    </div>`);
  } else {
    lines.push(...pages.map((p) => item("a", p, "hint").slice(2)), ...actions.map((a) => item("button", a, "key").slice(2)));
  }
  lines.push(`  </div>`);
  if (s.footer) lines.push(
    `  <footer class="canon-command-footer">`,
    `    <span><kbd class="canon-kbd">↑</kbd> <kbd class="canon-kbd">↓</kbd> to move</span>`,
    `    <span><kbd class="canon-kbd">Enter</kbd> to run</span>`,
    `    <span><kbd class="canon-kbd">Esc</kbd> to close</span>`,
    `  </footer>`);
  lines.push(`</dialog>`);
  return lines.join("\n");
}
