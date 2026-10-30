# Drawer

Tier: **T1** (a [Dialog](dialog.md): a native modal `<dialog>`) · polyfills and initial focus are **T2** (canon.js, as for Dialog)

A Dialog that slides in from the side of the window: filters or a record's details, the app's navigation on a phone. Other systems split it into a drawer (navigation) and a side sheet (content); in Canon both are a Drawer. Modal, like a dialog: the page behind waits.

## Elements

```html
<button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" commandfor="filters" command="show-modal">…Filters…</button>

<dialog class="canon-dialog" id="filters" data-side="end" aria-labelledby="filters-title">
  <form method="dialog">
    <header class="canon-dialog-header">
      <h2 class="canon-dialog-title" id="filters-title">Filters</h2>
      <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" commandfor="filters" command="close">…Close…</button>
    </header>
    <div class="canon-dialog-body">…</div>
    <footer class="canon-dialog-footer">
      <button type="reset" class="canon-button" data-emphasis="low" data-intent="neutral">…Reset…</button>
      <button type="submit" class="canon-button" data-emphasis="high" data-align="end">…Show 24 jobs…</button>
    </footer>
  </form>
</dialog>
```

A Drawer is a [Dialog](dialog.md) with `data-side`: the same element, parts, opening, closing (Escape, `command="close"`, `closedby`), focus and naming. Everything in Dialog's spec applies; this page lists what differs.

- **`end`** (the default choice): content about what's on the page (filters, details, an edit form).
- **`start`**: the app's navigation on a small screen, opened by a menu button; the body can be a `<nav>` (`class="canon-dialog-body"`, named).
- **Not a Drawer:** a panel that stays beside the content while people keep working (Sidebar, Split Pane); a decision (an alert dialog is centered: `role="alertdialog"` doesn't take `data-side`).
- `closedby="any"` suits drawers that only show or filter (a click beside them closes them); a form with unsaved input keeps the default.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-side` | the dialog | `start` · `end` (logical: `end` is the right in left-to-right text, the left in right-to-left) | — (a centered Dialog) | no |
| `data-width` | a drawer | `sm` (navigation) · `lg` (details) | the theme's (filters, a form) | no |

Dialog's other attributes (`closedby`, `autofocus`, `data-size`) apply as they are.

## Core

- At its edge, `--canon-drawer-inset` (the theme's) away from the window's top, side and bottom; the window's height less that; `--canon-drawer-width` wide (`sm` 20rem, the default 30rem, `lg` 40rem), at most the window less 3rem so the page shows beside it.
- Header, body and footer as in a Dialog: only the body scrolls; with a footer, it stays at the bottom of the drawer.

## Accessibility

As a Dialog: a modal dialog named by its title, focus inside from the content's first control, Escape to close, focus back to the opener. A navigation drawer's links are in a named `<nav>`.

## Theme obligations

- The drawer reads as belonging to its edge, and slides from it (none with reduced motion).
- Use logical properties: `start` and `end` follow the text's direction, the slide too.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A panel from the bottom (a bottom sheet, for phones) | If it comes up (`data-side="bottom"`, with dragging to dismiss) |
| A non-modal panel beside the content | Sidebar, Split Pane |

## Look

**Sizes:** 320 / 480 / 640 wide (`sm`, default, `lg`), 8px from the window's top, side and bottom; Dialog's header (72px), body and footer (88px).

Dialog's panel as it is (white, dark zinc-900; the hairline edge and the overlay shadow; 24px corners all round) floating 8px in from its edge; Dialog's backdrop. It slides in from its edge in 0.25s (ease-out) and back out; none with reduced motion.
