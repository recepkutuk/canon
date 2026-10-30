/*
 * Empty State playground: icon, title, description, actions, intent.
 * Spec: docs/components/empty-state.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Empty State", name: "icon", label: "Icon", type: "select", options: [["", "(none)"], ["table", "table"], ["search-x", "search-x"], ["circle-alert", "circle-alert"]], default: "table" },
  { group: "Empty State", name: "title", label: "Title", type: "text", default: "No users yet" },
  { group: "Empty State", name: "description", label: "Description", type: "text", default: "People you invite will show up here." },
  { group: "Empty State", name: "action", label: "Action (empty: none)", type: "text", default: "Invite people" },
  { group: "Empty State", name: "intent", label: "data-intent", type: "select", options: [["", "(none)"], "danger"], default: "" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const attrs = [`class="canon-empty-state"`];
  if (s.intent) attrs.push(`data-intent="${s.intent}"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const lines = [`<div ${attrs.join(" ")}>`];
  if (s.icon) lines.push(`  <span class="canon-empty-state-icon" aria-hidden="true"><span class="canon-icon" data-icon="${s.icon}" aria-hidden="true"></span></span>`);
  lines.push(`  <h3 class="canon-empty-state-title">${escape(s.title)}</h3>`);
  if (s.description) lines.push(`  <p class="canon-empty-state-description">${escape(s.description)}</p>`);
  if (s.action) {
    lines.push(`  <div class="canon-empty-state-actions">`, `    <button type="button" class="canon-button"${s.intent ? "" : ` data-emphasis="high"`}><span class="canon-button-label">${escape(s.action)}</span></button>`, `  </div>`);
  }
  lines.push(`</div>`);
  return lines.join("\n");
}
