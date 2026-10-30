/*
 * Skeleton playground: a shape standing in for content while it loads.
 * Spec: docs/components/skeleton.md
 */

export const controls = [
  { group: "Skeleton", name: "shape", label: "data-shape", type: "select", options: [["", "(a line of text)"], "block", "circle", "square"], default: "" },
  { group: "Skeleton", name: "length", label: "Line length (%)", type: "number", min: 10, max: 100, default: 60 },

  { group: "Skeleton", name: "sweep", label: 'data-motion="sweep"', type: "checkbox", default: false },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },
];

export function render(s) {
  const attrs = [`class="canon-skeleton"`];
  if (s.shape) attrs.push(`data-shape="${s.shape}"`);
  if (s.sweep) attrs.push(`data-motion="sweep"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  attrs.push(`aria-hidden="true"`);
  const length = Math.max(10, Math.min(100, Math.round(Number(s.length) || 60)));
  if (!s.shape) attrs.push(`style="inline-size: ${length}%"`);
  return [`<div aria-busy="true" aria-label="Loading" style="inline-size: 20rem">`, `  <span ${attrs.join(" ")}></span>`, `</div>`].join("\n");
}
