# Top Bar

Tier: **T0** · folding when narrow is **T2** (canon.js)

The bar over an app's pages: the sidebar's toggle and search at the start; the app's own actions and the account at the end. Usually inside an [App Shell](app-shell.md), beside a [Sidebar](sidebar.md).

## Elements

```html
<header class="canon-top-bar">
  <div class="canon-top-bar-start">
    <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral"
            commandfor="palette" command="show-modal" aria-keyshortcuts="Meta+K Control+K">
      <span class="canon-icon" data-icon="search" aria-hidden="true"></span>
      <span class="canon-button-label">Search</span>
      <kbd class="canon-kbd" aria-hidden="true">⌘K</kbd>
    </button>
  </div>
  <div class="canon-top-bar-end">
    <button type="button" class="canon-button" data-emphasis="medium" data-intent="neutral" data-display="icon" aria-pressed="false">…Dark mode…</button>
    <button type="button" class="canon-button" data-emphasis="medium" data-intent="neutral" data-display="icon">
      <span class="canon-icon" data-icon="bell" aria-hidden="true"></span>
      <span class="canon-button-label">Notifications</span>
      <span class="canon-count">3<span class="canon-visually-hidden"> unread</span></span>
    </button>
    <button type="button" class="canon-avatar" id="account" popovertarget="account-menu" aria-haspopup="menu" aria-expanded="false">…</button>
    <div class="canon-menu" id="account-menu" popover role="menu" aria-labelledby="account">…</div>
  </div>
</header>
```

| Element | Required | Notes |
|---|---|---|
| `header.canon-top-bar` | yes | A `<header>`: the page's banner when it isn't inside another landmark. |
| `.canon-top-bar-start` | no | The [Sidebar](sidebar.md)'s toggle, then search (a [Command Palette](command-palette.md)'s button). Where people are (a [Breadcrumb](breadcrumb.md), a back link) is the page's: it goes in its [Page Header](page-header.md). |
| `.canon-top-bar-end` | no | At the end: the app's own [Buttons](button.md) (icon only, neutral), then the account: an [Avatar](avatar.md) button opening a [Menu](menu.md). |

- **Search** is a Command Palette's button, not a field: it opens the palette (also with its shortcut from anywhere). A field that searches in place is a [Combobox](combobox.md).
- **A toggle** (dark mode) is a Button with `aria-pressed`; **notifications** a Button with a [Count](count.md), which an icon-only button carries in its top-end corner.
- **What belongs here:** what stays the same on every page (search, creating things, help, notifications, the account, the workspace or environment, the language). What changes with the page (its title, its actions, a dashboard's date range, who else is viewing, "Saved") goes in its Page Header, under the bar.

## Core

- A row: the start, then the end at the far end. The start gives up room first: what doesn't fit is cut at its end, never drawn under the end.

## Behavior (T2, canon.js)

- **Folding:** when its things don't fit, the bar folds, a step at a time, and unfolds as room comes back. The steps, each only where it applies:
  1. `kbd`: the search drops its shortcut.
  2. `search`: then its label (the Button becomes icon only, keeping its name).
  3. `end`: the end's Buttons go into one **More** menu (an icon Button, where the first of them was, with their emphasis): a toggle (`aria-pressed`) as a check, a Button opening a [Menu](menu.md) as a submenu; choosing an item clicks the Button it stands for. Only when two or more would fold.
- **Never folds:** the sidebar's toggle, a Button carrying a [Count](count.md) (notifications: live state stays in sight), and the account.
- `data-fold` on the bar lists the steps taken (`"kbd search end"`), for themes; folded things get `data-folded`. Fixed steps rather than one item at a time, so the bar looks the same at the same width and each step can be shown.
- Without JavaScript nothing folds; the start is cut instead.

## Accessibility

- A banner landmark (its `<header>`), so people can jump to it; the account and notifications are named buttons.
- The search button's shortcut is in `aria-keyshortcuts`; its Kbd is hidden from screen readers.
- Folded, every Button keeps its name: the search as an icon Button, the end's as items of the More menu (named "More", `--canon-text-more`).

## Theme obligations

- Set apart from the page (a line, a fill); readable in both schemes.
- Use logical properties: in right-to-left the start is on the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A notifications panel | A [Popover](popover.md) or a Drawer from the button |
| Tabs across the top | Tabs |

## Look

**Sizes:** sm / md / lg (the size scale): 48 / 64 / 80 tall (a row and the shell's inset of 8 / 12 / 16 above and below); 16 / 20 / 24 at the sides; 12 / 16 / 20 between things. Folded: the More button the end's emphasis (medium neutral), Lucide's `more` dots.

White (dark zinc-900), a hairline under it in the shell's faint rule (black at 7%, dark white at 8%); search the Command Palette's button as it is (a low neutral Button with its Kbd); dark mode and notifications medium neutral icon Buttons; the Count a rose pill 4px past the button's corner; the account an Avatar button a row's size.
