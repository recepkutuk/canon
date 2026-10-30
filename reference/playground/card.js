/*
 * Card playground: a framed box with a header, a body and a footer.
 * Spec: docs/components/card.md
 */

const icon = (name) => `<span class="canon-icon" data-icon="${name}" aria-hidden="true"></span>`;
const button = (label, { emphasis = "medium", neutral = true, iconName = "", iconOnly = false, size = "", align = "", type = "button" } = {}) =>
  `<button type="${type}" class="canon-button" data-emphasis="${emphasis}"${neutral ? ` data-intent="neutral"` : ""}${iconOnly ? ` data-display="icon"` : ""}${size ? ` data-size="${size}"` : ""}${align ? ` data-align="${align}"` : ""}>${iconName ? icon(iconName) : ""}<span class="canon-button-label">${label}</span></button>`;

export const details = (pad = "") => [
  `${pad}<dl class="canon-description-list" data-label="start">`,
  `${pad}  <div><dt>Company</dt><dd>Globex Corporation</dd></div>`,
  `${pad}  <div><dt>Billing email</dt><dd>billing@globex.example</dd></div>`,
  `${pad}  <div><dt>Payment terms</dt><dd>Net 30</dd></div>`,
  `${pad}</dl>`,
].join("\n");

export const payments = (id, pad = "") => [
  `${pad}<div class="canon-table">`,
  `${pad}  <table aria-labelledby="${id}-title">`,
  `${pad}    <thead><tr><th scope="col">Date</th><th scope="col">Method</th><th scope="col" data-align="end">Amount</th></tr></thead>`,
  `${pad}    <tbody>`,
  `${pad}      <tr><td><time datetime="2026-09-03">3 Sep 2026</time></td><td>Bank transfer</td><td data-align="end">€4,000.00</td></tr>`,
  `${pad}      <tr><td><time datetime="2026-08-02">2 Aug 2026</time></td><td>Card ending 4242</td><td data-align="end">€2,400.00</td></tr>`,
  `${pad}    </tbody>`,
  `${pad}  </table>`,
  `${pad}</div>`,
].join("\n");

/* A card: what's in it picked by the options. */
export function card({ id = "cd", header = true, description = true, action = true, content = "details", footer = false, size = "", tag = "section", link = false, pad = "" } = {}) {
  const attrs = [`class="canon-card"`];
  if (size) attrs.push(`data-size="${size}"`);
  const lines = [`${pad}<${tag} ${attrs.join(" ")}>`];
  if (header) {
    const title = link
      ? `<h3 class="canon-card-title" id="${id}-title"><a class="canon-card-link" href="#${id}-globex">Globex Corporation</a></h3>`
      : `<h3 class="canon-card-title" id="${id}-title">${content === "table" ? "Recent payments" : "Billing details"}</h3>`;
    lines.push(`${pad}  <header class="canon-card-header">`, `${pad}    ${title}`);
    if (description) lines.push(`${pad}    <p class="canon-card-description">${link ? "12 open invoices · €48,200 due" : content === "table" ? "The last two payments on this invoice" : "Where invoices go, and when they're due"}</p>`);
    if (action) lines.push(`${pad}    <div class="canon-card-actions">${link ? button("More actions", { emphasis: "minimal", iconName: "more", iconOnly: true }) : content === "table" ? button("View all") : button("Edit", { iconName: "pencil" })}</div>`);
    lines.push(`${pad}  </header>`);
  }
  if (content === "details") lines.push(`${pad}  <div class="canon-card-body">`, details(`${pad}    `), `${pad}  </div>`);
  if (content === "text") lines.push(`${pad}  <div class="canon-card-body">`, `${pad}    <p>Invoices are sent on the first working day of each month, and payment is due 30 days later.</p>`, `${pad}  </div>`);
  if (content === "table") lines.push(payments(id, `${pad}  `));
  if (footer) lines.push(
    `${pad}  <footer class="canon-card-footer">`,
    `${pad}    ${button("Cancel")}`,
    `${pad}    ${button("Save", { emphasis: "high", neutral: false, align: "end" })}`,
    `${pad}  </footer>`,
  );
  lines.push(`${pad}</${tag}>`);
  return lines.join("\n");
}

/* The stage's width; the preview's frame narrows it further. */
export const width = "28rem";

export const controls = [
  { group: "Card", name: "header", label: "A header", type: "checkbox", default: true },
  { group: "Card", name: "description", label: "A description", type: "checkbox", default: true, when: (s) => s.header },
  { group: "Card", name: "action", label: "An action in the header", type: "checkbox", default: true, when: (s) => s.header },
  { group: "Card", name: "content", label: "Content", type: "select", options: [["details", "A body: a Description List"], ["text", "A body: text"], ["table", "A Table, edge to edge"]], default: "details" },
  { group: "Card", name: "footer", label: "A footer (Cancel, Save)", type: "checkbox", default: false },
  { group: "Card", name: "link", label: "The whole card a link (.canon-card-link)", type: "checkbox", default: false, when: (s) => s.header },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  return card({ id: "pg-card", header: s.header, description: s.description, action: s.action, content: s.content, footer: s.footer, size: s.size, link: s.link, tag: s.link ? "article" : "section" });
}
