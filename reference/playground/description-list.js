/*
 * Description List playground: a record's details, with the list's hints.
 * Spec: docs/components/description-list.md
 */

const items = [
  ["Invoice", "INV-2041", "receipt"],
  ["Customer", "Edwin Mueller", "mail"],
  ["Due", `<time datetime="2026-11-01">1 Nov 2026</time>`, "calendar"],
  ["Status", `<span class="canon-tag" data-intent="warning"><span class="canon-tag-label">Waiting</span></span>`, "info"],
];

export const controls = [
  { group: "Description List", name: "label", label: "data-label", type: "select", options: [["", "(terms above)"], ["start", "start (terms beside)"]], default: "start" },
  { group: "Description List", name: "columns", label: "data-columns", type: "select", options: [["", "(one)"], "2", "3"], default: "" },
  { group: "Description List", name: "lines", label: "data-lines", type: "select", options: [["", "(between items)"], ["none", "none"]], default: "" },
  { group: "Description List", name: "icons", label: "Icons as terms", type: "checkbox", default: false },
  { group: "Description List", name: "empty", label: "An empty value", type: "checkbox", default: false },
  { group: "Description List", name: "action", label: "Row action (Change)", type: "checkbox", default: false },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const attrs = [`class="canon-description-list"`];
  if (s.label) attrs.push(`data-label="${s.label}"`);
  if (s.columns) attrs.push(`data-columns="${s.columns}"`);
  if (s.lines) attrs.push(`data-lines="${s.lines}"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const lines = [`<dl ${attrs.join(" ")}>`];
  const list = s.empty ? [...items, ["Reference", "", "tag"]] : items;
  list.forEach(([term, value, icon], index) => {
    const dt = s.icons
      ? `<dt><span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span><span class="canon-visually-hidden">${term}</span></dt>`
      : `<dt>${term}</dt>`;
    lines.push(`  <div>`, `    ${dt}`, `    <dd>${value}</dd>`);
    if (s.action && index === 1) lines.push(
      `    <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral">`,
      `      <span class="canon-button-label">Change<span class="canon-visually-hidden"> customer</span></span>`,
      `    </button>`,
    );
    lines.push(`  </div>`);
  });
  lines.push(`</dl>`);
  return lines.join("\n");
}
