/*
 * Save Bar playground: an edit form whose bar tracks its changes.
 * Spec: docs/components/save-bar.md
 */

const field = (id, label, input) => [
  `<div class="canon-field">`,
  `  <div class="canon-label"><label class="canon-label-text" for="${id}">${label}</label></div>`,
  `  ${input}`,
  `</div>`,
];
const indent = (lines, pad) => lines.map((line) => `${pad}${line}`);

export function saveBar({ discard = true, shortcut = true, pad = "" } = {}) {
  return [
    `${pad}<footer class="canon-save-bar">`,
    `${pad}  <p class="canon-save-bar-status"></p>`,
    ...(discard ? [`${pad}  <button type="reset" class="canon-button" data-intent="neutral"><span class="canon-button-label">Discard</span></button>`] : []),
    shortcut
      ? `${pad}  <button type="submit" class="canon-button" data-emphasis="high" aria-keyshortcuts="Meta+S Control+S"><span class="canon-button-label">Save</span><kbd class="canon-kbd" aria-hidden="true">⌘S</kbd></button>`
      : `${pad}  <button type="submit" class="canon-button" data-emphasis="high"><span class="canon-button-label">Save</span></button>`,
    `${pad}</footer>`,
  ].join("\n");
}

export function invoiceFields(id, pad = "") {
  return [
    ...indent(field(`${id}-customer`, "Customer", `<div class="canon-text-input"><input id="${id}-customer" name="customer" type="text" value="Globex Corporation" placeholder></div>`), pad),
    ...indent(field(`${id}-amount`, "Amount", `<div class="canon-text-input"><input id="${id}-amount" name="amount" type="text" inputmode="decimal" value="12,400.00" placeholder></div>`), pad),
    ...indent(field(`${id}-notes`, "Notes", `<div class="canon-textarea"><textarea id="${id}-notes" name="notes" rows="3" placeholder>Net 30, reminders weekly.</textarea></div>`), pad),
    ...indent([
      `<div class="canon-choice">`,
      `  <input type="checkbox" role="switch" id="${id}-remind" name="remind" checked>`,
      `  <label class="canon-choice-label" for="${id}-remind">Send reminders when it's overdue</label>`,
      `</div>`,
    ], pad),
  ].join("\n");
}

export function editCard({ id = "sb", discard = true, shortcut = true, pad = "" } = {}) {
  return [
    `${pad}<form class="canon-card" id="${id}" action="#" method="post">`,
    `${pad}  <header class="canon-card-header">`,
    `${pad}    <h3 class="canon-card-title">Edit invoice</h3>`,
    `${pad}    <p class="canon-card-description">INV-2041</p>`,
    `${pad}  </header>`,
    `${pad}  <div class="canon-card-body">`,
    invoiceFields(id, `${pad}    `),
    `${pad}  </div>`,
    saveBar({ discard, shortcut, pad: `${pad}  ` }),
    `${pad}</form>`,
  ].join("\n");
}

/* The stage's width; the preview's frame narrows it further. */
export const width = "32rem";

export const controls = [
  { group: "Save Bar", name: "discard", label: "Discard (type=\"reset\")", type: "checkbox", default: true },
  { group: "Save Bar", name: "shortcut", label: "⌘S (aria-keyshortcuts on Save)", type: "checkbox", default: true },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  return editCard({ id: "pg-sb", discard: s.discard, shortcut: s.shortcut });
}
