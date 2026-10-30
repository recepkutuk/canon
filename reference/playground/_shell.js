/*
 * Shared markup for the Sidebar, Top Bar and App Shell playgrounds:
 * a dashboard's sidebar and top bar.
 */

const icon = (name) => `<span class="canon-icon" data-icon="${name}" aria-hidden="true"></span>`;

export const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#3b82f6" fill-rule="evenodd" d="M16 32c8.84 0 16-7.16 16-16S24.84 0 16 0 0 7.16 0 16s7.16 16 16 16Zm4.99-24.55c.24-.86-.59-1.37-1.36-.83L8.95 14.23c-.83.59-.7 1.77.2 1.77h2.81v-.02h5.48l-4.46 1.57-1.97 7c-.24.86.59 1.37 1.36.83l10.68-7.61c.83-.59.7-1.77-.2-1.77h-4.26l2.4-8.55Z"/></svg>`;

const ITEMS = [
  ["dashboard", "gauge", "Dashboard"],
  ["calendar", "calendar", "Calendar"],
  ["scrumboard", "square-kanban", "Scrumboard", [["project-kanban", "Project Kanban"], ["sales-pipeline", "Sales Pipeline"]]],
  ["companies", "building", "Companies"],
  ["contacts", "book-user", "Contacts"],
  ["quotes", "inbox", "Quotes"],
  ["administration", "crown", "Administration", [["members", "Members"], ["billing", "Billing"]]],
];

export const toggle = (expanded) =>
  `<button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" commandfor="pg-sidebar" command="--canon-toggle-sidebar" aria-controls="pg-sidebar" aria-expanded="${expanded}">${icon("panel-left-close")}<span class="canon-button-label">Sidebar</span></button>`;

export function sidebar({ rail = false, current = "dashboard", sections = true, footer = false, tag = false, size = "", headerToggle = true, pad = "" }) {
  const attrs = [`class="canon-sidebar"`, `id="pg-sidebar"`];
  if (rail) attrs.push(`data-display="icon"`);
  if (size) attrs.push(`data-size="${size}"`);
  /* An optional Tag after a label ("New"), as in a Nav List. */
  const tagged = (key) => tag && key === "quotes" ? `<span class="canon-tag" data-intent="info"><span class="canon-tag-label">New</span></span>` : "";
  const item = (key, ic, text) =>
    `${pad}      <li><a class="canon-nav-list-item" href="#${key}"${current === key ? ` aria-current="page"` : ""} interestfor="pg-tip-${key}">${icon(ic)}<span class="canon-nav-list-label">${text}</span>${tagged(key)}</a><div class="canon-tooltip" id="pg-tip-${key}" data-placement="inline-end" popover="hint" role="tooltip">${text}</div></li>`;
  const lines = [
    `${pad}<div ${attrs.join(" ")}>`,
    `${pad}  <div class="canon-sidebar-header">`,
    `${pad}    <a class="canon-sidebar-brand" href="#home">${LOGO}<span class="canon-sidebar-brand-name">Globex Corporation</span></a>`,
  ];
  if (headerToggle) lines.push(`${pad}    ${toggle(!rail)}`);
  lines.push(`${pad}  </div>`, `${pad}  <div class="canon-sidebar-body">`);
  const body = lines.length;
  lines.push(`${pad}  <nav class="canon-nav-list" aria-label="Main">`, `${pad}    <ul>`);
  for (const [key, ic, text, subs] of ITEMS) {
    if (!subs) { lines.push(item(key, ic, text)); continue; }
    if (!sections) continue;
    lines.push(
      `${pad}      <li>`,
      `${pad}        <details class="canon-nav-list-section">`,
      `${pad}          <summary class="canon-nav-list-item">${icon(ic)}<span class="canon-nav-list-label">${text}</span></summary>`,
      `${pad}          <ul>`,
      ...subs.map(([sub, label]) => `${pad}            <li><a class="canon-nav-list-item" href="#${sub}"${current === sub ? ` aria-current="page"` : ""}><span class="canon-nav-list-label">${label}</span></a></li>`),
      `${pad}          </ul>`,
      `${pad}        </details>`,
      `${pad}      </li>`,
    );
  }
  lines.push(`${pad}    </ul>`, `${pad}  </nav>`);
  /* The body's lines one step in. */
  for (let i = body; i < lines.length; i++) lines[i] = lines[i].replace(pad, `${pad}  `);
  lines.push(`${pad}  </div>`);
  if (footer) lines.push(
    `${pad}  <div class="canon-sidebar-footer">`,
    `${pad}    <nav class="canon-nav-list" aria-label="Help and settings">`,
    `${pad}      <ul>`,
    item("help", "info", "Help").replace(/^/, "  "),
    item("settings", "settings", "Settings").replace(/^/, "  "),
    `${pad}      </ul>`,
    `${pad}    </nav>`,
    `${pad}  </div>`,
  );
  lines.push(`${pad}</div>`);
  return lines.join("\n");
}

