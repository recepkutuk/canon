/*
 * Tooltip playground: every parameter of the Tooltip contract.
 * Spec: docs/components/tooltip.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const placements = ["block-start", "block-start inline-start", "block-start inline-end", "block-end", "block-end inline-start", "block-end inline-end", "inline-start", "inline-end"];
const icons = ["settings", "trash", "copy", "download", "star", "pin", "link", "search"];
const isIconTrigger = (s) => s.trigger !== "text";

export const controls = [
  { group: "Trigger", name: "trigger", label: "Trigger", type: "select", options: [["icon", "Icon-only button"], ["text", "Button with a label"], ["link", "Icon-only link"]], default: "icon" },
  { group: "Trigger", name: "icon", label: "Icon", type: "select", options: icons, default: "settings", when: isIconTrigger },
  { group: "Trigger", name: "name", label: "Trigger label", type: "text", default: "Settings" },
  { group: "Trigger", name: "ariaDisabled", label: "aria-disabled (explain why)", type: "checkbox", when: (s) => s.trigger !== "link" },

  { group: "Tooltip", name: "role", label: "It says", type: "select", options: [["label", "The trigger's label (no aria-describedby)"], ["description", "More than the label (aria-describedby)"]], default: "label" },
  { group: "Tooltip", name: "text", label: "Text", type: "text", default: "Workspace settings", when: (s) => s.role === "description" },

  { group: "Hints", name: "placement", label: "data-placement", type: "select", options: [["", "(theme decides)"], ...placements], default: "" },
  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides: sm)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "open", label: "Keep it open", type: "checkbox", default: true },
  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const id = "pg-tooltip";
  const describes = s.role === "description";
  const text = describes ? s.text : s.name;

  const attrs = [];
  const tag = s.trigger === "link" ? "a" : "button";
  if (tag === "a") attrs.push('href="#example"');
  else attrs.push('type="button"');
  attrs.push('class="canon-button"');
  if (isIconTrigger(s)) attrs.push('data-display="icon"', 'data-emphasis="minimal"', 'data-intent="neutral"');
  if (s.ariaDisabled && tag === "button") attrs.push('aria-disabled="true"');
  attrs.push(`interestfor="${id}"`);
  if (describes) attrs.push(`aria-describedby="${id}"`);

  const children = [];
  if (isIconTrigger(s)) children.push(`<span class="canon-icon" data-icon="${s.icon}" aria-hidden="true"></span>`);
  children.push(`<span class="canon-button-label">${escape(s.name)}</span>`);

  const tipAttrs = [`class="canon-tooltip"`, `id="${id}"`, 'popover="hint"', 'role="tooltip"'];
  if (s.placement) tipAttrs.push(`data-placement="${s.placement}"`);
  if (s.size) tipAttrs.push(`data-size="${s.size}"`);

  return `<${tag} ${attrs.join(" ")}>\n  ${children.join("\n  ")}\n</${tag}>\n<div ${tipAttrs.join(" ")}>${escape(text)}</div>`;
}

/* Preview only: open it against its trigger so changes show at once, and
   keep it open. A hint closes when people click elsewhere (the controls
   too) or leave the trigger, so here it is a manual popover, opened again
   whenever something closes it. The HTML keeps popover="hint". */
export function enhance(stage, s) {
  if (!s.open) return;
  const tooltip = stage.querySelector(".canon-tooltip");
  const trigger = stage.querySelector("[interestfor]");
  if (!tooltip) return;
  tooltip.popover = "manual";
  const open = () => {
    if (tooltip.isConnected && !tooltip.matches(":popover-open")) tooltip.showPopover({ source: trigger });
  };
  tooltip.addEventListener("toggle", (event) => {
    if (event.newState === "closed") requestAnimationFrame(open);
  });
  open();
}
