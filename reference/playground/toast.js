/*
 * Toast playground: a toast in a <template>, and a Button showing it.
 * Spec: docs/components/toast.md
 */

export const controls = [
  { group: "Toast", name: "intent", label: "data-intent", type: "select", options: [["", "(none)"], "info", "success", "warning", "danger"], default: "success" },
  { group: "Toast", name: "emphasis", label: "data-emphasis", type: "select", options: [["", "(medium)"], ["high", "high (solid)"]], default: "" },
  { group: "Toast", name: "title", label: "Title", type: "text", default: "Invoice saved" },
  { group: "Toast", name: "description", label: "Description (empty: none)", type: "text", default: "INV-2041 is up to date." },
  { group: "Toast", name: "action", label: "Action (empty: none)", type: "text", default: "" },
  { group: "Toast", name: "timer", label: "data-timer (show it running out)", type: "checkbox", default: false },
  { group: "Toast", name: "duration", label: "data-duration", type: "select", options: [["", "(5s; 10s with an action)"], ["3000", "3000"], ["8000", "8000"], ["none", "none"]], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const attrs = [`class="canon-toast"`];
  if (s.intent) attrs.push(`data-intent="${s.intent}"`);
  if (s.emphasis) attrs.push(`data-emphasis="${s.emphasis}"`);
  if (s.duration) attrs.push(`data-duration="${s.duration}"`);
  if (s.timer && s.duration !== "none") attrs.push("data-timer");
  const lines = [
    `<template id="pg-toast">`,
    `  <div ${attrs.join(" ")}>`,
    `    <p class="canon-toast-title">${s.title.trim() || "Invoice saved"}</p>`,
  ];
  if (s.description.trim()) lines.push(`    <p class="canon-toast-description">${s.description.trim()}</p>`);
  if (s.action.trim()) lines.push(`    <div class="canon-toast-actions"><button type="button" class="canon-button" data-emphasis="high" data-intent="neutral" data-size="sm"><span class="canon-button-label">${s.action.trim()}</span></button></div>`);
  lines.push(
    `  </div>`,
    `</template>`,
    `<button type="button" class="canon-button" data-emphasis="high" commandfor="pg-toast" command="--canon-toast"><span class="canon-button-label">Show the toast</span></button>`,
  );
  return lines.join("\n");
}
