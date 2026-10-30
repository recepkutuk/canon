/*
 * Section playground: a titled part of a page.
 * Spec: docs/components/section.md
 */

import { details } from "./card.js";

const icon = (name) => `<span class="canon-icon" data-icon="${name}" aria-hidden="true"></span>`;

export function section({ id = "sc", title = "Billing details", description = "Where invoices go, and when they're due", action = true, size = "", pad = "" } = {}) {
  const lines = [`${pad}<section class="canon-section"${size ? ` data-size="${size}"` : ""}>`, `${pad}  <header class="canon-section-header">`, `${pad}    <h2 class="canon-section-title" id="${id}-title">${title}</h2>`];
  if (description) lines.push(`${pad}    <p class="canon-section-description">${description}</p>`);
  if (action) lines.push(`${pad}    <div class="canon-section-actions"><button type="button" class="canon-button" data-emphasis="medium" data-intent="neutral">${icon("pencil")}<span class="canon-button-label">Edit</span></button></div>`);
  lines.push(`${pad}  </header>`, details(`${pad}  `), `${pad}</section>`);
  return lines.join("\n");
}

/* The stage's width; the preview's frame narrows it further. */
export const width = "40rem";

export const controls = [
  { group: "Section", name: "description", label: "A description", type: "checkbox", default: true },
  { group: "Section", name: "action", label: "An action", type: "checkbox", default: true },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  return section({ id: "pg-sc", description: s.description ? "Where invoices go, and when they're due" : "", action: s.action, size: s.size });
}
