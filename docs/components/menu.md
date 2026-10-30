# Menu

Tier: **T1** (a native popover: it opens, closes and anchors without JavaScript) · keyboard, submenu hover, checks and context menus are **T2** (canon.js)

A list of actions that opens from a button, or where people right-click: commands, settings to turn on and off, a choice among a few. The menu is a `popover` with `role="menu"`; its items are buttons (or links) with menu item roles.

## Elements

```html
<button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" id="options-trigger"
        popovertarget="options" aria-haspopup="menu" aria-expanded="false">
  <span class="canon-button-label">Options</span>
</button>

<div class="canon-menu" id="options" popover role="menu" aria-labelledby="options-trigger">
  <button type="button" class="canon-menu-item" role="menuitem" aria-keyshortcuts="Meta+R">
    <span class="canon-menu-label">Reload</span>
    <kbd class="canon-kbd" aria-hidden="true">⌘R</kbd>
  </button>
  <button type="button" class="canon-menu-item" role="menuitem" popovertarget="tools" aria-haspopup="menu">
    <span class="canon-menu-label">More tools</span>
  </button>
  <hr class="canon-separator">
  <button type="button" class="canon-menu-item" role="menuitemcheckbox" aria-checked="true">
    <span class="canon-menu-label">Show bookmarks</span>
  </button>
  <hr class="canon-separator">
  <div class="canon-menu-group" role="group" aria-labelledby="options-people">
    <div class="canon-menu-heading" id="options-people">People</div>
    <button type="button" class="canon-menu-item" role="menuitem">
      <span class="canon-avatar">…</span>
      <span class="canon-menu-label">Pedro Duarte</span>
    </button>
  </div>
  <hr class="canon-separator">
  <button type="button" class="canon-menu-item" role="menuitem" data-intent="danger">
    <span class="canon-icon" data-icon="trash" aria-hidden="true"></span>
    <span class="canon-menu-label">Delete</span>
  </button>
</div>

<div class="canon-menu" id="tools" popover role="menu" aria-label="More tools">…</div>
```

