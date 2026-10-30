/*
 * Spinner playground: one spinner, alone or with words.
 * Spec: docs/components/spinner.md
 */

export const controls = [
  { group: "Spinner", name: "words", label: "Words (empty: aria-label only)", type: "text", default: "Loading invoices…" },
  { group: "Spinner", name: "name", label: "aria-label (without words)", type: "text", default: "Loading invoices", when: (s) => !s.words.trim() },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(the text's size)"], "sm", "md", "lg"], default: "" },
  { group: "Hints", name: "delay", label: "data-delay=\"none\" (shown at once)", type: "checkbox", default: false },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function render(s) {
  const hints = [];
  if (s.size) hints.push(`data-size="${s.size}"`);
  if (s.delay) hints.push('data-delay="none"');
  const words = s.words.trim();
  if (words) {
    return [
      `<label class="canon-spinner-label"${hints.length ? ` ${hints.join(" ")}` : ""}>`,
      `  <progress class="canon-spinner"></progress>`,
      `  ${escape(words)}`,
      `</label>`,
    ].join("\n");
  }
  return `<progress class="canon-spinner" aria-label="${escape(s.name.trim() || "Loading")}"${hints.length ? ` ${hints.join(" ")}` : ""}></progress>`;
}
