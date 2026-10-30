# App Shell

Tier: **T0** · the sidebar's toggle and the narrow drawer are **T2** (canon.js)

The frame of an app's pages: a [Sidebar](sidebar.md) the full height at the start, a [Top Bar](top-bar.md) over the content, and the page's `<main>`. Both stay put while the page scrolls.

## Elements

```html
<body>
  <div class="canon-app-shell">
    <div class="canon-sidebar" id="sidebar">
      <div class="canon-sidebar-header">
        <a class="canon-sidebar-brand" href="/">…</a>
      </div>
      <div class="canon-sidebar-body">
        <nav class="canon-nav-list" aria-label="Main">…</nav>
      </div>
    </div>
    <header class="canon-top-bar">
      <div class="canon-top-bar-start">
        <button … commandfor="sidebar" command="--canon-toggle-sidebar" aria-controls="sidebar" aria-expanded="true">…Sidebar…</button>
        <button … commandfor="palette" command="show-modal" aria-keyshortcuts="Meta+K Control+K">…Search…</button>
      </div>
      <div class="canon-top-bar-end">…</div>
    </header>
    <main>…</main>
    <dialog class="canon-command-palette" id="palette" aria-label="Command palette">…</dialog>
  </div>
</body>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-app-shell` | yes | Usually the body's only child. |
| [Sidebar](sidebar.md) | no | One. |
| [Top Bar](top-bar.md) | no | One. |
| `<main>` | yes | The page. |
| Dialogs and popovers | no | Take no place (a Command Palette, the account Menu). |

- **The toggle**: one, at the bar's start, in the same place whether the sidebar is open or a rail (without a bar, in the sidebar's header).
- **[Banners](banner.md)** go before the shell, not in it: first in what holds it (the `<body>`).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `--canon-app-shell-height` | the shell (a style) | a length | `100dvh` | yes (CSS) |
| `--canon-sticky-offset` | the shell (a style) | a length: where sticky things in the page (a sticky [Page Header](page-header.md)) start | the theme sets it to the Top Bar's height when there is one (plus the Banners') | yes (CSS) |
| `--canon-banners-height` | the shell's parent (canon.js) | the height of the [Banners](banner.md) before it | `0px` | yes (CSS) |

## Core

- A grid: the sidebar the full height at the start; the bar over the content; `<main>` under it.
- The sidebar is the window's height (`--canon-app-shell-height`) and stays put (sticky), its body scrolling on its own; the bar stays at the top. So the shell needs the window, or a frame that height, to scroll in: in something taller that doesn't scroll, the sidebar stops at that height.
- The shell is at least the window's height (`--canon-app-shell-height`, for a shell inside something else).
- Under Banners (`--canon-banners-height`), the sidebar and the bar stick under them, and the sidebar and the shell take the height they leave; `--canon-sticky-offset` includes them.
- The shell is a size container named `canon-app-shell`: its own width, not the window's, decides when it is narrow (so a shell inside something else behaves too).

## Behavior (T2, canon.js)

- **Narrow: the sidebar becomes a drawer.** Below the width the theme sets (`--canon-sidebar-drawer: 1` on the sidebar, from a container query on the shell), canon.js makes the sidebar a drawer (`data-drawer="closed"` or `"open"`): it takes no room, so the page has the full width, and the toggle (still at the bar's start) opens it over the page, at the shell's start, inside the shell (a shell inside something else keeps it inside too).
  - Open, it is the whole sidebar, labels and all (a rail is one again when the shell widens; `data-display` is put back).
  - Escape closes it (focus back to the toggle when it was inside), and so do a click or focus elsewhere and choosing a page. Opened from the keyboard, focus goes to the current page's link (or the first).
  - The toggle's `aria-expanded` says whether the drawer is open.
  - Only with the toggle outside the sidebar (in the Top Bar): a toggle in the sidebar's header would go with it, so that sidebar stays in place.
- Without JavaScript the sidebar stays in place at every width.

## Accessibility

- Landmarks: the sidebar's navigation, the bar's banner, the main, in the page's order (the grid places them; the order stays the reading order).
- The toggle never moves, so focus stays on it when the sidebar collapses or opens.
- The drawer is not modal: the page stays reachable, and leaving it (Escape, a click, choosing a page) closes it. A task that must block the page is a [Drawer](drawer.md), not this.

## Theme obligations

- The sidebar and the bar meet cleanly (one line between them, not two).
- Use logical properties: in right-to-left the sidebar is on the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A medium width turning the sidebar into a rail by itself | Not planned: it would override what people chose; the bar's folding handles a cramped middle width |
| A skip link to the main | The app (before the shell) |
| A second sidebar at the end (details of a selection) | Split Pane, or a Drawer |

## Look

The page zinc-50 (dark zinc-950) behind white panels (dark zinc-900); the Sidebar and Top Bar's fills and their lighter lines (hairlines in the faint rule: black at 7%, dark white at 8%), one line where they meet. Narrow under 640px of its own width (a phone, or a small window): the sidebar a drawer.
