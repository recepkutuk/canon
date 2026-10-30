/*
 * Breadcrumb playground: a trail with an optional home icon and collapsed pages.
 * Spec: docs/components/breadcrumb.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Breadcrumb", name: "home", label: "Home icon first", type: "checkbox", default: true },
  { group: "Breadcrumb", name: "collapse", label: "Collapse the middle (menu)", type: "checkbox", default: true },
  { group: "Breadcrumb", name: "pages", label: "Pages (comma-separated)", type: "text", default: "Docs, Design system, Components" },
  { group: "Breadcrumb", name: "current", label: "Current page", type: "text", default: "Breadcrumb" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const pages = s.pages.split(",").map((page) => page.trim()).filter(Boolean);
  const hidden = s.collapse && pages.length > 1 ? pages.slice(0, -1) : [];
  const shown = s.collapse && pages.length > 1 ? pages.slice(-1) : pages;
  const attrs = [`class="canon-breadcrumb"`, `aria-label="Breadcrumb"`];
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const lines = [`<nav ${attrs.join(" ")}>`, `  <ol>`];
  if (s.home) lines.push(`    <li><a href="/"><span class="canon-icon" data-icon="house" aria-hidden="true"></span><span class="canon-visually-hidden">Home</span></a></li>`);
  if (hidden.length) {
    lines.push(
      `    <li>`,
      `      <button type="button" class="canon-breadcrumb-more" popovertarget="pg-bc-more" aria-haspopup="menu" aria-expanded="false">`,
      `        <span class="canon-icon" data-icon="more" aria-hidden="true"></span>`,
      `        <span class="canon-visually-hidden">More pages</span>`,
      `      </button>`,
      `      <div class="canon-menu" id="pg-bc-more" popover role="menu" aria-label="More pages">`,
      ...hidden.map((page) => `        <a class="canon-menu-item" role="menuitem" href="#"><span class="canon-menu-label">${escape(page)}</span></a>`),
      `      </div>`,
      `    </li>`,
    );
  }
  for (const page of shown) lines.push(`    <li><a href="#">${escape(page)}</a></li>`);
  lines.push(`    <li><a href="#" aria-current="page">${escape(s.current)}</a></li>`, `  </ol>`, `</nav>`);
  return lines.join("\n");
}
