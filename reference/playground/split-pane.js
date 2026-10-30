/*
 * Split Pane playground: two panes and the handle between them.
 * Spec: docs/components/split-pane.md
 */

const list = (id) => [
  `<nav class="canon-nav-list" aria-label="Invoices">`,
  `  <ul>`,
  ...["2041 · Globex", "2040 · Initech", "2039 · Umbrella", "2038 · Soylent", "2037 · Hooli", "2036 · Vandelay"].map((label, i) =>
    `    <li><a class="canon-nav-list-item" href="#${id}-${label.slice(0, 4)}"${i ? "" : ` aria-current="page"`}><span class="canon-nav-list-label">INV-${label}</span></a></li>`),
  `  </ul>`,
  `</nav>`,
].join("\n");

const detail = [
  `<header class="canon-section-header">`,
  `  <h2 class="canon-section-title">INV-2041</h2>`,
  `  <p class="canon-section-description">Globex Corporation · Due 3 Oct 2026 · €12,400.00</p>`,
  `</header>`,
  `<p>The detail of what's chosen on the other side.</p>`,
].join("\n");

const indent = (html, pad) => html.split("\n").map((line) => `${pad}${line}`).join("\n");

export function splitPane({ id = "sp", stacked = false, size = 35, min = 20, max = 60, label = "Resize the list", first = "", second = "", pad = "" } = {}) {
  return [
    `${pad}<div class="canon-split-pane">`,
    `${pad}  <div class="ref-pane" id="${id}-first">`,
    indent(first || list(id), `${pad}    `),
    `${pad}  </div>`,
    `${pad}  <div class="canon-split-pane-handle" role="separator" tabindex="0" aria-label="${label}" aria-controls="${id}-first" aria-orientation="${stacked ? "horizontal" : "vertical"}" aria-valuenow="${size}" aria-valuemin="${min}" aria-valuemax="${max}"></div>`,
    `${pad}  <section class="ref-pane canon-section">`,
    indent(second || detail, `${pad}    `),
    `${pad}  </section>`,
    `${pad}</div>`,
  ].join("\n");
}

export const controls = [
  { group: "Split Pane", name: "stacked", label: "Stacked (aria-orientation=\"horizontal\")", type: "checkbox", default: false },
  { group: "Split Pane", name: "size", label: "aria-valuenow (the first pane, %)", type: "number", min: 0, max: 100, default: 35 },
  { group: "Split Pane", name: "min", label: "aria-valuemin", type: "number", min: 0, max: 100, default: 20 },
  { group: "Split Pane", name: "max", label: "aria-valuemax", type: "number", min: 0, max: 100, default: 60 },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  return splitPane({ id: "pg-sp", stacked: s.stacked, size: Number(s.size), min: Number(s.min), max: Number(s.max) });
}
