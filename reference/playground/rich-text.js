/*
 * Rich Text playground: a rich textarea in a Field, its tools chosen here.
 * Spec: docs/components/rich-text.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const tools = ["history", "block", "align", "marks", "link", "color", "clear", "script", "lists", "indent", "insert"];

/* The stage's width; the preview's frame narrows it further. */
export const width = "40rem";

export const controls = [
  { group: "Rich text", name: "label", label: "Label", type: "text", default: "Description" },
  ...tools.map((tool) => ({ group: "Tools (data-tools)", name: `tool-${tool}`, label: tool, type: "checkbox", default: ["history", "block", "marks", "link", "lists"].includes(tool) })),
  { group: "Height", name: "rows", label: "rows", type: "select", options: ["3", "6", "10"], default: "6" },
  { group: "Height", name: "maxLines", label: "data-max-lines", type: "select", options: [["", "(fixed)"], "12", "none"], default: "" },

  { group: "State", name: "required", label: "required", type: "checkbox" },
  { group: "State", name: "disabled", label: "disabled", type: "checkbox" },
  { group: "State", name: "readonly", label: "readonly", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-rich";
  const chosen = tools.filter((tool) => s[`tool-${tool}`]);
  const isDefault = chosen.join(" ") === "history block marks link lists";
  const field = [`class="canon-field"`];
  if (s.size) field.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") field.push(`dir="rtl"`);
  const box = [`class="canon-textarea"`, `data-rich`];
  if (!isDefault) box.push(`data-tools="${chosen.length === tools.length ? "all" : chosen.join(" ")}"`);
  const attrs = [`id="${id}"`, `name="description"`, `rows="${s.rows}"`, `placeholder="Write something…"`];
  if (s.maxLines) attrs.push(`data-max-lines="${s.maxLines}"`);
  for (const key of ["required", "disabled", "readonly"]) if (s[key]) attrs.push(key);
  return [
    `<div ${field.join(" ")}>`,
    `  <div class="canon-label"><label class="canon-label-text" for="${id}">${escape(s.label)}</label></div>`,
    `  <div ${box.join(" ")}>`,
    `    <textarea ${attrs.join(" ")}>&lt;p&gt;Some &lt;strong&gt;formatted&lt;/strong&gt; text.&lt;/p&gt;</textarea>`,
    `  </div>`,
    `</div>`,
  ].join("\n");
}
