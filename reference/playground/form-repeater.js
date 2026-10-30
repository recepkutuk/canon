/*
 * Form Repeater playground: every parameter of the Form Repeater contract,
 * with two columns (a team and a name).
 * Spec: docs/components/form-repeater.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* The stage's width; the preview's frame narrows it further. */
export const width = "28.5rem";

export const controls = [
  { group: "Form Repeater", name: "labels", label: "Labels (Fields; without: aria-label)", type: "checkbox", default: true },
  { group: "Form Repeater", name: "items", label: "Items to start with", type: "select", options: ["0", "1", "2", "3"], default: "1" },
  { group: "Form Repeater", name: "max", label: "data-max", type: "select", options: [["", "(none)"], "2", "3", "5"], default: "5" },
  { group: "Form Repeater", name: "min", label: "data-min", type: "select", options: [["", "(1)"], "0", "2"], default: "" },
  { group: "Form Repeater", name: "columns", label: "--canon-repeater-columns", type: "select", options: [["", "(equal)"], ["minmax(0, 2fr) minmax(0, 3fr)", "2fr 3fr"], ["10rem minmax(0, 1fr)", "10rem 1fr"]], default: "" },
  { group: "Form Repeater", name: "add", label: "Add label", type: "text", default: "Add" },
  { group: "Form Repeater", name: "remove", label: "Remove label", type: "text", default: "Remove" },

  { group: "State", name: "message", label: "Message on the first name", type: "select", options: [["", "(none)"], "danger"], default: "", when: (s) => s.labels },
  { group: "State", name: "disabled", label: "disabled (on a fieldset around it)", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const people = [["HR", "John Doe"], ["Finance", "Jane Smith"], ["Engineering", "Ana Lima"]];
const teams = ["HR", "Finance", "Engineering", "Design", "Sales"];

const item = (s, index, [team, name] = ["", ""], pad) => {
  const id = `pg-repeater-${index}`;
  const error = s.labels && s.message && index === 0;
  const named = (label) => (s.labels ? "" : ` aria-label="${label}"`);
  const select = [
    `<select id="${id}-team" name="members[${index}][team]"${named("Team")}>`,
    `  <option value="" hidden>Select team</option>`,
    ...teams.map((option) => `  <option${option === team ? " selected" : ""}>${option}</option>`),
    `</select>`,
  ];
  const input = `<input type="text" id="${id}-name" name="members[${index}][name]"${named("Name")} placeholder="Enter name"${name ? ` value="${name}"` : ""}${error ? ` aria-invalid="true" aria-describedby="${id}-name-message"` : ""}>`;
  const lines = [`<div class="canon-repeater-item">`];
  if (s.labels) {
    lines.push(`  <div class="canon-field">`, `    <div class="canon-label"><label class="canon-label-text" for="${id}-team">Team</label></div>`, `    <div class="canon-select">`);
    lines.push(...select.map((line) => `      ${line}`));
    lines.push(`    </div>`, `  </div>`);
    lines.push(`  <div class="canon-field">`, `    <div class="canon-label"><label class="canon-label-text" for="${id}-name">Name</label></div>`, `    <div class="canon-text-input">`, `      ${input}`, `    </div>`);
    if (error) lines.push(`    <p class="canon-field-message" id="${id}-name-message" data-intent="danger">Enter the full name.</p>`);
    lines.push(`  </div>`);
  } else {
    lines.push(`  <div class="canon-select">`, ...select.map((line) => `    ${line}`), `  </div>`);
    lines.push(`  <div class="canon-text-input">`, `    ${input}`, `  </div>`);
  }
  lines.push(
    `  <button type="button" class="canon-button" data-emphasis="low" data-intent="danger" data-display="icon" commandfor="pg-repeater" command="--canon-remove">`,
    `    <span class="canon-icon" data-icon="trash" aria-hidden="true"></span>`,
    `    <span class="canon-button-label">${escape(s.remove)}</span>`,
    `  </button>`,
    `</div>`,
  );
  return lines.map((line) => pad + line);
};

export function render(s) {
  const attrs = [`class="canon-repeater"`, `id="pg-repeater"`];
  if (s.max) attrs.push(`data-max="${s.max}"`);
  if (s.min) attrs.push(`data-min="${s.min}"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.columns) attrs.push(`style="--canon-repeater-columns: ${s.columns}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);

  const pad = s.disabled ? "    " : "  ";
  const lines = [`<div ${attrs.join(" ")}>`];
  for (let index = 0; index < Number(s.items); index++) lines.push(...item(s, index, people[index], pad));
  /* Add copies the first item; a list that starts empty gives one in a template. */
  if (Number(s.items) === 0) lines.push(`${pad}<template>`, ...item(s, "{index}", undefined, pad + "  "), `${pad}</template>`);
  lines.push(
    `${pad}<button type="button" class="canon-button" data-intent="neutral" commandfor="pg-repeater" command="--canon-add">`,
    `${pad}  <span class="canon-icon" data-icon="plus" aria-hidden="true"></span>`,
    `${pad}  <span class="canon-button-label">${escape(s.add)}</span>`,
    `${pad}</button>`,
    `</div>`,
  );
  if (!s.disabled) return lines.join("\n");
  return [
    `<fieldset class="canon-fieldset" disabled>`,
    `  <legend class="canon-fieldset-legend">Members</legend>`,
    ...lines.map((line) => `  ${line}`),
    `</fieldset>`,
  ].join("\n");
}
