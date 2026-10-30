/*
 * Stack, Cluster and Grid playground: the space between components.
 * Spec: docs/components/stack.md
 */

const NAMES = ["Invoices", "Customers", "Products", "Reports", "Integrations", "Settings", "Webhooks", "API keys"];

const card = (name) => `  <section class="canon-card">
    <header class="canon-card-header">
      <h3 class="canon-card-title">${name}</h3>
    </header>
  </section>`;
const tag = (name, index) => `  <span class="canon-tag" data-seed="${index * 3 + 1}"><span class="canon-tag-label">${name}</span></span>`;
const button = (name, end) => `  <button type="button" class="canon-button" data-intent="neutral"${end ? ` data-align="end"` : ""}><span class="canon-button-label">${name}</span></button>`;

export const controls = [
  { group: "Layout", name: "kind", label: "Container", type: "select", options: [["stack", "Stack (one under another)"], ["cluster", "Cluster (a row that wraps)"], ["grid", "Grid (columns)"]], default: "grid" },
  { group: "Layout", name: "gap", label: "data-gap", type: "select", options: [["", "(theme decides: md)"], "none", "sm", "md", "lg", "xl"], default: "" },
  { group: "Layout", name: "columns", label: "data-columns (at most)", type: "select", options: [["", "(as many as fit)"], "2", "3", "4", "5", "6"], default: "3", when: (s) => s.kind === "grid" },
  { group: "Layout", name: "min", label: "--canon-grid-min (empty: 16rem)", type: "text", default: "", when: (s) => s.kind === "grid" },
  { group: "Layout", name: "end", label: "Last item at the end (data-align=\"end\")", type: "checkbox", default: false, when: (s) => s.kind === "cluster" },

  { group: "Content", name: "content", label: "Children", type: "select", options: [["cards", "Cards"], ["tags", "Tags"], ["buttons", "Buttons"]], default: "cards" },
  { group: "Content", name: "count", label: "How many", type: "select", options: ["2", "3", "4", "5", "6", "8"], default: "5" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const attrs = [`class="canon-${s.kind}"`];
  if (s.gap) attrs.push(`data-gap="${s.gap}"`);
  if (s.kind === "grid" && s.columns) attrs.push(`data-columns="${s.columns}"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.kind === "grid" && s.min.trim()) attrs.push(`style="--canon-grid-min: ${s.min.trim()}"`);
  const names = NAMES.slice(0, Number(s.count));
  const children = names.map((name, index) => {
    if (s.content === "tags") return tag(name, index);
    if (s.content === "buttons") return button(name, s.kind === "cluster" && s.end && index === names.length - 1);
    return card(name);
  });
  return `<div ${attrs.join(" ")}>\n${children.join("\n")}\n</div>`;
}
