/*
 * Button playground: every parameter of the Button contract.
 * Spec: docs/components/button.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const icons = [["", "(none)"], "plus", "arrow-forward", "arrow-back", "download", "trash", "settings", "star", "pin", "refresh", "more", "copy", "search", "mail"];
const isButton = (s) => s.element === "button";
const isLink = (s) => s.element === "a";

export const controls = [
  { group: "Element", name: "element", label: "Element", type: "select", options: [["button", "<button>: does something"], ["a", "<a>: goes somewhere"]], default: "button" },
  { group: "Element", name: "type", label: "type", type: "select", options: ["button", "submit", "reset"], default: "button", when: isButton },
  { group: "Element", name: "external", label: "Opens in a new tab", type: "checkbox", when: isLink },
  { group: "Element", name: "current", label: "Current page (aria-current)", type: "checkbox", when: isLink },

  { group: "Meaning", name: "emphasis", label: "data-emphasis", type: "select", options: [["", "(default: medium)"], "high", "medium", "low", "minimal"], default: "" },
  { group: "Meaning", name: "intent", label: "data-intent", type: "select", options: [["", "(none: the accent)"], "neutral", "success", "warning", "danger"], default: "" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },
  { group: "Hints", name: "display", label: "data-display", type: "select", options: [["", "(theme decides)"], ["icon", "icon (label hidden)"]], default: "" },

  { group: "Content", name: "label", label: "Label", type: "text", default: "Save changes" },
  { group: "Content", name: "leading", label: "Leading icon", type: "select", options: icons, default: "" },
  { group: "Content", name: "trailing", label: "Trailing icon", type: "select", options: icons, default: "" },

  { group: "State", name: "disabled", label: "disabled", type: "checkbox", when: isButton },
  { group: "State", name: "ariaDisabled", label: "aria-disabled (stays focusable)", type: "checkbox" },
  { group: "State", name: "busy", label: "Loading (aria-busy)", type: "checkbox", when: isButton },
  { group: "State", name: "pressed", label: "Toggle (aria-pressed)", type: "select", options: [["", "not a toggle"], ["false", "not pressed"], ["true", "pressed"]], default: "", when: isButton },
  { group: "State", name: "menu", label: "Opens a menu (click it: aria-expanded follows)", type: "checkbox", when: isButton },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

const icon = (name) => `<span class="canon-icon" data-icon="${name}" aria-hidden="true"></span>`;

export function render(s) {
  const attrs = [];
  const tag = isLink(s) ? "a" : "button";

  if (isLink(s)) {
    if (s.ariaDisabled) attrs.push('role="link"', 'aria-disabled="true"');
    else attrs.push('href="#example"');
    if (s.external && !s.ariaDisabled) attrs.push('target="_blank"', 'rel="noopener"');
  } else {
    attrs.push(`type="${s.type}"`);
  }

  attrs.push('class="canon-button"');
  if (s.emphasis) attrs.push(`data-emphasis="${s.emphasis}"`);
  if (s.intent) attrs.push(`data-intent="${s.intent}"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.display) attrs.push(`data-display="${s.display}"`);

  if (isButton(s)) {
    if (s.disabled) attrs.push("disabled");
    if (s.busy) attrs.push('aria-busy="true"');
    if (s.ariaDisabled || s.busy) attrs.push('aria-disabled="true"');
    if (s.pressed) attrs.push(`aria-pressed="${s.pressed}"`);
    if (s.menu) attrs.splice(1, 0, 'id="pg-button"', 'popovertarget="pg-menu"', 'aria-haspopup="menu"', 'aria-expanded="false"');
  }
  if (isLink(s) && s.current && !s.ariaDisabled) attrs.push('aria-current="page"');

  const children = [];
  if (s.leading) children.push(icon(s.leading));
  children.push(`<span class="canon-button-label">${escape(s.label)}</span>`);
  if (s.trailing) children.push(icon(s.trailing));

  const button = `<${tag} ${attrs.join(" ")}>\n  ${children.join("\n  ")}\n</${tag}>`;
  if (!(isButton(s) && s.menu)) return button;
  /* The menu it opens (a button that opens a menu names it). */
  return `${button}
<div class="canon-menu" id="pg-menu" popover role="menu" aria-labelledby="pg-button">
  <button type="button" class="canon-menu-item" role="menuitem"><span class="canon-menu-label">Save as draft</span></button>
  <button type="button" class="canon-menu-item" role="menuitem"><span class="canon-menu-label">Save and publish</span></button>
</div>`;
}
