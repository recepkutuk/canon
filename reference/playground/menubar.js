/*
 * Menubar playground: a bar of menus.
 * Spec: docs/components/menubar.md
 */

export const controls = [
  { group: "Menubar", name: "items", label: "Menus", type: "select", options: ["2", "3", "4"], default: "3" },
  { group: "Menubar", name: "disabled", label: "Last item disabled", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size (on a container)", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const menus = [
  ["File", [["New", "⌘N", "Meta+N"], ["Open…", "⌘O", "Meta+O"], null, ["Close", "⌘W", "Meta+W"]]],
  ["Edit", [["Undo", "⌘Z", "Meta+Z"], ["Redo", "⇧⌘Z", "Shift+Meta+Z"], null, ["Cut"], ["Copy"], ["Paste"]]],
  ["View", [["Zoom in", "⌘+", "Meta++"], ["Zoom out", "⌘−", "Meta+-"], null, ["Actual size"]]],
  ["Help", [["Documentation"], ["Keyboard shortcuts", "⌘/", "Meta+/"]]],
];

export function render(s) {
  const id = "pg-menubar";
  const used = menus.slice(0, Number(s.items));
  const attrs = [];
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  const lines = [`<div class="canon-menubar" role="menubar" aria-label="Main">`];
  used.forEach(([name], index) => {
    const key = name.toLowerCase();
    const off = s.disabled && index === used.length - 1 ? ` aria-disabled="true"` : "";
    lines.push(`  <button type="button" class="canon-menubar-item" id="${id}-${key}-item" role="menuitem" popovertarget="${id}-${key}" aria-haspopup="menu" aria-expanded="false"${off}>${name}</button>`);
  });
  lines.push(`</div>`);
  for (const [name, items] of used) {
    const key = name.toLowerCase();
    lines.push(`<div class="canon-menu" id="${id}-${key}" popover role="menu" aria-labelledby="${id}-${key}-item">`);
    for (const entry of items) {
      if (!entry) { lines.push(`  <hr class="canon-separator">`); continue; }
      const [label, kbd, keys] = entry;
      lines.push(`  <button type="button" class="canon-menu-item" role="menuitem"${keys ? ` aria-keyshortcuts="${keys}"` : ""}>`);
      lines.push(`    <span class="canon-menu-label">${label}</span>`);
      if (kbd) lines.push(`    <kbd class="canon-kbd" aria-hidden="true">${kbd}</kbd>`);
      lines.push(`  </button>`);
    }
    lines.push(`</div>`);
  }
  if (!attrs.length) return lines.join("\n");
  return [`<div ${attrs.join(" ")}>`, ...lines.map((line) => `  ${line}`), `</div>`].join("\n");
}
