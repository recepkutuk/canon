/*
 * Avatar Group playground: every parameter of the Avatar Group contract.
 * Spec: docs/components/avatar-group.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const people = [
  ["Ada Lovelace", "AL"], ["Grace Hopper", "GH"], ["Alan Turing", "AT"], ["Katherine Johnson", "KJ"],
  ["Linus Torvalds", "LT"], ["Margaret Hamilton", "MH"], ["Dennis Ritchie", "DR"], ["Barbara Liskov", "BL"],
];

export const controls = [
  { group: "Group", name: "label", label: "aria-label", type: "text", default: "Project members" },
  { group: "Group", name: "count", label: "Avatars shown", type: "number", min: 1, max: 8, default: 5 },
  { group: "Group", name: "rest", label: "The rest (0: none)", type: "number", min: 0, max: 99, default: 5 },
  { group: "Group", name: "content", label: "Avatars show", type: "select", options: [["photos", "Photos"], ["initials", "Initials"], ["mixed", "Mixed"]], default: "photos" },
  { group: "Group", name: "element", label: "Each avatar is", type: "select", options: [["span", "<span>: just shows"], ["a", "<a>: profile link"]], default: "span" },
  { group: "Group", name: "status", label: "First avatar online", type: "checkbox" },

  { group: "Spotlight", name: "spotlight", label: "data-spotlight", type: "checkbox" },
  { group: "Spotlight", name: "restTip", label: "The rest's own tooltip (their names)", type: "checkbox", default: true, when: (s) => s.spotlight && Number(s.rest) > 0 },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "xs", "sm", "md", "lg", "xl", "2xl"], default: "" },
  { group: "Hints", name: "density", label: "data-density", type: "select", options: [["", "(compact; spacious when the avatars are links or buttons)"], "compact", "comfortable", "spacious"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const count = Math.max(1, Math.min(8, Number(s.count) || 1));
  const rest = Math.max(0, Number(s.rest) || 0);
  const size = s.size ? ` data-size="${s.size}"` : "";
  const density = s.density ? ` data-density="${s.density}"` : "";
  const spotlight = s.spotlight ? " data-spotlight" : "";
  const restTip = s.spotlight && s.restTip;
  const items = [];
  for (let i = 0; i < count; i++) {
    const [name, initials] = people[i];
    const photo = s.content === "photos" || (s.content === "mixed" && i % 2 === 0);
    const tag = s.element;
    const href = tag === "a" ? ` href="#person-${i}"` : "";
    const children = [];
    if (photo) children.push('<img class="canon-avatar-image" src="assets/avatar-photo.jpg" alt="">');
    children.push(`<span class="canon-avatar-fallback" role="img" aria-label="${name}">${initials}</span>`);
    if (s.status && i === 0) children.push('<span class="canon-avatar-status" data-status="online"><span class="canon-visually-hidden">Online</span></span>');
    items.push(`  <${tag}${href} class="canon-avatar" data-seed="${i}">\n    ${children.join("\n    ")}\n  </${tag}>`);
  }
  if (rest) {
    const tag = s.element === "a" ? "button" : "span";
    const attrs = tag === "button" ? ' type="button" aria-haspopup="dialog"' : "";
    const tip = restTip ? ' interestfor="pg-rest-tip"' : "";
    items.push(`  <${tag}${attrs} class="canon-avatar"${tip}>\n    <span class="canon-avatar-fallback" role="img" aria-label="${rest} more">${rest}+</span>\n  </${tag}>`);
  }
  const group = `<div class="canon-avatar-group" role="group" aria-label="${escape(s.label)}"${size}${density}${spotlight}>\n${items.join("\n")}\n</div>`;
  if (!rest || !restTip) return group;
  /* The rest's names: those not shown, then how many more. */
  const hidden = people.slice(count, count + rest).map(([name]) => name);
  const more = rest - hidden.length;
  const names = more > 0 ? `${hidden.join(", ")}${hidden.length ? " and " : ""}${more} more` : hidden.join(", ");
  return `${group}\n<div class="canon-tooltip" id="pg-rest-tip" popover="hint" role="tooltip">${names}</div>`;
}
