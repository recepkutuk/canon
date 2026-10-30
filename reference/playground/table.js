/*
 * Table playground: a data table in its frame; caption, row headers,
 * footer, alignment, status tags.
 * Spec: docs/components/table.md
 */

const people = [
  ["Edwin Mueller", "tyrese_nicolas@gmail.com", "2024-08-16", "16.08.2024", 495.9, ["Waiting", "warning"]],
  ["Suzanne Jacobi", "cindy_murphy41@yahoo.com", "2025-12-03", "03.12.2025", 662.02, ["Ready", "info"]],
  ["Kellie Schoen", "troy.lubowitz@gmail.com", "2023-07-21", "21.07.2023", 235.71, ["Cancelled", "danger"]],
  ["Shari Feeney PhD", "cecelia_erdman@yahoo.com", "2026-01-15", "15.01.2026", 436.68, ["Waiting", "warning"]],
  ["Mrs. Jo Emard", "jovany66@hotmail.com", "2024-05-09", "09.05.2024", 984.24, ["Delivered", "success"]],
  ["Lauren Monahan", "jermaine.corkery@gmail.com", "2022-11-27", "27.11.2022", 916.69, ["In delivery", "info"]],
];
const money = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export const controls = [
  { group: "Table", name: "rows", label: "Rows", type: "number", min: 0, max: 6, default: 4 },
  { group: "Table", name: "caption", label: "Name", type: "select", options: [["hidden", "Caption, visually hidden"], ["shown", "Caption, shown"], ["label", "aria-label"]], default: "hidden" },
  { group: "Table", name: "rowHeaders", label: "Row headers (th scope=\"row\")", type: "checkbox", default: true },
  { group: "Table", name: "footer", label: "Footer (total)", type: "checkbox", default: false },
  { group: "Table", name: "end", label: "Amount aligned to the end", type: "checkbox", default: true },
  { group: "Table", name: "status", label: "Status tags", type: "checkbox", default: true },
  { group: "Table", name: "nowrap", label: "Email on one line (data-wrap)", type: "checkbox", default: false },

  { group: "Look", name: "lines", label: "Lines (data-lines)", type: "select", options: [["", "Between rows"], ["grid", "Between rows and columns (grid)"], ["none", "Only under the header (none)"]], default: "" },
  { group: "Look", name: "striped", label: "data-striped", type: "checkbox", default: false },
  { group: "Look", name: "hover", label: "data-hover", type: "checkbox", default: false },
  { group: "Look", name: "frame", label: "No frame: border, corners, fill (data-frame=\"none\")", type: "checkbox", default: false },

  { group: "Hints", name: "density", label: "data-density", type: "select", options: [["", "(theme decides: comfortable)"], "compact", "comfortable", "spacious"], default: "" },
  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const count = Math.max(0, Math.min(people.length, Math.round(Number(s.rows) || 0)));
  const rows = people.slice(0, count);
  const align = s.end ? ` data-align="end"` : "";
  const wrap = s.nowrap ? ` data-wrap="none"` : "";
  const look = [];
  if (s.lines) look.push(`data-lines="${s.lines}"`);
  if (s.striped) look.push(`data-striped`);
  if (s.hover) look.push(`data-hover`);
  if (s.frame) look.push(`data-frame="none"`);
  const frame = [`class="canon-table"`, ...look];
  if (s.density) frame.push(`data-density="${s.density}"`);
  if (s.size) frame.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") frame.push(`dir="rtl"`);

  const lines = [`<div ${frame.join(" ")}>`, s.caption === "label" ? `  <table aria-label="Orders">` : `  <table>`];
  if (s.caption === "shown") lines.push(`    <caption>Orders</caption>`);
  if (s.caption === "hidden") lines.push(`    <caption class="canon-visually-hidden">Orders</caption>`);

  const head = [];
  head.push(`<th scope="col">User</th>`, `<th scope="col"${wrap}>Email</th>`, `<th scope="col">Date</th>`, `<th scope="col"${align}>Amount</th>`);
  if (s.status) head.push(`<th scope="col">Status</th>`);
  lines.push(`    <thead>`, `      <tr>${head.join("")}</tr>`, `    </thead>`, `    <tbody>`);

  rows.forEach(([name, email, iso, date, amount, [status, intent]]) => {
    const cells = [];
    cells.push(s.rowHeaders ? `<th scope="row">${name}</th>` : `<td>${name}</td>`);
    cells.push(`<td${wrap}>${email}</td>`, `<td><time datetime="${iso}">${date}</time></td>`, `<td${align}>${money(amount)}</td>`);
    if (s.status) cells.push(`<td><span class="canon-tag" data-intent="${intent}"><span class="canon-tag-label">${status}</span></span></td>`);
    lines.push(`      <tr>`, ...cells.map((cell) => `        ${cell}`), `      </tr>`);
  });
  lines.push(`    </tbody>`);

  if (s.footer) {
    const total = rows.reduce((sum, row) => sum + row[4], 0);
    const cells = [];
    cells.push(`<th scope="row">Total</th>`, `<td></td>`, `<td></td>`, `<td${align}>${money(total)}</td>`);
    if (s.status) cells.push(`<td></td>`);
    lines.push(`    <tfoot>`, `      <tr>${cells.join("")}</tr>`, `    </tfoot>`);
  }
  lines.push(`  </table>`, `</div>`);
  return lines.join("\n");
}