export function topBar({ start = "search", sidebarToggle = null, help = false, theme = true, notifications = true, count = "3", account = true, size = "", pad = "" }) {
  const lines = [`${pad}<header class="canon-top-bar"${size ? ` data-size="${size}"` : ""}>`, `${pad}  <div class="canon-top-bar-start">`];
  if (sidebarToggle !== null) lines.push(`${pad}    ${toggle(sidebarToggle)}`);
  if (start === "search") lines.push(`${pad}    <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" commandfor="pg-palette" command="show-modal" aria-keyshortcuts="Meta+K Control+K">${icon("search")}<span class="canon-button-label">Search</span><kbd class="canon-kbd" aria-hidden="true">⌘K</kbd></button>`);
  lines.push(`${pad}  </div>`, `${pad}  <div class="canon-top-bar-end">`);
  if (help) lines.push(
    `${pad}    <button type="button" class="canon-button" data-emphasis="medium" data-intent="neutral" data-display="icon" popovertarget="pg-help-menu" aria-haspopup="menu" aria-expanded="false">${icon("circle-help")}<span class="canon-button-label">Help</span></button>`,
    `${pad}    <div class="canon-menu" id="pg-help-menu" popover role="menu" aria-label="Help">`,
    `${pad}      <a class="canon-menu-item" role="menuitem" href="#docs"><span class="canon-menu-label">Documentation</span></a>`,
    `${pad}      <a class="canon-menu-item" role="menuitem" href="#shortcuts"><span class="canon-menu-label">Keyboard shortcuts</span></a>`,
    `${pad}      <a class="canon-menu-item" role="menuitem" href="#whats-new"><span class="canon-menu-label">What's new</span></a>`,
    `${pad}    </div>`,
  );
  if (theme) lines.push(`${pad}    <button type="button" class="canon-button" data-emphasis="medium" data-intent="neutral" data-display="icon" aria-pressed="false">${icon("moon")}<span class="canon-button-label">Dark mode</span></button>`);
  if (notifications) lines.push(`${pad}    <button type="button" class="canon-button" data-emphasis="medium" data-intent="neutral" data-display="icon">${icon("bell")}<span class="canon-button-label">Notifications</span>${count ? `<span class="canon-count">${count}<span class="canon-visually-hidden"> unread</span></span>` : ""}</button>`);
  if (account) lines.push(
    `${pad}    <button type="button" class="canon-avatar" id="pg-account" popovertarget="pg-account-menu" aria-haspopup="menu" aria-expanded="false" data-seed="1">`,
    `${pad}      <img class="canon-avatar-image" src="assets/avatar-photo.jpg" alt="">`,
    `${pad}      <span class="canon-avatar-fallback" role="img" aria-label="Your account, Ada Lovelace">AL</span>`,
    `${pad}    </button>`,
    `${pad}    <div class="canon-menu" id="pg-account-menu" popover role="menu" aria-labelledby="pg-account">`,
    `${pad}      <button type="button" class="canon-menu-item" role="menuitem">${icon("user")}<span class="canon-menu-label">Profile</span></button>`,
    `${pad}      <button type="button" class="canon-menu-item" role="menuitem">${icon("settings")}<span class="canon-menu-label">Settings</span></button>`,
    `${pad}      <button type="button" class="canon-menu-item" role="menuitem">${icon("log-out")}<span class="canon-menu-label">Sign out</span></button>`,
    `${pad}    </div>`,
  );
  lines.push(`${pad}  </div>`, `${pad}</header>`);
  return lines.join("\n");
}

export function palette(pad = "") {
  return [
    `${pad}<dialog class="canon-command-palette" id="pg-palette" aria-label="Command palette">`,
    `${pad}  <div class="canon-command-search">${icon("search")}<input type="search" aria-label="Search pages" placeholder="Search pages"></div>`,
    `${pad}  <div class="canon-command-list">`,
    `${pad}    <div class="canon-command-group" aria-labelledby="pg-palette-pages">`,
    `${pad}      <p class="canon-command-heading" id="pg-palette-pages">Pages</p>`,
    ...ITEMS.map(([key, ic, text]) => `${pad}      <a class="canon-command-item" href="#${key}">${icon(ic)}<span class="canon-command-label">${text}</span></a>`),
    `${pad}    </div>`,
    `${pad}  </div>`,
    `${pad}</dialog>`,
  ].join("\n");
}

export const CURRENT = ["current", "aria-current=\"page\" on", [["dashboard", "Dashboard"], ["calendar", "Calendar"], ["sales-pipeline", "Sales Pipeline (in a section)"]], "dashboard"];
