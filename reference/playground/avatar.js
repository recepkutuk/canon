/*
 * Avatar playground: every parameter of the Avatar contract.
 * Spec: docs/components/avatar.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const controls = [
  { group: "Person", name: "name", label: "Name", type: "text", default: "Ada Lovelace" },
  { group: "Person", name: "content", label: "Shows", type: "select", options: [["photo", "Photo"], ["broken", "Photo that fails to load"], ["initials", "Initials"], ["icon", "Icon (empty fallback)"]], default: "photo" },
  { group: "Person", name: "initials", label: "Initials", type: "text", default: "AL", when: (s) => s.content !== "icon" },
  { group: "Person", name: "seed", label: "data-seed", type: "text", default: "0" },
  { group: "Person", name: "kind", label: "data-kind", type: "select", options: [["", "(person)"], "team", "bot"], default: "" },
  { group: "Person", name: "decorative", label: "Name written beside it (decorative)", type: "checkbox" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "xs", "sm", "md", "lg", "xl", "2xl"], default: "" },

  { group: "Extras", name: "corner", label: "Bottom-end", type: "select", options: [["", "(nothing)"], ["status", "Status"], ["badge", "Badge"]], default: "status" },
  { group: "Extras", name: "status", label: "data-status", type: "select", options: ["online", "away", "busy", "offline"], default: "online", when: (s) => s.corner === "status" },
  { group: "Extras", name: "badgeIcon", label: "Badge icon", type: "select", options: ["circle-check", "star", "pin", "info", "mail", "settings", "tag", "link", "globe", "eye", "search", "plus", "more"], default: "circle-check", when: (s) => s.corner === "badge" },
  { group: "Extras", name: "badge", label: "Badge meaning", type: "text", default: "Verified", when: (s) => s.corner === "badge" },
  { group: "Extras", name: "intent", label: "Badge data-intent", type: "select", options: [["", "(theme decides)"], "info", "success", "warning", "danger"], default: "", when: (s) => s.corner === "badge" },
  { group: "Extras", name: "count", label: "Count (empty: none)", type: "text", default: "3" },

  { group: "Spotlight", name: "spotlight", label: "data-spotlight", type: "checkbox" },
  { group: "Spotlight", name: "tip", label: "Own tooltip (empty: the name)", type: "text", default: "", when: (s) => s.spotlight && !s.decorative },

  { group: "Element", name: "element", label: "Element", type: "select", options: [["span", "<span>: just shows"], ["a", "<a>: profile link"], ["button", "<button>: account menu"]], default: "span" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const tag = s.element;
  const attrs = [];
  if (tag === "a") attrs.push('href="#profile"');
  if (tag === "button") attrs.push('type="button"', 'aria-haspopup="menu"', 'aria-expanded="false"');
  attrs.push('class="canon-avatar"');
  if (s.seed.trim()) attrs.push(`data-seed="${escape(s.seed.trim())}"`);
  if (s.kind) attrs.push(`data-kind="${s.kind}"`);
  if (s.size) attrs.push(`data-size="${s.size}"`);
  const ownTip = s.spotlight && !s.decorative && s.tip.trim();
  if (s.spotlight) attrs.push("data-spotlight");
  if (ownTip) attrs.push('interestfor="pg-avatar-tip"');

  const children = [];
  if (s.content === "photo") children.push('<img class="canon-avatar-image" src="assets/avatar-photo.jpg" alt="">');
  if (s.content === "broken") children.push('<img class="canon-avatar-image" src="assets/missing.jpg" alt="">');
  const initials = s.content === "icon" ? "" : escape(s.initials);
  children.push(s.decorative
    ? `<span class="canon-avatar-fallback" aria-hidden="true">${initials}</span>`
    : `<span class="canon-avatar-fallback" role="img" aria-label="${escape(s.name)}">${initials}</span>`);
  if (s.corner === "status") {
    const text = s.status[0].toUpperCase() + s.status.slice(1);
    children.push(`<span class="canon-avatar-status" data-status="${s.status}"><span class="canon-visually-hidden">${text}</span></span>`);
  }
  if (s.corner === "badge") {
    const intent = s.intent ? ` data-intent="${s.intent}"` : "";
    children.push(`<span class="canon-avatar-badge"${intent}><span class="canon-icon" data-icon="${s.badgeIcon}" aria-hidden="true"></span><span class="canon-visually-hidden">${escape(s.badge)}</span></span>`);
  }
  if (s.count.trim()) children.push(`<span class="canon-count">${escape(s.count.trim())}<span class="canon-visually-hidden"> unread</span></span>`);

  const avatar = `<${tag} ${attrs.join(" ")}>\n  ${children.join("\n  ")}\n</${tag}>`
    + (ownTip ? `\n<div class="canon-tooltip" id="pg-avatar-tip" popover="hint" role="tooltip">${escape(s.tip.trim())}</div>` : "");
  return s.decorative ? `${avatar}\n<span>${escape(s.name)}</span>` : avatar;
}
