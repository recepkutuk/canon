/*
 * Kbd playground: every parameter of the Kbd contract.
 * Spec: docs/components/kbd.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Content", name: "keys", label: "Keys", type: "text", default: "⌘K" },
  { group: "Content", name: "shortcut", label: "aria-keyshortcuts (button)", type: "text", default: "Meta+K", when: (s) => s.context === "button" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(sm; in a button, the button's size)"], "sm", "md", "lg"], default: "" },

  { group: "Context", name: "context", label: "Shown in", type: "select", options: [["text", "Running text"], ["button", "A button (accessory)"], ["tooltip", "A tooltip"]], default: "text" },
  { group: "Context", name: "emphasis", label: "Button data-emphasis", type: "select", options: [["", "(default: medium)"], "high", "medium", "low", "minimal"], default: "", when: (s) => s.context === "button" },
  { group: "Context", name: "intent", label: "Button data-intent", type: "select", options: [["", "(none: the accent)"], "neutral", "success", "warning", "danger"], default: "neutral", when: (s) => s.context === "button" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const size = s.size ? ` data-size="${s.size}"` : "";
  const keys = escape(s.keys);

  if (s.context === "button") {
    const attrs = ['type="button"', 'class="canon-button"'];
    if (s.emphasis) attrs.push(`data-emphasis="${s.emphasis}"`);
    if (s.intent) attrs.push(`data-intent="${s.intent}"`);
    if (s.size) attrs.push(`data-size="${s.size}"`);
    attrs.push(`aria-keyshortcuts="${escape(s.shortcut)}"`);
    return `<button ${attrs.join(" ")}>\n  <span class="canon-button-label">Search</span>\n  <kbd class="canon-kbd" aria-hidden="true">${keys}</kbd>\n</button>`;
  }

  if (s.context === "tooltip") {
    return `<button type="button" class="canon-button" data-display="icon" data-emphasis="minimal" data-intent="neutral" interestfor="pg-kbd-tip">
  <span class="canon-icon" data-icon="search" aria-hidden="true"></span>
  <span class="canon-button-label">Search</span>
</button>
<div class="canon-tooltip" id="pg-kbd-tip" popover="hint" role="tooltip"${size}>Search <kbd class="canon-kbd">${keys}</kbd></div>`;
  }

  return `<p>Press <kbd class="canon-kbd"${size}>${keys}</kbd> to search.</p>`;
}

/* Preview only: keep the tooltip open so changes show at once. */
export function enhance(stage, s) {
  if (s.context !== "tooltip") return;
  const tooltip = stage.querySelector(".canon-tooltip");
  if (tooltip && !tooltip.matches(":popover-open")) tooltip.showPopover({ source: stage.querySelector("[interestfor]") });
}
