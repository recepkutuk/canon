/*
 * Fieldset playground: the group's own slots and hints, with any item type.
 * Spec: docs/components/fieldset.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* The stage's width; the preview's frame narrows it further. */
export const width = "24rem";

export const controls = [
  { group: "Items", name: "items", label: "Items", type: "select", options: [["checkbox", "checkboxes"], ["radio", "radios"], ["switch", "switches"], ["field", "fields (date of birth)"]], default: "checkbox" },

  { group: "Content", name: "legend", label: "Legend", type: "text", default: "Notify me about" },
  { group: "Content", name: "hint", label: "Hint", type: "text", default: "Select all that apply." },

  { group: "Message", name: "message", label: "Message", type: "select", options: [["", "(none)"], "danger", "warning", "success", ["live", "empty live region"]], default: "" },
  { group: "Message", name: "messageText", label: "Message text", type: "text", default: "Select at least one option.", when: (s) => s.message && s.message !== "live" },

  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },

  { group: "Hints", name: "orientation", label: "data-orientation", type: "select", options: [["", "(theme decides)"], "horizontal", "vertical"], default: "" },
  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const choiceLabels = ["Deployments", "Incidents", "Billing"];
const dateParts = [["day", "Day", 2], ["month", "Month", 2], ["year", "Year", 4]];

export function render(s) {
  const id = "pg-fieldset";
  const describedBy = [];
  if (s.hint) describedBy.push(`${id}-hint`);
  if (s.message) describedBy.push(`${id}-message`);
  const attrs = [`class="canon-fieldset"`];
  if (s.orientation) attrs.push(`data-orientation="${s.orientation}"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.disabled) attrs.push("disabled");
  if (describedBy.length) attrs.push(`aria-describedby="${describedBy.join(" ")}"`);

  const lines = [];
  lines.push(`<fieldset ${attrs.join(" ")}>`);
  lines.push(`  <legend class="canon-fieldset-legend">${escape(s.legend)}</legend>`);
  if (s.hint) lines.push(`  <p class="canon-fieldset-hint" id="${id}-hint">${escape(s.hint)}</p>`);

  if (s.items === "field") {
    for (const [part, label, size] of dateParts) {
      lines.push(`  <div class="canon-field">`);
      lines.push(`    <div class="canon-label">`);
      lines.push(`      <label class="canon-label-text" for="${id}-${part}">${label}</label>`);
      lines.push(`    </div>`);
      lines.push(`    <div class="canon-text-input">`);
      lines.push(`      <input id="${id}-${part}" name="${part}" type="text" inputmode="numeric" placeholder size="${size}" maxlength="${size}">`);
      lines.push(`    </div>`);
      lines.push(`  </div>`);
    }
  } else {
    choiceLabels.forEach((label, index) => {
      const itemId = `${id}-${index + 1}`;
      const type = s.items === "radio" ? "radio" : "checkbox";
      const role = s.items === "switch" ? ' role="switch"' : "";
      const checked = index === 0 ? " checked" : "";
      lines.push(`  <div class="canon-choice">`);
      lines.push(`    <input type="${type}"${role} id="${itemId}" name="${type === "radio" ? "choice" : "choices"}" value="${label.toLowerCase()}"${checked}>`);
      lines.push(`    <label class="canon-choice-label" for="${itemId}">${label}</label>`);
      lines.push(`  </div>`);
    });
  }

  if (s.message === "live") lines.push(`  <p class="canon-fieldset-message" id="${id}-message" aria-live="polite"></p>`);
  else if (s.message) lines.push(`  <p class="canon-fieldset-message" id="${id}-message" data-intent="${s.message}">${escape(s.messageText)}</p>`);
  lines.push(`</fieldset>`);
  return lines.join("\n");
}
