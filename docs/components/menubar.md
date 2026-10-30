# Menubar

Tier: **T1** (each item opens its menu with the browser's popover) · keyboard and moving between menus are **T2** (canon.js)

A row of menus, as at the top of a desktop app: File, Edit, View. For apps whose commands are too many for a toolbar. Each item opens a [Menu](menu.md).

## Elements

```html
<div class="canon-menubar" role="menubar" aria-label="Main">
  <button type="button" class="canon-menubar-item" id="file-item" role="menuitem"
          popovertarget="file-menu" aria-haspopup="menu" aria-expanded="false">File</button>
  <button type="button" class="canon-menubar-item" id="edit-item" role="menuitem"
          popovertarget="edit-menu" aria-haspopup="menu" aria-expanded="false">Edit</button>
</div>

<div class="canon-menu" id="file-menu" popover role="menu" aria-labelledby="file-item">…</div>
<div class="canon-menu" id="edit-menu" popover role="menu" aria-labelledby="edit-item">…</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-menubar` | yes | `role="menubar"`, named by `aria-label` or `aria-labelledby`. Only items inside. |
| `.canon-menubar-item` | yes | `<button type="button">` with `role="menuitem"`, its text the name. Opening a menu: `popovertarget` and `aria-haspopup="menu"`; an item without them is an action of its own. |
| Menus | — | [Menu](menu.md)s, outside the bar, each named by its item (`aria-labelledby`). Submenus as in Menu. |

- **Size:** `data-size` on a container around the bar and its menus (the menus aren't inside the bar).
- **Disabled item:** `aria-disabled="true"`; the keyboard skips it.

## Behavior

**The browser (T1):** an item opens and closes its menu; opening one closes the other; clicking outside or Escape closes it.

**canon.js (T2):**

- **One tab stop:** the last item focused (the first, to start). Right and Left move along the bar (wrapping, mirrored in right-to-left), Home and End to its ends.
- **Down, Enter or Space** open an item's menu at its first item; **Up** at its last ([Menu](menu.md)'s keys from there).
- **Across menus:** in an open menu, Right and Left (where they don't open or close a submenu) close it and open the next or previous item's menu, at its first item.
- **Pointer:** while one of the bar's menus is open, pointing at another item opens its menu.
- Escape closes the menu and returns to its item; Tab closes it and leaves the bar.
- The bar's menus get `data-menubar` (themes may open them clear of the bar).

## States

| State | Hook |
|---|---|
| Menu open | `aria-expanded="true"` on the item |
| Keyboard focus | `:focus-visible` on the item |
| Disabled | `aria-disabled="true"` (or `disabled`) |

## Core

- The bar: an inline flex row. Items: a button reset, their own width.

## Accessibility

- `role="menubar"` with `menuitem`s: screen readers announce the bar, the items and their menus (`aria-haspopup`, `aria-expanded`). One Tab stop; arrows move inside.
- Use a menubar for app commands. Navigation is a Nav List (links), not a menubar.

## Theme obligations

- The open item held (as pressed), and keyboard focus visible on the bar.
- Menus clear of the bar.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Typing an item's first letter on the bar | If it comes up |
| Shortcuts that open a menu (Alt+F) | The app (`aria-keyshortcuts` on the item) |
| Collapsing into one menu when narrow | Layout: the app shows a Menu button instead |

## Look

**Sizes (sm / md / lg):** Items 32 / 40 / 48 tall, padding 8 / 10 / 12, label 4 / 6 / 8 further in, corners 4 / 8 / 12; the bar 4px inside, corners 8 / 12 / 16.

A hairline edge (black at 12%, dark white at 12%) around white (dark zinc-900); items medium zinc-500, the open one zinc-100 (dark zinc-800) with zinc-900 text (dark white). Menus 4px under the bar. Hover and keyboard focus look like the open item; disabled zinc-300 (dark zinc-700).
