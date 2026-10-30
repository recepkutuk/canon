/*
 * Tabs playground: in-page tabs (a tablist and its panels) or links.
 * Spec: docs/components/tabs.md
 */

const icon = (name) => `<span class="canon-icon" data-icon="${name}" aria-hidden="true"></span>`;

/* A record's parts. */
const PARTS = [
  ["overview", "Overview", "info", null],
  ["payments", "Payments", "receipt", null],
  ["activity", "Activity", "list", ["14", " new"]],
  ["notes", "Notes", "pencil", null],
  ["emails", "Emails", "mail", ["3", " unread"]],
  ["attachments", "Attachments", "link", null],
  ["settings", "Settings", "settings", null],
];

export function tabs({ id = "tb", kind = "page", count = 5, icons = false, counts = false, fill = false, size = "", selected = 0, disabled = false, label = "Invoice INV-2041", pad = "" }) {
  const parts = PARTS.slice(0, count);
  const listAttrs = [`class="canon-tabs-list"`, `aria-label="${label}"`];
  if (fill) listAttrs.push("data-fill");
  if (size) listAttrs.push(`data-size="${size}"`);
  const inner = ([key, text, ic, badge]) => `${icons ? icon(ic) : ""}<span class="canon-tab-label">${text}</span>${counts && badge ? `<span class="canon-count">${badge[0]}<span class="canon-visually-hidden">${badge[1]}</span></span>` : ""}`;
  const off = (i) => disabled && i === parts.length - 1 && i !== selected;
  if (kind === "links") {
    return [
      `${pad}<nav ${listAttrs.join(" ")}>`,
      ...parts.map((part, i) => `${pad}  <a class="canon-tab" href="#${id}-${part[0]}"${i === selected ? ` aria-current="page"` : ""}>${inner(part)}</a>`),
      `${pad}</nav>`,
    ].join("\n");
  }
  return [
    `${pad}<div class="canon-tabs">`,
    `${pad}  <div ${listAttrs.join(" ")} role="tablist">`,
    ...parts.map((part, i) => `${pad}    <button type="button" class="canon-tab" role="tab" id="${id}-tab-${part[0]}" aria-controls="${id}-${part[0]}" aria-selected="${i === selected}"${i === selected ? "" : ` tabindex="-1"`}${off(i) ? ` aria-disabled="true"` : ""}>${inner(part)}</button>`),
    `${pad}  </div>`,
    ...parts.map(([key, text], i) => `${pad}  <div class="canon-tabs-panel" role="tabpanel" id="${id}-${key}" aria-labelledby="${id}-tab-${key}" tabindex="0"${i === selected ? "" : " hidden"}><p>${text} of INV-2041.</p></div>`),
    `${pad}</div>`,
  ].join("\n");
}

export const controls = [
  { group: "Tabs", name: "kind", label: "Kind", type: "select", options: [["page", "In-page (a tablist and its panels)"], ["links", "Links (each part its own page)"]], default: "page" },
  { group: "Tabs", name: "count", label: "Tabs", type: "number", min: 2, max: 7, default: 5 },
  { group: "Tabs", name: "icons", label: "Icons", type: "checkbox", default: false },
  { group: "Tabs", name: "counts", label: "Counts (Activity, Emails)", type: "checkbox", default: false },
  { group: "Tabs", name: "disabled", label: "The last tab aria-disabled", type: "checkbox", default: false, when: (s) => s.kind === "page" },

  { group: "Hints", name: "fill", label: "data-fill (tabs share the width)", type: "checkbox", default: false },
  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },
  { group: "Hints", name: "display", label: "data-display", type: "select", options: [["", "(theme decides)"], ["icon", "icon"]], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const html = tabs({ id: "pg-tb", kind: s.kind, count: Number(s.count) || 5, icons: s.icons || s.display === "icon", counts: s.counts, fill: s.fill, size: s.size, disabled: s.disabled });
  return s.display === "icon" ? html.replace(/class="canon-tabs-list"/, `class="canon-tabs-list" data-display="icon"`) : html;
}
