/*
 * Accordion playground: three items, every part and hint.
 * Spec: docs/components/accordion.md
 */

export const controls = [
  { group: "Behavior", name: "exclusive", label: "One at a time (name)", type: "checkbox", default: false },
  { group: "Behavior", name: "open", label: "First item open", type: "checkbox", default: true },

  { group: "Rows", name: "icon", label: "Leading icons", type: "checkbox", default: false },
  { group: "Rows", name: "description", label: "Descriptions", type: "checkbox", default: false },
  { group: "Rows", name: "end", label: "At the end", type: "select", options: [["", "(nothing)"], ["count", "a Count"], ["tag", "a Tag"], ["status", "a Status Indicator"]], default: "" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const items = [
  { title: "Company", description: "Globex Corporation · Springfield", icon: "building", count: "2", tag: "Verified", status: ["success", "Complete"], content: "Legal name, VAT number and address, as on the invoices." },
  { title: "Reminders", description: "Sent 3 and 10 days after the due date", icon: "mail", count: "3", tag: "On", status: ["info", "Scheduled"], content: "Three reminders were sent for invoices due this month." },
  { title: "Open invoices", description: "€12,400 outstanding", icon: "receipt", count: "5", tag: "Overdue", status: ["danger", "1 overdue"], content: "INV-2041 is 14 days past its due date." },
];

export function render(s) {
  const attrs = ['class="canon-accordion"'];
  if (s.size) attrs.push(`data-size="${s.size}"`);
  const lines = [`<div ${attrs.join(" ")}>`];
  items.forEach((item, index) => {
    const details = ['class="canon-accordion-item"'];
    if (s.exclusive) details.push('name="pg-accordion"');
    if (s.open && index === 0) details.push("open");
    lines.push(`  <details ${details.join(" ")}>`, `    <summary class="canon-accordion-summary">`);
    if (s.icon) lines.push(`      <span class="canon-icon" data-icon="${item.icon}" aria-hidden="true"></span>`);
    lines.push(`      <span class="canon-accordion-title">${item.title}</span>`);
    if (s.description) lines.push(`      <span class="canon-accordion-description">${item.description}</span>`);
    if (s.end === "count") lines.push(`      <span class="canon-count">${item.count}</span>`);
    if (s.end === "tag") lines.push(`      <span class="canon-tag" data-size="sm"><span class="canon-tag-label">${item.tag}</span></span>`);
    if (s.end === "status") lines.push(`      <span class="canon-status" data-intent="${item.status[0]}"><span class="canon-status-label">${item.status[1]}</span></span>`);
    lines.push(`    </summary>`, `    <div class="canon-accordion-content"><p>${item.content}</p></div>`, `  </details>`);
  });
  lines.push(`</div>`);
  return lines.join("\n");
}
