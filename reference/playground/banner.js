/*
 * Banner playground: one banner, every part and hint.
 * Spec: docs/components/banner.md
 */

export const controls = [
  { group: "Meaning", name: "intent", label: "data-intent", type: "select", options: [["", "(none: plain news)"], "info", "success", "warning", "danger"], default: "warning" },
  { group: "Meaning", name: "emphasis", label: "data-emphasis", type: "select", options: [["", "(medium)"], ["high", "high (solid)"]], default: "" },

  { group: "Content", name: "title", label: "Title (empty: none)", type: "text", default: "Maintenance tonight, 22:00–23:00" },
  { group: "Content", name: "description", label: "Description (empty: none)", type: "text", default: "Invoices can't be sent during that hour." },
  { group: "Content", name: "action", label: "Action", type: "select", options: [["", "(none)"], ["link", "a Link"], ["button", "a Button"]], default: "link" },
  { group: "Content", name: "close", label: "Close button (dismissible)", type: "checkbox", default: false },

  { group: "Accessibility", name: "role", label: "role (shown while the page is open)", type: "select", options: [["", "(none: there from the start)"], ["status", "status (polite)"], ["alert", "alert (urgent)"]], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function render(s) {
  const attrs = ['class="canon-banner"'];
  if (s.intent) attrs.push(`data-intent="${s.intent}"`);
  if (s.emphasis) attrs.push(`data-emphasis="${s.emphasis}"`);
  if (s.role) attrs.push(`role="${s.role}"`);
  const title = s.title.trim();
  const description = s.description.trim();
  const lines = [`<div ${attrs.join(" ")}>`];
  if (title || !description) lines.push(`  <p class="canon-banner-title">${escape(title || "Maintenance tonight, 22:00–23:00")}</p>`);
  if (description) lines.push(`  <p class="canon-banner-description">${escape(description)}</p>`);
  if (s.action === "link") lines.push(`  <div class="canon-banner-actions"><a class="canon-link" href="#banner">Details</a></div>`);
  if (s.action === "button") lines.push(`  <div class="canon-banner-actions"><button type="button" class="canon-button" data-emphasis="high" data-intent="neutral" data-size="sm"><span class="canon-button-label">Details</span></button></div>`);
  if (s.close) lines.push(`  <button type="button" class="canon-banner-close"></button>`);
  lines.push(`</div>`);
  return lines.join("\n");
}
