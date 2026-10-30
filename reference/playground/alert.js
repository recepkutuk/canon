/*
 * Alert playground: one alert, every part and hint.
 * Spec: docs/components/alert.md
 */

export const controls = [
  { group: "Meaning", name: "intent", label: "data-intent", type: "select", options: [["", "(none: a plain note)"], "info", "success", "warning", "danger"], default: "warning" },
  { group: "Meaning", name: "emphasis", label: "data-emphasis", type: "select", options: [["", "(medium)"], ["high", "high (solid)"]], default: "" },

  { group: "Content", name: "title", label: "Title (empty: none)", type: "text", default: "This invoice is overdue" },
  { group: "Content", name: "heading", label: "Title as a heading (<h3>)", type: "checkbox", default: false },
  { group: "Content", name: "description", label: "Description (empty: none)", type: "text", default: "It was due on 3 October. Globex hasn't paid yet." },
  { group: "Content", name: "action", label: "Action (empty: none)", type: "text", default: "Send reminder" },
  { group: "Content", name: "close", label: "Close button (dismissible)", type: "checkbox", default: false },

  { group: "Accessibility", name: "role", label: "role (shown while the page is open)", type: "select", options: [["", "(none: there from the start)"], ["status", "status (polite)"], ["alert", "alert (urgent)"]], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function render(s) {
  const attrs = ['class="canon-alert"'];
  if (s.intent) attrs.push(`data-intent="${s.intent}"`);
  if (s.emphasis) attrs.push(`data-emphasis="${s.emphasis}"`);
  if (s.role) attrs.push(`role="${s.role}"`);

  const title = s.title.trim();
  const description = s.description.trim();
  const lines = [`<div ${attrs.join(" ")}>`];
  if (title || !description) {
    const tag = s.heading ? "h3" : "p";
    lines.push(`  <${tag} class="canon-alert-title">${escape(title || "This invoice is overdue")}</${tag}>`);
  }
  if (description) lines.push(`  <p class="canon-alert-description">${escape(description)}</p>`);
  if (s.action.trim()) {
    lines.push(
      `  <div class="canon-alert-actions">`,
      `    <button type="button" class="canon-button" data-emphasis="high" data-intent="neutral" data-size="sm"><span class="canon-button-label">${escape(s.action.trim())}</span></button>`,
      `  </div>`,
    );
  }
  if (s.close) lines.push(`  <button type="button" class="canon-alert-close"></button>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
