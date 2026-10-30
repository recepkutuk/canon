# Save Bar

Tier: **T0** (Save and Discard are a form's own buttons) · tracking changes, saving states, the shortcut and asking before leaving are **T2** (canon.js)

Save and Discard in reach while someone edits, and whether there's anything to save: the last thing in an edit form, sticking to the bottom of the window while the form goes on below.

## Elements

```html
<form class="canon-card" action="/invoices/2041" method="post">
  …fields…
  <footer class="canon-save-bar">
    <p class="canon-save-bar-status"></p>
    <button type="reset" class="canon-button" data-intent="neutral">…Discard…</button>
    <button type="submit" class="canon-button" data-emphasis="high" aria-keyshortcuts="Meta+S Control+S">
      <span class="canon-button-label">Save</span><kbd class="canon-kbd" aria-hidden="true">⌘S</kbd>
    </button>
  </footer>
</form>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-save-bar` | yes | Inside its `<form>`, last. In a [Card](card.md) that is the form, the card's footer. |
| `p.canon-save-bar-status` | — | First. canon.js keeps it (and adds it when it's missing): a [Status Indicator](status.md) saying where the form stands. |
| Discard | no | `<button type="reset">`, neutral: the browser's reset, bringing back what's saved. |
| Save | yes | `<button type="submit">`, high emphasis, last. `aria-keyshortcuts="Meta+S Control+S"` and a [Kbd](kbd.md) for its shortcut. |

- **What's saved is the form's defaults.** The values a control starts with (`value`, `checked`, `selected` in the markup) are the saved ones. A control that differs from its default is a change; Discard (reset) brings the defaults back. After a save, the values shown become the new defaults.
- **Unavailable, not disabled:** with nothing to save, and while saving, canon.js makes Save and Discard `aria-disabled="true"`. They stay in place and in the Tab order, heard as unavailable, the status beside them saying why ("No changes", "Saving…"); a click, Enter in a field or the shortcut does nothing. Never `disabled` (out of reach, unexplained) and never hidden (the buttons would move).
- **One per form.** A page with several forms has a bar in each; the shortcut saves the one focus is in.
- **Save Bar or [Form Layout](form-layout.md)'s actions?** A form that edits something saved (a record, settings) ends with a Save Bar: there is a saved state to compare with and to lose. A form that creates (a new invoice, a sign-up) ends with actions, sticky (`data-sticky`) if it's long.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-state` | the bar (canon.js) | `changed` · `saving` · `saved` · `failed` | none: no changes | — |
| `--canon-sticky-offset-end` | a container (a style) | a length: how far from the window's bottom it sticks | `0` | yes (CSS) |
| `--canon-page-inset` | a container (a style) | the page's side padding, which the bar reaches across on a page | `0` | yes (CSS) |

## Core

- A row: the status at the start, the buttons at the end; it wraps when narrow.
- Sticky at the bottom (`--canon-sticky-offset-end`) while the form continues below; at the form's end, it sits there.
- On a page (not in a Card), it reaches across the page's side padding.

## Behavior (T2, canon.js)

- **A new status:** when the state changes (changed, saving, saved, failed, none), the status is marked `data-updated` while the theme's animations run; a count changing within a state isn't.
- **Tracking:** on every `input` and `change`, canon.js compares the form's named controls with their defaults and counts the changes, once per name ("2 unsaved changes"). The bar is `data-state="changed"`.
- **Discard:** the browser's reset; the count goes back to "No changes".
- **Availability:** Save and Discard are `aria-disabled` while there are no changes or while saving; an unavailable button's click (and Enter in a field, which clicks Save) is cancelled.
- **Saving:** on `submit` the bar is `saving` ("Saving…").
  - A form that submits the browser's way leaves the page: nothing more to do.
  - An app saving on its own (`preventDefault()` on `submit`, then `fetch`) answers on the form:
    - `canon-saved`: the values become the new defaults, the bar `saved` ("Changes saved").
    - `canon-save-failed` (`detail.message` optional): the bar `failed` ("Couldn't save", or the message), the changes kept.
- **Leaving:** with unsaved changes, closing or reloading the page asks first (the browser's own question). Leaving within an app's own navigation is the app's to check: `form:has(.canon-save-bar[data-state="changed"])`.
- **Shortcut:** the Save button's `aria-keyshortcuts` (⌘S, Ctrl+S) submit its form: the one focus is in, or the only one on the page. The browser's own "save page" is kept from opening.
- Values the app changes in code fire no events: dispatch `input` on the control so the bar sees them.

## Accessibility

- The status is a `role="status"` region: "2 unsaved changes", "Saving…", "Changes saved", "Couldn't save" are heard as they come, without moving focus.
- The state is in the words, not only the dot.
- A submit with invalid fields doesn't save: the browser (and [Field](field.md)'s messages) points to the first one.
- The shortcut is declared (`aria-keyshortcuts`); its Kbd is hidden from screen readers.

## Theme obligations

- The bar set apart from the form scrolling under it once stuck (a line, a fill).
- Save the most prominent thing in it.
- Use logical properties: in right-to-left the status is on the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Asking before leaving inside an app | The app, reading `data-state` |
| Saving by itself as people type (autosave) | If it comes up: the same states, without Save |
| Showing which fields changed | If it comes up: `data-changed` on the field |

## Look

**Sizes:** The shell's inset above and below (8 / 12 / 16); 8px between things. In a card, the card's padding.

A Card's footer that stays. The status a Status Indicator: no changes neutral, changed warning (amber), saving info (pulsing), saved success, failed danger. In a card: the card's white and its line above. On a page: the page's color, the shell's line above once it's stuck (a scroll-state query).

**Motion:** a new status rises 4px into place and fades in (0.2s); a count changing within one doesn't move. With reduced motion it only fades.