| Element | Required | Notes |
|---|---|---|
| Trigger | yes (or a context menu region) | A [Button](button.md) with `popovertarget` (the menu's id) and `aria-haspopup="menu"`. Its menu arrow is the theme's (Button's indicator rule). |
| `.canon-menu` | yes | `popover` (auto), `role="menu"`, an `id`, named by `aria-labelledby` (its button) or `aria-label`. Anywhere in the page; the browser lays it over everything (top layer). |
| `.canon-menu-item` | yes | `<button type="button">` (or `<a href>` for a link) with `role="menuitem"`, `"menuitemcheckbox"` or `"menuitemradio"`. Holds a `.canon-menu-label`; before it an optional `canon-icon` or `canon-avatar`; after it an optional `canon-kbd` (`aria-hidden="true"`, with `aria-keyshortcuts` on the item). |
| `.canon-menu-label` | yes | The item's words. |
| `<hr class="canon-separator">` | no | A [Separator](separator.md). |
| `.canon-menu-group` | no | `role="group"` named by a `.canon-menu-heading` (`aria-labelledby`): a set of items under a heading. Radio items are one choice per group. |
| A submenu | no | Its own `.canon-menu`, outside the menu (after it), opened by an item with `popovertarget` and `aria-haspopup="menu"`, named by `aria-label`. |

- **Drawn by the theme, never written:** the check of a checked item (from `aria-checked`), the arrow of an item that opens a submenu (from `aria-haspopup`), the trigger's menu arrow.
- **Disabled:** `aria-disabled="true"`. The item stays in the menu for screen readers but is skipped by the keyboard and does nothing.
- **Destructive:** `data-intent="danger"`.
- **Size:** `data-size` on the menu, or on a container around the trigger and the menu (the menu isn't inside its trigger, so the button's own `data-size` doesn't reach it).

### A context menu

```html
<div data-contextmenu="edit-menu">…</div>
<div class="canon-menu" id="edit-menu" popover role="menu" aria-label="Edit">…</div>
```

`data-contextmenu` on any element names a menu that opens where it is right-clicked (or long-pressed, where touch screens send a context menu event), or from the keyboard (the context menu key, Shift+F10) under the focused element. Without canon.js the browser's own menu shows.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `aria-checked` | menuitemcheckbox, menuitemradio | `true` · `false` | — (required) | — |
| `aria-disabled` | an item | `true` | — | — |
| `data-intent` | an item | `danger` | neutral | no |
| `data-contextmenu` | any element | a menu's id | — | no |
| `data-size` | the menu or a container | `sm` · `md` · `lg` (xs is sm, xl and 2xl are lg) | theme decides | yes |

## Behavior

**The browser (T1):** the button opens and closes the menu; it opens under the button, from its start, and flips to fit; clicking outside or Escape closes it (Escape closes a submenu first); opening another menu closes the first. A submenu item opens its submenu.

**canon.js (T2):**

- **Focus:** opened from the keyboard (Enter, Space, Down), the first item; Up, the last; opened with a pointer, the menu itself (the keyboard then starts from there). Closing returns focus to the trigger.
- **Keys:** Down and Up move through the items (wrapping, skipping disabled ones); Home and End to the ends; typing jumps to the next item whose label starts with what was typed; Right opens a submenu at its first item and Left closes it (mirrored in right-to-left); Tab closes the menu and moves on from the trigger.
- **Pointer:** the item under the pointer is where the keyboard is; resting on an item with a submenu opens it after a moment, resting on another item closes it. Moving into an open submenu keeps it open.
- **Choosing an item closes the whole menu**, after the click's listeners ran; a listener that calls `preventDefault()` keeps it open. Clicking an item with a submenu only opens it.
- **Checks:** a `menuitemcheckbox` flips `aria-checked`, a `menuitemradio` becomes the checked one of its group (or of the menu), before the click's listeners run, so they read the new state.
- **Submenus** get `data-submenu` and open beside their item; a [Menubar](menubar.md)'s menus get `data-menubar`, a [Split Button](split-button.md)'s `data-split-button`.
- **Long menus** scroll in the room they have; one cut short opens towards the side with more room, and the keyboard keeps its item in view.
- **Context menus** open at the pointer (once the button is released), kept inside the window.
- Triggers get `aria-expanded`. Several triggers can share one menu (a row's actions in every row): the one that opened it is its trigger (marked expanded, anchoring it, getting focus back); closing marks them all collapsed.
- A `popover="manual"` menu (one always shown, as in documentation) is left alone.

## States

| State | Hook |
|---|---|
| The keyboard's place / hover | `:focus` on the item |
| Submenu open | `aria-expanded="true"` on its item |
| Checked | `aria-checked="true"` |
| Disabled | `aria-disabled="true"` (or `disabled`) |
| Open | `:popover-open` on the menu, `aria-expanded="true"` on the trigger |

## Core

- The menu: anchored to its trigger (`position-area: self-block-end span-self-inline-end`, flipping), a scrolling column at most as tall as its room. A submenu (`data-submenu`): `self-inline-end span-self-block-end`.
- Items: a flex row, full width, the label taking the room, everything else its own size.

## Accessibility

- `role="menu"` with menu items: screen readers announce the menu, the item count and position, checked states and submenus. The trigger's `aria-haspopup="menu"` and `aria-expanded` say what it opens and whether it is open.
- One tab stop: Tab leaves the menu (and closes it); arrows move inside.
- A shortcut is said once, from the item's `aria-keyshortcuts`; the Kbd is hidden.
- A disabled item is still announced (`aria-disabled`), so people know it exists.
- Use menus for actions. Navigation between pages is a nav list or links; a form value is a Select or Combobox.

## Theme obligations

- The keyboard's place clearly marked, and the same as hover.
- Checks and submenu arrows drawn from `aria-checked` and `aria-haspopup`, mirrored in right-to-left where they point.
- Destructive items and disabled items distinguishable by more than color where the system allows.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Items with a second line (description) | If it comes up |
| Search inside a menu | Command Palette |
| Opening and closing animation | The theme |

## Look

**Sizes (sm / md / lg):** Items 32 / 40 / 48 tall, padding 8 / 10 / 12, label 4 / 6 / 8 further in, corners 4 / 8 / 12; the panel's corners 8 / 12 / 16, 4px inside; separators [Separator](separator.md)'s (12 / 16 / 20px rows); avatars 24 / 32 / 40.

Select's list (white, dark zinc-900; no frame: a hairline edge (black at 12%, dark white at 12%) and the floating shadow), 4px under the trigger and 4px before it (the items' text lines up with the trigger's), at least the trigger's width + 8 and 8rem. Text zinc-900 (dark white), icons and submenu arrows zinc-500 (dark zinc-400); checked items medium with a check in the text color; the heading 10px semibold capitals in zinc-500 (dark zinc-400); shortcuts are Kbd at its smallest, tinted from the item's text; destructive red-700 (dark red-300), icon too; disabled zinc-400 (dark zinc-600). A submenu sits 4px over the menu's edge, its first item level with its item. Hover and the keyboard's place zinc-100 (dark zinc-800, the open item's fill), destructive on a red tint (Select's); long menus scroll.

**Motion:** opening, it fades in from 97% (0.15s); closing, it fades out where it is (0.1s). With reduced motion it only fades.
