/*
 * Shared by the playgrounds of components that use Label (Field, Slider,
 * Range Slider): the label block's markup.
 * Spec: docs/components/label.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* Controls every user of Label offers, in the "Label" group. */
export const labelControls = (defaults = {}) => [
  { group: "Label", name: "label", label: "Label", type: "text", default: defaults.label ?? "Label" },
  { group: "Label", name: "optional", label: "Optional text (empty: none)", type: "text", default: "" },
  { group: "Label", name: "info", label: "Info tooltip (empty: none)", type: "text", default: "" },
  { group: "Label", name: "description", label: "Description (empty: none)", type: "text", default: defaults.description ?? "" },
];

/* The block, as lines. `forId` makes a <label for>; `labelId` a <span id>
   that names a group. */
export function labelLines(s, { forId, labelId, idBase, indent = "  " }) {
  const text = escape(s.label);
  const optional = s.optional?.trim() ? ` <span class="canon-label-optional">${escape(s.optional.trim())}</span>` : "";
  const lines = [`${indent}<div class="canon-label">`];
  lines.push(forId
    ? `${indent}  <label class="canon-label-text" for="${forId}">${text}${optional}</label>`
    : `${indent}  <span class="canon-label-text" id="${labelId}">${text}${optional}</span>`);
  if (s.info?.trim()) {
    lines.push(`${indent}  <button type="button" class="canon-label-info" interestfor="${idBase}-info" aria-describedby="${idBase}-info">`);
    lines.push(`${indent}    <span class="canon-visually-hidden">About ${escape(s.label.toLowerCase())}</span>`);
    lines.push(`${indent}  </button>`);
    lines.push(`${indent}  <div class="canon-tooltip" id="${idBase}-info" popover="hint" role="tooltip" data-placement="block-end inline-end">${escape(s.info.trim())}</div>`);
  }
  if (s.description?.trim()) lines.push(`${indent}  <p class="canon-label-description" id="${idBase}-description">${escape(s.description.trim())}</p>`);
  lines.push(`${indent}</div>`);
  return lines;
}

export const describedByDescription = (s, idBase) => (s.description?.trim() ? [`${idBase}-description`] : []);
