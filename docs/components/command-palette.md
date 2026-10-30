# Command Palette

Tier: **T3** (filtering, the keyboard and the shortcut are canon.js's; without it, offer a link to a search page)

A search box for the whole app: press ⌘K (Ctrl+K), type a few letters, and go to a page or run an action without looking through menus. A shortcut, not the only door: every command must also be reachable another way.

## Elements

```html
<button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" commandfor="palette" command="show-modal" aria-keyshortcuts="Meta+K Control+K">
  <span class="canon-icon" data-icon="search" aria-hidden="true"></span>
  <span class="canon-button-label">Search</span>
  <kbd class="canon-kbd" aria-hidden="true">⌘K</kbd>
</button>

<dialog class="canon-command-palette" id="palette" aria-label="Command palette">
  <div class="canon-command-search">
    <span class="canon-icon" data-icon="search" aria-hidden="true"></span>
    <input type="search" aria-label="Search commands and pages" placeholder="Search commands and pages">
  </div>
  <div class="canon-command-list">
    <div class="canon-command-group" aria-labelledby="palette-pages">
      <p class="canon-command-heading" id="palette-pages">Pages</p>
      <a class="canon-command-item" href="/invoices">
        <span class="canon-icon" data-icon="receipt" aria-hidden="true"></span>
        <span class="canon-command-label">Invoices</span>
        <span class="canon-command-hint">Billing</span>
      </a>
    </div>
    <div class="canon-command-group" aria-labelledby="palette-actions">
      <p class="canon-command-heading" id="palette-actions">Actions</p>
      <button type="button" class="canon-command-item">
        <span class="canon-icon" data-icon="plus" aria-hidden="true"></span>
        <span class="canon-command-label">Create invoice</span>
        <kbd class="canon-kbd" aria-hidden="true">N</kbd>
      </button>
    </div>
  </div>
  <footer class="canon-command-footer">…↑ ↓ to move · Enter to run · Esc to close…</footer>
</dialog>
```

| Element | Required | Notes |
|---|---|---|
| Trigger | yes | A Button with `command="show-modal"` naming the palette; its `aria-keyshortcuts` (`Meta+K Control+K`) opens it from anywhere on the page and is heard with the button. A Kbd accessory shows it. |
| `dialog.canon-command-palette` | yes | A modal `<dialog>` with an `id`, named (`aria-label`). |
| `.canon-command-search` | yes | First: an optional icon and the `<input type="search">`, named. canon.js makes it the combobox. |
| `.canon-command-list` | yes | The commands (canon.js gives it `role="listbox"`): items, or groups of them. |
| `.canon-command-group` | no | A group (`role="group"`), named by its `.canon-command-heading`. `data-remote` for the app's own results (below). |
| `.canon-command-item` | yes | A link (it goes) or a `<button type="button">` (it does): an optional icon or Avatar, a `.canon-command-label`, an optional `.canon-command-hint` (where it is: "Billing"), an optional Kbd for its own shortcut (`aria-hidden="true"`). `data-keywords` adds words it matches ("preferences account"); `data-value` is what it returns; `data-keep-open` keeps the palette open after it runs. |
| `.canon-command-empty` | no | What shows when nothing matches; canon.js writes one ("No results for “xyz”") if there is none. |
| `.canon-command-footer` | no | Hints about the keys, after the list. |

- **Not a Menu** (actions from one button, a short fixed list) nor a **Combobox** (a value for a form field): the palette runs commands and goes places.

## Behavior (canon.js)

- **Opening** (the trigger, its shortcut, or `showModal()`): the field is emptied, every item shows, the first is active, focus is in the field. The shortcut pressed again closes it.
- **Typing** narrows the items to those holding every word typed, in any order (in the label, the hint and `data-keywords`; case and accents ignored); the words are marked in the labels (`mark.canon-command-match`). Groups with nothing left hide; with nothing at all, the empty message shows. Screen readers hear how many results there are once typing pauses.
- **Keys:** ↑ ↓ move the active item (`aria-selected`, `aria-activedescendant`, scrolled into view), wrapping at the ends; Enter runs it; Escape closes the palette, and so does a click beside it (canon.js sets `closedby="any"` unless the palette has another `closedby`). The pointer makes an item active as it moves over it, and a click runs it. Focus never leaves the field.
- **Running** an item is a click: a link goes, a button fires its listeners. Then the palette closes (its `returnValue` the item's `data-value`, else its text), unless a listener cancels the click or the item has `data-keep-open`.
- **The app's results:** every change fires **`canon-search`** on the palette (`detail: { query }`, a quarter second after typing stops). Items the app puts in a `data-remote` group show as they are (the app has matched them); canon.js marks their words and keeps the keyboard working as they come and go.

## Accessibility

- A modal dialog holding a combobox (the field) and its listbox (the list) of options in named groups; the active option is the field's `aria-activedescendant`. The shortcut is on the trigger (`aria-keyshortcuts`).
- An item's name is its label and hint; icons and Kbds are hidden.
- The result count is announced after a pause, not on every key.

## Theme obligations

- The active item unmistakable (and in forced colors), the matched words visible in the labels.
- The palette doesn't move as the list narrows (anchored near the top, not centered).
- No motion: opened from the keyboard many times a day, it opens and closes at once.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Steps ("Change theme…" opening a second list, Backspace back) | If it comes up |
| Recent items remembered between visits | The app (it writes them first) |
| Fuzzy matching by letters ("crinv") | If it comes up; words match in any order now |
| A loading line while the app looks up results | With Progress |

## Look

**Sizes:** 640px wide, at most 480px tall, 12% of the window from the top; the search row a control's height + 16px; items a control's height, the list 8px inside.

Dialog's panel (its hairline edge, overlay shadow and backdrop color, unblurred) with 16px corners, opening and closing at once; the search row unframed, 16px type, a hairline rule under it, the icon zinc-500; Menu's items (the active one zinc-100, dark zinc-800; icons zinc-500) and headings (10px semibold capitals); hints zinc-500 after the label; matched words semibold; the empty message centered in zinc-500; the footer's hints 12px zinc-500 under a line. Forced colors: the active item outlined in Highlight.
