/*
 * Form Layout playground: a form with sections, a row, a reveal and actions.
 * Spec: docs/components/form-layout.md
 */

/* The stage's width; the preview's frame narrows it further. */
export const width = "48rem";

export const controls = [
  { group: "Form", name: "layout", label: "data-layout", type: "select", options: [["", "(stacked)"], ["aside", "aside (settings)"]], default: "" },
  { group: "Form", name: "sections", label: "Sections", type: "checkbox", default: true },
  { group: "Form", name: "columns", label: "--canon-form-columns (the row)", type: "select", options: [["", "(equal)"], ["minmax(0, 2fr) minmax(0, 1fr)", "2fr 1fr"]], default: "minmax(0, 2fr) minmax(0, 1fr)" },
  { group: "Form", name: "reveal", label: "A reveal", type: "checkbox", default: true },
  { group: "Form", name: "sticky", label: "data-sticky (actions)", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const field = (id, label, type = "text") => [
  `<div class="canon-field">`,
  `  <div class="canon-label"><label class="canon-label-text" for="${id}">${label}</label></div>`,
  `  <div class="canon-text-input">`,
  `    <input type="${type}" id="${id}" name="${id}" placeholder>`,
  `  </div>`,
  `</div>`,
];
const indent = (lines, n) => lines.map((line) => " ".repeat(n) + line);

export function render(s) {
  const attrs = [`class="canon-form"`];
  if (s.layout) attrs.push(`data-layout="${s.layout}"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);

  const row = [
    `<div class="canon-form-row"${s.columns ? ` style="--canon-form-columns: ${s.columns}"` : ""}>`,
    ...indent(field("pg-city", "City"), 2),
    ...indent(field("pg-zip", "Postcode"), 2),
    `</div>`,
  ];
  const contact = [field("pg-name", "Full name"), field("pg-email", "Email", "email")].flat();
  const reveal = !s.reveal ? [] : [
    `<div class="canon-choice">`,
    `  <input type="checkbox" id="pg-gift" name="gift">`,
    `  <label class="canon-choice-label" for="pg-gift">This is a gift</label>`,
    `</div>`,
    `<fieldset class="canon-form-reveal">`,
    ...indent(field("pg-to", "Gift message"), 2),
    `</fieldset>`,
  ];
  const section = (id, title, description, body) => [
    `<section class="canon-form-section" aria-labelledby="${id}-title">`,
    `  <header class="canon-form-section-header">`,
    `    <h3 class="canon-form-section-title" id="${id}-title">${title}</h3>`,
    `    <p class="canon-form-section-description">${description}</p>`,
    `  </header>`,
    ...indent(body, 2),
    `</section>`,
  ];
  const body = s.sections
    ? [...section("pg-contact", "Contact", "Where we reach you.", contact), ...section("pg-address", "Delivery", "Where the order goes.", [...row, ...reveal])]
    : [...contact, ...row, ...reveal];
  const lines = [
    `<form ${attrs.join(" ")}>`,
    ...indent(body, 2),
    `  <div class="canon-form-actions"${s.sticky ? " data-sticky" : ""}>`,
    `    <button type="submit" class="canon-button" data-emphasis="high"><span class="canon-button-label">Place order</span></button>`,
    `    <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral"><span class="canon-button-label">Back</span></button>`,
    `  </div>`,
    `</form>`,
  ];
  return lines.join("\n");
}
