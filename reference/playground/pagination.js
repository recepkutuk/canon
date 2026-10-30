/*
 * Pagination playground: drawn by canon.js from the page count, or written
 * by hand; arrows, words, ends, table footer parts.
 * Spec: docs/components/pagination.md
 */

/* The arrow on the outer side: before Previous and First, after Next and Last. */
const arrow = (className, icon, label, href, rel) => {
  const glyph = `<span class="canon-icon" data-icon="${icon}" aria-hidden="true"></span>`;
  const words = `<span class="canon-pagination-label">${label}</span>`;
  const content = icon.endsWith("right") ? words + glyph : glyph + words;
  return `<li><a class="${className}"${href ? ` href="${href}"${rel ? ` rel="${rel}"` : ""}` : ` aria-disabled="true"`}>${content}</a></li>`;
};

/* The same window canon.js draws: siblings × 2 + 5 slots. */
const pageWindow = (page, pages, siblings) => {
  const slots = siblings * 2 + 5;
  const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  if (pages <= slots) return range(1, pages);
  if (page <= siblings + 3) return [...range(1, slots - 2), null, pages];
  if (page >= pages - siblings - 2) return [1, null, ...range(pages - slots + 3, pages)];
  return [1, null, ...range(page - siblings, page + siblings), null, pages];
};

export const controls = [
  { group: "Pagination", name: "mode", label: "Markup", type: "select", options: [["drawn", "Drawn by canon.js (data-pages)"], ["written", "Written links"]], default: "drawn" },
  { group: "Pagination", name: "pages", label: "Pages", type: "number", min: 1, max: 9999, default: 30 },
  { group: "Pagination", name: "page", label: "Current page", type: "number", min: 1, max: 9999, default: 2 },
  { group: "Pagination", name: "siblings", label: "Pages each side (data-siblings)", type: "number", min: 0, max: 3, default: 1 },
  { group: "Pagination", name: "ends", label: "First and Last (data-ends)", type: "checkbox", default: false },
  { group: "Pagination", name: "compact", label: "Compact: Page 2 of 30", type: "checkbox", default: false },
  { group: "Pagination", name: "links", label: "Links (data-href)", type: "checkbox", default: false },

  { group: "Table footer", name: "summary", label: "Summary (1–10 of 300)", type: "checkbox", default: false },
  { group: "Table footer", name: "perPage", label: "Rows per page select", type: "checkbox", default: false },
  { group: "Table footer", name: "jump", label: "Jump to page", type: "checkbox", default: false },

  { group: "Hints", name: "display", label: "data-display", type: "select", options: [["", "(theme decides)"], "icon", "label"], default: "" },
  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const pages = Math.max(1, Math.round(Number(s.pages) || 1));
  const page = Math.min(pages, Math.max(1, Math.round(Number(s.page) || 1)));
  const siblings = Math.max(0, Math.round(Number(s.siblings) || 0));
  const footer = s.summary || s.perPage;
  const attrs = [`class="canon-pagination"`, `aria-label="Pagination"`];
  if (s.mode === "drawn") {
    if (footer) attrs.push(`data-total="${pages * 10}"`, `data-per-page="10"`);
    else attrs.push(`data-pages="${pages}"`);
    attrs.push(`data-page="${page}"`);
    if (siblings !== 1) attrs.push(`data-siblings="${siblings}"`);
    if (s.ends) attrs.push(`data-ends`);
    if (s.compact) attrs.push(`data-layout="compact"`);
    if (s.links) attrs.push(`data-href="#page={page}"`);
  }
  if (s.display) attrs.push(`data-display="${s.display}"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);

  const lines = [`<nav ${attrs.join(" ")}>`];
  if (s.perPage) {
    lines.push(
      `  <div class="canon-pagination-size">`,
      `    <label for="pg-size">Rows per page</label>`,
      `    <div class="canon-select">`,
      `      <select id="pg-size"><option>10</option><option>25</option><option>50</option></select>`,
      `    </div>`,
      `  </div>`,
    );
  }
  if (s.summary) {
    const first = (page - 1) * 10 + 1;
    lines.push(s.mode === "drawn" ? `  <p class="canon-pagination-summary"></p>` : `  <p class="canon-pagination-summary">${first}–${first + 9} of ${pages * 10}</p>`);
  }
  if (s.mode === "written") {
    const href = (n) => `?page=${n}`;
    lines.push(`  <ol>`);
    if (s.ends) lines.push(`    ${arrow("canon-pagination-first", "chevrons-left", "First page", page > 1 && href(1))}`);
    lines.push(`    ${arrow("canon-pagination-prev", "chevron-left", "Previous", page > 1 && href(page - 1), "prev")}`);
    if (s.compact) lines.push(`    <li><span class="canon-pagination-current">Page ${page} of ${pages}</span></li>`);
    else {
      for (const n of pageWindow(page, pages, siblings)) {
        if (n === null) lines.push(`    <li class="canon-pagination-gap">…</li>`);
        else lines.push(`    <li><a href="${href(n)}" aria-label="Page ${n}"${n === page ? ` aria-current="page"` : ""}>${n}</a></li>`);
      }
    }
    lines.push(`    ${arrow("canon-pagination-next", "chevron-right", "Next", page < pages && href(page + 1), "next")}`);
    if (s.ends) lines.push(`    ${arrow("canon-pagination-last", "chevrons-right", "Last page", page < pages && href(pages))}`);
    lines.push(`  </ol>`);
  }
  if (s.jump) {
    lines.push(
      `  <form class="canon-pagination-jump">`,
      `    <label for="pg-jump">Go to page</label>`,
      `    <div class="canon-text-input"><input type="number" id="pg-jump" name="page" min="1" max="${pages}" inputmode="numeric"></div>`,
      `  </form>`,
    );
  }
  lines.push(`</nav>`);
  return lines.join("\n");
}
