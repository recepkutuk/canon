# Sidebar

Tier: **T0** (a column of Nav Lists) · collapsing to a rail, and a drawer on a narrow App Shell, are **T2** (canon.js)

The column beside an app's pages: the app's name, its main links, and what belongs at the bottom (help, settings). It collapses to a rail of icons. The links themselves are a [Nav List](nav-list.md); the sidebar is the column around them. Usually inside an [App Shell](app-shell.md).

## Elements

```html
<div class="canon-sidebar" id="sidebar">
  <div class="canon-sidebar-header">
    <a class="canon-sidebar-brand" href="/">
      <svg aria-hidden="true">…</svg>
      <span class="canon-sidebar-brand-name">Globex Corporation</span>
    </a>
    <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon"
            commandfor="sidebar" command="--canon-toggle-sidebar" aria-controls="sidebar" aria-expanded="true">
      <span class="canon-icon" data-icon="panel-left-close" aria-hidden="true"></span>
      <span class="canon-button-label">Sidebar</span>
    </button>
  </div>
  <div class="canon-sidebar-body">
    <nav class="canon-nav-list" aria-label="Main">…</nav>
  </div>
  <div class="canon-sidebar-footer">
    <nav class="canon-nav-list" aria-label="Help and settings">…</nav>
  </div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-sidebar` | yes | The column: a `<div>` (its Nav Lists are the landmarks). An `id` when a toggle names it. |
| `.canon-sidebar-header` | no | First. A brand (or a workspace switcher), then the toggle when there is no Top Bar to hold it. |
| `.canon-sidebar-brand` | no | The app's or workspace's mark (an `<img>` or `<svg>`, decorative) and a `.canon-sidebar-brand-name`; a link home, or a button opening a workspace Menu. |
| `.canon-sidebar-body` | yes | After the header: the Nav Lists (one or more; a [Separator](separator.md) may go between them). The part that scrolls, so the header and the footer stay. |
| `.canon-sidebar-footer` | no | Last, at the bottom: a Nav List (help, settings), or the account. Where the account goes (here, or a Top Bar) is the app's choice. |
| Toggle | no | One [Button](button.md) with `command="--canon-toggle-sidebar"`, `commandfor` and `aria-controls` the sidebar, `aria-expanded`, icon only, named "Sidebar". In the same place in both states: a [Top Bar](top-bar.md)'s start, or the sidebar's header when there is no bar. |

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-display` | the sidebar | `icon`: the rail. Icons only, the brand's mark only; names stay for screen readers. | open | yes (to its Nav Lists and Buttons) |
| `data-size` | the sidebar or a container | `sm` · `md` · `lg`: its Nav Lists' rows | theme decides | yes |
| `--canon-sidebar-width` | the sidebar or a container (a style) | a length | theme decides (Canon: 16.5rem) | yes (CSS) |

## Core

- A column: the header, the body, the footer at the bottom. When the links don't fit, only the body scrolls (on its own, not the page): the brand and the footer stay in place, and the scrollbar runs beside the links only.
- Open, it is `--canon-sidebar-width` wide; a rail is as wide as its icons (a theme may give it an explicit width, to animate between the two).
- A long brand name is cut (…).

## Behavior (T2, canon.js)

- **Collapsing:** `--canon-toggle-sidebar` sets or removes `data-display="icon"` on the sidebar and the toggle's `aria-expanded`. The toggle stays where it is, so focus does too.
- **The rail's links:** names show in each link's [Tooltip](tooltip.md) (`interestfor`), beside it (`data-placement="inline-end"`); a section's sub-pages open beside it (see [Nav List](nav-list.md#rail)).
- **A drawer:** on a narrow [App Shell](app-shell.md#behavior-t2-canonjs) the sidebar leaves the page and the toggle opens it over it (see there).
- Without JavaScript the sidebar stays as written (open, or a rail), in place at every width.

## Accessibility

- Its Nav Lists are named navigation landmarks; the sidebar adds none of its own.
- The toggle says whether the sidebar is open ("Sidebar, expanded") and which element it controls; it never moves, so focus stays on it.
- In a rail, every name is still there for screen readers; tooltips show them on hover and focus.

## Theme obligations

- Set apart from the page (a line, a fill).
- A rail's icons and their current page as clear as the open sidebar's.
- Use logical properties: in right-to-left the sidebar is on the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Remembering open or rail between visits | The app (it writes `data-display`) |
| Resizing by dragging | Split Pane |
| A workspace switcher's menu | [Menu](menu.md) from the brand button |

## Look

**Sizes:** sm / md / lg (the size scale, through one inset of 8 / 12 / 16): 264px open at every size; a rail 48 / 64 / 80 (with its line), as wide as the Top Bar is tall; inside, the inset above and below and 4px more at the sides (8 12 / 12 16 / 16 20; a rail the inset all round); 24 / 32 / 40 between header and links; the header a row tall (32 / 40 / 48), lined up with the bar.

White (dark zinc-900), a hairline at its end in the shell's faint rule (black at 7%, dark white at 8%). The brand a 24 / 32 / 40 mark 10 / 12 / 16 before its name (Button's type, semibold: 12 / 14 / 16; zinc-900, dark white). Collapsing and opening animate the width (0.2s; none with reduced motion); in the rail, items fill its one-square column, so their fills narrow with it and the icons glide the 4px between the two paddings. The toggle a minimal neutral icon Button: a panel and a chevron drawn apart, the chevron turning 180° (in to close, out to open); mirrored in right-to-left. A rail's header stacks the mark and the toggle when it is there. Canon keeps one toggle in one place. A drawer: from the shell's start over a 30% black scrim on the shell, with a shadow, sliding in (0.2s; none with reduced motion). The side padding is the header's, body's and footer's, so the body's scrollbar sits at the sidebar's edge. Thin scrollbars; none in a rail (it still scrolls by wheel, touch and focus), where one would narrow the one-square column.
