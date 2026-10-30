/*
 * Page Header playground: the top of a page, a collection's or a record's.
 * Spec: docs/components/page-header.md
 */

const icon = (name) => `<span class="canon-icon" data-icon="${name}" aria-hidden="true"></span>`;

const button = (label, iconName, { primary = false, iconOnly = false } = {}) =>
  `<button type="button" class="canon-button" data-emphasis="${primary ? "high" : "medium"}"${primary ? "" : ` data-intent="neutral"`}${iconOnly ? ` data-display="icon"` : ""}>${icon(iconName)}<span class="canon-button-label">${label}</span></button>`;

/* A collection's page (Invoices) or a record's (INV-2041). */
const PAGES = {
  list: {
    title: "Invoices",
    description: "128 invoices · €340,200 outstanding",
    status: null,
    actions: [["Import", "download"], ["Export", "download"], ["Settings", "settings"]],
    primary: ["New invoice", "plus"],
  },
  log: {
    title: "Audit log",
    description: "Every change in this workspace, last 90 days",
    status: null,
    actions: [["Refresh", "refresh"], ["Export", "download"]],
    primary: null,
  },
  record: {
    title: "INV-2041",
    description: "Globex Corporation · Due 3 October · €12,400",
    status: ["warning", "Overdue"],
    actions: [["Download", "download"], ["Duplicate", "copy"], ["Archive", "trash"]],
    primary: ["Send reminder", "mail"],
  },
};

export function pageHeader({ id = "ph", page = "record", trail = "back", status = true, description = true, actions = 4, primary = true, rename = true, sticky = false, size = "", headingLevel = 1, hiddenTitle = false, pad = "" }) {
  const p = PAGES[page];
  const attrs = [`class="canon-page-header"`];
  if (sticky) attrs.push("data-sticky");
  if (size) attrs.push(`data-size="${size}"`);
  const lines = [`${pad}<header ${attrs.join(" ")}>`];
  if (trail === "back") lines.push(`${pad}  <a class="canon-page-header-back" href="#${id}-invoices">${icon("chevron-left")}Invoices</a>`);
  if (trail === "breadcrumb") lines.push(
    `${pad}  <nav class="canon-breadcrumb" aria-label="Breadcrumb">`,
    `${pad}    <ol>`,
    `${pad}      <li><a href="#${id}-finance">Finance</a></li>`,
    `${pad}      <li><a href="#${id}-receivables">Receivables</a></li>`,
    `${pad}      <li><a href="#${id}-invoices">Invoices</a></li>`,
    ...(page === "record" ? [`${pad}      <li><a href="#${id}-${p.title.toLowerCase()}" aria-current="page">${p.title}</a></li>`] : []),
    `${pad}    </ol>`,
    `${pad}  </nav>`,
  );
  const h = `h${headingLevel}`;
  if (hiddenTitle) {
    lines.push(`${pad}  <div class="canon-page-header-title"><${h} class="canon-visually-hidden">${p.title}</${h}></div>`);
  } else {
    const parts = [`<${h} id="${id}-title">${p.title}</${h}>`];
    if (status && p.status) parts.push(`<span class="canon-tag" data-intent="${p.status[0]}"><span class="canon-tag-label">${p.status[1]}</span></span>`);
    if (rename) parts.push(`<button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" commandfor="${id}-title" command="--canon-edit">${icon("pencil")}<span class="canon-button-label">Rename</span></button>`);
    lines.push(`${pad}  <div class="canon-page-header-title">`, ...parts.map((part) => `${pad}    ${part}`), `${pad}  </div>`);
  }
  if (description) lines.push(`${pad}  <p class="canon-page-header-description">${p.description}</p>`);
  /* The primary action is optional (a view only to read has none). */
  const main = primary && p.primary;
  const secondary = p.actions.slice(0, Math.max(0, main ? actions - 1 : actions));
  if (actions > 0 && (secondary.length || main)) {
    lines.push(
      `${pad}  <div class="canon-page-header-actions">`,
      ...secondary.map(([label, name]) => `${pad}    ${button(label, name)}`),
      ...(main ? [`${pad}    ${button(p.primary[0], p.primary[1], { primary: true })}`] : []),
      `${pad}  </div>`,
    );
  }
  lines.push(`${pad}</header>`);
  return lines.join("\n");
}

export const controls = [
  { group: "Page Header", name: "page", label: "The page", type: "select", options: [["record", "A record (INV-2041)"], ["list", "A collection (Invoices)"], ["log", "A view to read (Audit log)"]], default: "record" },
  { group: "Page Header", name: "trail", label: "Above the title", type: "select", options: [["", "(nothing)"], ["back", "A back link"], ["breadcrumb", "A Breadcrumb"]], default: "back" },
  { group: "Page Header", name: "status", label: "A status Tag (a record's)", type: "checkbox", default: true, when: (s) => s.page === "record" },
  { group: "Page Header", name: "rename", label: "Rename in place (--canon-edit)", type: "checkbox", default: true },
  { group: "Page Header", name: "description", label: "A description", type: "checkbox", default: true },
  { group: "Page Header", name: "actions", label: "Actions", type: "select", options: [["0", "none"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]], default: "4" },
  { group: "Page Header", name: "primary", label: "The last one primary (data-emphasis=\"high\")", type: "checkbox", default: true, when: (s) => s.page !== "log" && s.actions !== "0" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  return pageHeader({ id: "pg-ph", page: s.page, trail: s.trail, status: s.status, description: s.description, actions: Number(s.actions), primary: s.primary, rename: s.rename, size: s.size });
}
