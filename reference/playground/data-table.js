/*
 * Data Table playground: sorting, selecting, row actions, pinning,
 * local paging and the loading / empty / no results / error states.
 * Spec: docs/components/data-table.md
 */

const people = [
  ["Edwin Mueller", "tyrese_nicolas@gmail.com", "2024-08-16", "16.08.2024", 495.9, ["Waiting", "warning"]],
  ["Suzanne Jacobi", "cindy_murphy41@yahoo.com", "2025-12-03", "03.12.2025", 662.02, ["Ready", "info"]],
  ["Kellie Schoen", "troy.lubowitz@gmail.com", "2023-07-21", "21.07.2023", 235.71, ["Cancelled", "danger"]],
  ["Shari Feeney PhD", "cecelia_erdman@yahoo.com", "2026-01-15", "15.01.2026", 436.68, ["Waiting", "warning"]],
  ["Mrs. Jo Emard", "jovany66@hotmail.com", "2024-05-09", "09.05.2024", 984.24, ["Delivered", "success"]],
  ["Lauren Monahan", "jermaine.corkery@gmail.com", "2022-11-27", "27.11.2022", 916.69, ["In delivery", "info"]],
  ["Antoinette Wilkinson", "marcos.zulauf@gmail.com", "2023-08-04", "04.08.2023", 378.25, ["Cancelled", "danger"]],
  ["Glen Tremblay", "ora_gutmann@gmail.com", "2025-10-11", "11.10.2025", 357.93, ["Ready", "info"]],
];
const money = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const messages = {
  empty: ["table", "No users yet", "People you invite will show up here.", `<button type="button" class="canon-button" data-emphasis="high"><span class="canon-icon" data-icon="plus" aria-hidden="true"></span><span class="canon-button-label">Invite people</span></button>`, ""],
  "no-results": ["search-x", "No matching users", "Try other words, or clear the filters to see everyone.", `<button type="button" class="canon-button"><span class="canon-button-label">Clear filters</span></button>`, ""],
  error: ["circle-alert", "Couldn't load users", "Something went wrong on our side. Try again in a moment.", `<button type="button" class="canon-button"><span class="canon-icon" data-icon="refresh" aria-hidden="true"></span><span class="canon-button-label">Try again</span></button>`, ` data-intent="danger"`],
};

