# Nav List

Tier: **T0** (links and native `<details>`) · opening the current page's section is **T2** (canon.js)

The links of a sidebar: the main way around an app (Inbox, Projects, Settings), or a settings page's sections (Profile, Account, Billing). Navigation: links in lists, with the keyboard of any page.

## Elements

```html
<nav class="canon-nav-list" aria-label="Workspace">
  <ul>
    <li>
      <a class="canon-nav-list-item" href="/inbox" aria-current="page">
        <span class="canon-icon" data-icon="mail" aria-hidden="true"></span>
        <span class="canon-nav-list-label">Inbox</span>
        <span class="canon-count">12</span>
      </a>
    </li>
    <li>
      <details class="canon-nav-list-section">
        <summary class="canon-nav-list-item">…icon… <span class="canon-nav-list-label">Projects</span></summary>
        <ul>
          <li><a class="canon-nav-list-item" href="/projects/website"><span class="canon-nav-list-label">Website</span></a></li>
        </ul>
      </details>
    </li>
  </ul>
  <p class="canon-nav-list-heading">Teams</p>
  <ul>
    <li>
      <a class="canon-nav-list-item" href="/teams/design">…Design…</a>
      <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" data-size="sm">…New project in Design…</button>
    </li>
  </ul>
</nav>
```

| Element | Required | Notes |
|---|---|---|
| `nav.canon-nav-list` | yes | Named (`aria-label`: "Workspace", "Settings"): a navigation landmark. Its children: lists, each optionally after a heading. |
| `.canon-nav-list-heading` | no | Names the group (the list) after it ("Teams"). |
| `<ul>` / `<li>` | yes | Each item an `<li>`: a link, or a section. |
| `a.canon-nav-list-item` | yes | An optional icon (`aria-hidden="true"`) or Avatar, a `.canon-nav-list-label`, an optional [Tag](tag.md) right after it, an optional [Count](count.md) at the end. `aria-current="page"` on the page people are on. |
| `details.canon-nav-list-section` | no | An item with sub-pages: a `summary.canon-nav-list-item` (icon, label) opening the `<ul>` of sub-pages after it. One level deep. |
| Row action | no | A [Button](button.md) after a link, in the same `<li>`: minimal, neutral, icon only, small, named for its row ("New project in Design"). |

- **A tag** ("New", "Beta"): one per item, one word, for a page that is new or changing; its meaning from Tag's `data-intent` (`info` for New). Its text joins the link's name ("Reports, New"). Remove it once it no longer applies; numbers are a Count.
- **Not a Tree View** (files and folders, deep nesting, arrow keys, choosing items), **not a Menu** (actions), **not Tabs** (panels in one page). Never menu or tree roles.
- **[Sidebar](sidebar.md)** is the layout column around it (a brand or workspace switcher above, a footer below); the Nav List is its links.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `aria-current` | an item | `page` | — | — |
| `open` (native) | a section | | closed (canon.js opens the one holding the current page) | — |
| `data-display` | the list or a container | `icon`: a rail; labels, headings, tags and counts hidden visually, kept as names | labels | yes |
| `data-size` | the list or a container | `sm` · `md` · `lg`: rows a control's height (a sidebar uses the default; `sm` for a dense one) | theme decides | yes |

- **A rail** (a collapsed sidebar) needs a [Tooltip](tooltip.md) per link (`interestfor` on the link, the tooltip after it in the `<li>`, `data-placement="inline-end"`), so sighted people can read the names. Beside the icon, toward the page: above or below, it would cover the next link, and a rail sits at the window's edge. Tooltips in a Nav List show only in a rail, so a sidebar that collapses keeps them in both states.

## Rail

`data-display="icon"` on the list or a container. There is no room for a section's sub-pages in a rail, so they open beside its icon, over the page, with their labels: a click (or Enter, Space) on the section opens them. One at a time. They close when a page is chosen, on Escape (focus back on the section), and when focus or a click goes elsewhere. No section opens by itself in a rail; the one holding the current page is marked (filled) instead. Becoming a rail closes open sections; leaving it opens the current page's again.

## Behavior

- **The browser (T0):** links go; a section's summary opens and closes it (Enter, Space, a click), announced as expanded or collapsed.
- **canon.js (T2):** the section holding `aria-current="page"` opens, and its summary gets `data-current` (shown while it's closed); again whenever the app moves `aria-current`. In a rail, sections open beside it instead (see Rail), and canon.js follows `data-display` changing (a [Sidebar](sidebar.md) collapsing).
- A row's action shows while the pointer is on its row or focus is in it (always where there is no hover), and is a Tab stop of its own.

## Accessibility

- A named navigation landmark of lists of links; headings name their groups. The current page is `aria-current="page"`, heard as "current page".
- Tab and Shift+Tab move through it like the rest of the page; no arrow keys to learn.
- In a rail, the labels stay as the links' names; tooltips show them on hover and focus.

## Theme obligations

- The current page unmistakable (a filled row); hover clearly lighter.
- A section reads as opening (a chevron that turns); its sub-pages line up under its label.
- Use logical properties: in right-to-left, icons are on the right and a closed section's chevron points left.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| The sidebar around it (brand, footer, collapsing to a rail) | [Sidebar](sidebar.md) |
| Reordering items by dragging, favorites | The app |
| Deeper nesting | Tree View |

## Look

**Sizes (sm / md / lg):** Rows a control's height (32 / 40 / 48), the icon as far from the edge as from the top (10px at md), Button's corners, a quarter of their height apart (10px at md); icons Button's icon-to-label space before the label (6 / 8 / 8); sub-pages start where the labels do, half a row less 8px apart and from the rows around them (8 / 12 / 16); groups 16px apart; a rail's items square.

Labels regular zinc-900 (dark white), icons zinc-500 (dark white); hover zinc-50 (dark zinc-800 at 50%); the current page zinc-100 (dark zinc-700) with a medium label. A tag after the label at Tag's small size (20px tall at every size). Counts a quiet zinc-500 number (not Count's pill). Headings Menu's. A section's chevron zinc-500 at its end, pointing to the end while closed and down while open (the common sidebar convention). In a rail, a section's sub-pages in Menu's panel, 16px out. A row's action a minimal neutral Button. Focus: the button's ring.
