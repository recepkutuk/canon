/*
 * Filter Bar playground: a search field, facets, chips, Clear all and a
 * count, each optional.
 * Spec: docs/components/filter-bar.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Filter Bar", name: "label", label: "aria-label", type: "text", default: "Filter tasks" },
  { group: "Filter Bar", name: "search", label: "Search field", type: "checkbox", default: true },
  { group: "Filter Bar", name: "status", label: "Facet: Status (checkboxes)", type: "checkbox", default: true },
  { group: "Filter Bar", name: "priority", label: "Facet: Priority (radios)", type: "checkbox", default: true },
  { group: "Filter Bar", name: "chips", label: "Toggle Chips", type: "checkbox", default: true },
  { group: "Filter Bar", name: "count", label: "Count (output)", type: "checkbox", default: true },
  { group: "Filter Bar", name: "submit", label: "data-submit (the page submits)", type: "checkbox", default: false },

  { group: "State", name: "chosen", label: "Chosen", type: "select", options: [["", "nothing"], ["one", "one status"], ["more", "two statuses and a priority"]], default: "one" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const choice = (type, id, name, value, label, checked) =>
  `        <div class="canon-choice"><input type="${type}" id="${id}" name="${name}" value="${value}"${checked ? " checked" : ""}><label class="canon-choice-label" for="${id}">${label}</label></div>`;

const facet = (id, label, type, name, options) => [
  `  <div class="canon-filter-bar-facet">`,
  `    <button type="button" class="canon-filter-bar-button" popovertarget="${id}" aria-haspopup="dialog" aria-expanded="false">`,
  `      <span class="canon-filter-bar-label">${label}</span>`,
  `    </button>`,
  `    <div class="canon-popover" id="${id}" popover role="dialog" aria-label="${label}">`,
  `      <fieldset class="canon-fieldset">`,
  `        <legend class="canon-fieldset-legend canon-visually-hidden">${label}</legend>`,
  ...options.map(([value, text, checked]) => choice(type, `${id}-${value || "any"}`, name, value, text, checked)),
  `      </fieldset>`,
  `    </div>`,
  `  </div>`,
];

export function render(s) {
  const attrs = [`class="canon-filter-bar"`, `id="pg-filters"`, `role="search"`, `aria-label="${escape(s.label || "Filter tasks")}"`];
  if (s.submit) attrs.push("data-submit");
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const one = s.chosen === "one" || s.chosen === "more";
  const more = s.chosen === "more";
  const lines = [`<form ${attrs.join(" ")}>`];
  if (s.search) lines.push(
    `  <div class="canon-text-input">`,
    `    <span class="canon-icon" data-icon="search" aria-hidden="true"></span>`,
    `    <input type="search" name="q" aria-label="Search tasks" placeholder="Search tasks">`,
    `  </div>`,
  );
  if (s.status) lines.push(...facet("pg-status", "Status", "checkbox", "status", [["open", "Open", one], ["review", "In review", more], ["done", "Done", false]]));
  if (s.priority) lines.push(...facet("pg-priority", "Priority", "radio", "priority", [["", "Any", !more], ["high", "High", more], ["low", "Low", false]]));
  if (s.chips) lines.push(
    `  <label class="canon-toggle-chip">`,
    `    <input type="checkbox" name="mine" value="1">`,
    `    <span class="canon-toggle-chip-label">Assigned to me</span>`,
    `  </label>`,
  );
  lines.push(
    `  <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" commandfor="pg-filters" command="--canon-clear">`,
    `    <span class="canon-button-label">Clear all</span>`,
    `  </button>`,
    `  <button type="submit" class="canon-button canon-filter-bar-apply" data-emphasis="high">`,
    `    <span class="canon-button-label">Apply</span>`,
    `  </button>`,
  );
  if (s.count) lines.push(`  <output class="canon-filter-bar-count" data-align="end">32 tasks</output>`);
  lines.push(`</form>`);
  return lines.join("\n");
}