export const controls = [
  { group: "Data Table", name: "rows", label: "Rows", type: "number", min: 1, max: 8, default: 6 },
  { group: "Data Table", name: "state", label: "State", type: "select", options: [["rows", "Rows"], ["loading", "Loading (aria-busy)"], ["empty", "Empty"], ["no-results", "No results"], ["error", "Error"]], default: "rows" },
  { group: "Data Table", name: "sort", label: "Sortable columns (aria-sort)", type: "checkbox", default: true },
  { group: "Data Table", name: "select", label: "Select column", type: "checkbox", default: true },
  { group: "Data Table", name: "actions", label: "Row actions", type: "select", options: [["", "None"], ["menu", "Menu"], ["buttons", "Buttons (Toolbar)"]], default: "menu" },
  { group: "Data Table", name: "pin", label: "Pin User (data-pin)", type: "checkbox", default: false },
  { group: "Data Table", name: "toolbar", label: "Toolbar: search, filters, columns, export", type: "checkbox", default: true },
  { group: "Data Table", name: "truncate", label: "Cut long emails (data-wrap=\"truncate\")", type: "checkbox", default: false },
  { group: "Data Table", name: "local", label: "Rows in the page (data-local)", type: "checkbox", default: true },
  { group: "Data Table", name: "perPage", label: "Rows per page (0: no pagination)", type: "number", min: 0, max: 8, default: 3 },

  { group: "Look", name: "lines", label: "Lines (data-lines)", type: "select", options: [["", "Between rows"], ["grid", "Between rows and columns (grid)"], ["none", "Only under the header (none)"]], default: "" },
  { group: "Look", name: "striped", label: "data-striped", type: "checkbox", default: false },
  { group: "Look", name: "hover", label: "data-hover", type: "checkbox", default: false },
  { group: "Look", name: "frame", label: "No frame: border, corners, fill (data-frame=\"none\")", type: "checkbox", default: false },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const count = Math.max(1, Math.min(people.length, Math.round(Number(s.rows) || 1)));
  const perPage = Math.max(0, Math.round(Number(s.perPage) || 0));
  const rows = s.state === "rows" ? people.slice(0, count) : [];
  const sort = s.sort ? ` aria-sort="none"` : "";
  const attrs = [`class="canon-data-table"`];
  if (s.local) attrs.push(`data-local`);
  if (s.state === "loading") attrs.push(`aria-busy="true"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);

  const head = [];
  if (s.select) head.push(`<th scope="col" data-column="select"><div class="canon-choice"><input type="checkbox" id="pg-dt-all"><label class="canon-choice-label canon-visually-hidden" for="pg-dt-all">Select all rows</label></div></th>`);
  const type = (kind) => (s.toolbar ? ` data-type="${kind}"` : "");
  head.push(
    `<th scope="col"${sort}${type("text")}${s.pin ? " data-pin" : ""}>User</th>`,
    `<th scope="col"${type("text")}${s.truncate ? ` data-wrap="truncate"` : ""}>Email</th>`,
    `<th scope="col"${sort}${type("date")}>Date</th>`,
    `<th scope="col"${sort}${type("number")} data-align="end">Amount</th>`,
    `<th scope="col"${sort}${type("choice")}>Status</th>`,
  );
  if (s.actions) head.push(`<td data-column="actions"></td>`);

  const look = [];
  if (s.lines) look.push(`data-lines="${s.lines}"`);
  if (s.striped) look.push(`data-striped`);
  if (s.hover) look.push(`data-hover`);
  if (s.frame) look.push(`data-frame="none"`);
  const toolbar = s.toolbar
    ? [
        `  <div class="canon-data-table-toolbar">`,
        `    <div class="canon-text-input"><span class="canon-icon" data-icon="search" aria-hidden="true"></span><input type="search" aria-label="Search users" placeholder="Search"></div>`,
        `    <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" data-panel="filters"><span class="canon-icon" data-icon="list-filter" aria-hidden="true"></span><span class="canon-button-label">Filter</span></button>`,
        `    <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" data-panel="columns" data-align="end" aria-haspopup="dialog"><span class="canon-button-label">Columns</span></button>`,
        `    <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" popovertarget="pg-dt-export" aria-haspopup="menu" aria-expanded="false"><span class="canon-button-label">Export</span></button>`,
        `    <div class="canon-menu" id="pg-dt-export" popover role="menu" aria-label="Export"><button type="button" class="canon-menu-item" role="menuitem" data-export="csv"><span class="canon-menu-label">CSV</span></button></div>`,
        `  </div>`,
      ]
    : [];
  const lines = [`<div ${attrs.join(" ")}>`, ...toolbar, `  <div ${[`class="canon-table"`, ...look].join(" ")}>`, `    <table>`, `      <caption class="canon-visually-hidden">Users</caption>`, `      <thead>`, `        <tr>`, ...head.map((cell) => `          ${cell}`), `        </tr>`, `      </thead>`, `      <tbody>`];

  rows.forEach(([name, email, iso, date, amount, [status, intent]], i) => {
    const cells = [];
    if (s.select) cells.push(`<td><div class="canon-choice"><input type="checkbox" id="pg-dt-${i}" name="users" value="${i + 1}"><label class="canon-choice-label canon-visually-hidden" for="pg-dt-${i}">Select ${name}</label></div></td>`);
    cells.push(`<th scope="row">${name}</th>`, `<td>${email}</td>`, `<td><time datetime="${iso}">${date}</time></td>`, `<td data-align="end" data-value="${amount}">${money(amount)}</td>`, `<td data-value="${status}"><span class="canon-tag" data-intent="${intent}"><span class="canon-tag-label">${status}</span></span></td>`);
    if (s.actions === "menu") {
      cells.push(`<td><button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" popovertarget="pg-dt-menu-${i}" aria-haspopup="menu" aria-expanded="false"><span class="canon-icon" data-icon="more" aria-hidden="true"></span><span class="canon-button-label">Actions for ${name}</span></button><div class="canon-menu" id="pg-dt-menu-${i}" popover role="menu" aria-label="Actions for ${name}"><button type="button" class="canon-menu-item" role="menuitem"><span class="canon-menu-label">Edit</span></button><button type="button" class="canon-menu-item" role="menuitem"><span class="canon-menu-label">Delete</span></button></div></td>`);
    }
    if (s.actions === "buttons") {
      cells.push(`<td><div class="canon-toolbar" role="toolbar" aria-label="Actions for ${name}"><button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" data-display="icon"><span class="canon-icon" data-icon="receipt" aria-hidden="true"></span><span class="canon-button-label">Invoice for ${name}</span></button><a class="canon-button" data-emphasis="low" data-intent="neutral" data-display="icon" href="#"><span class="canon-icon" data-icon="external" aria-hidden="true"></span><span class="canon-button-label">Open ${name}</span></a></div></td>`);
    }
    lines.push(`        <tr>`, ...cells.map((cell) => `          ${cell}`), `        </tr>`);
  });

  const message = messages[s.state];
  if (message) {
    const [icon, title, description, action, intent] = message;
    lines.push(
      `        <tr><td>`,
      `          <div class="canon-empty-state"${intent}>`,
      `            <span class="canon-empty-state-icon" aria-hidden="true"><span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span></span>`,
      `            <p class="canon-empty-state-title">${title}</p>`,
      `            <p class="canon-empty-state-description">${description}</p>`,
      `            <div class="canon-empty-state-actions">${action}</div>`,
      `          </div>`,
      `        </td></tr>`,
    );
  }
  lines.push(`      </tbody>`, `    </table>`, `  </div>`);
  if (perPage && s.state === "rows") {
    lines.push(`  <nav class="canon-pagination" aria-label="Pagination" data-total="${rows.length}" data-per-page="${perPage}" data-page="1">`, `    <p class="canon-pagination-summary"></p>`, `  </nav>`);
  }
  lines.push(`</div>`);
  return lines.join("\n");
}
