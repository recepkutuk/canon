/*
 * Nav List playground: a sidebar's links with the list's parts.
 * Spec: docs/components/nav-list.md
 */

export const controls = [
  { group: "Nav List", name: "icons", label: "Icons", type: "checkbox", default: true },
  { group: "Nav List", name: "counts", label: "Counts", type: "checkbox", default: true },
  { group: "Nav List", name: "tag", label: "A tag (New)", type: "checkbox", default: true },
  { group: "Nav List", name: "heading", label: "A group with a heading", type: "checkbox", default: true },
  { group: "Nav List", name: "section", label: "A section (details)", type: "checkbox", default: true },
  { group: "Nav List", name: "action", label: "A row action", type: "checkbox", default: false },
  { group: "Nav List", name: "current", label: "aria-current=\"page\" on", type: "select", options: [["", "(nothing)"], ["inbox", "Inbox"], ["mobile", "Mobile app (in the section)"]], default: "inbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },
  { group: "Hints", name: "display", label: "data-display", type: "select", options: [["", "(labels)"], ["icon", "icon (a rail)"]], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const attrs = [`class="canon-nav-list"`, `aria-label="Workspace"`];
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.display) attrs.push(`data-display="${s.display}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const item = (key, icon, label, count, pad = "    ") => {
    const parts = [];
    if (icon && (s.icons || s.display === "icon")) parts.push(`<span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span>`);
    parts.push(`<span class="canon-nav-list-label">${label}</span>`);
    if (count && s.counts) parts.push(`<span class="canon-count">${count}</span>`);
    return `${pad}<li><a class="canon-nav-list-item" href="#${key}"${s.current === key ? ` aria-current="page"` : ""}>${parts.join("")}</a></li>`;
  };
  const lines = [`<nav ${attrs.join(" ")}>`, `  <ul>`,
    item("inbox", "mail", "Inbox", "12"),
    item("issues", "circle-check", "My issues"),
  ];
  if (s.tag) lines.push(`    <li><a class="canon-nav-list-item" href="#reports">${s.icons || s.display === "icon" ? `<span class="canon-icon" data-icon="receipt" aria-hidden="true"></span>` : ""}<span class="canon-nav-list-label">Reports</span><span class="canon-tag" data-intent="info"><span class="canon-tag-label">New</span></span></a></li>`);
  if (s.section) lines.push(
    `    <li>`,
    `      <details class="canon-nav-list-section">`,
    `        <summary class="canon-nav-list-item">${s.icons || s.display === "icon" ? `<span class="canon-icon" data-icon="table" aria-hidden="true"></span>` : ""}<span class="canon-nav-list-label">Projects</span></summary>`,
    `        <ul>`,
    item("website", "", "Website", "", "          "),
    item("mobile", "", "Mobile app", "5", "          "),
    `        </ul>`,
    `      </details>`,
    `    </li>`,
  );
  lines.push(`  </ul>`);
  if (s.heading) {
    lines.push(`  <p class="canon-nav-list-heading">Teams</p>`, `  <ul>`);
    if (s.action) lines.push(
      `    <li>`,
      `      <a class="canon-nav-list-item" href="#design">${s.icons || s.display === "icon" ? `<span class="canon-icon" data-icon="sparkles" aria-hidden="true"></span>` : ""}<span class="canon-nav-list-label">Design</span></a>`,
      `      <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" data-size="sm"><span class="canon-icon" data-icon="plus" aria-hidden="true"></span><span class="canon-button-label">New project in Design</span></button>`,
      `    </li>`,
    );
    else lines.push(item("design", "sparkles", "Design", "3"));
    lines.push(item("engineering", "settings", "Engineering"), `  </ul>`);
  }
  lines.push(`</nav>`);
  return lines.join("\n");
}
