# Dialog

Tier: **T1** (a native modal `<dialog>` opened by an invoker command: it traps focus, closes on Escape and returns focus without JavaScript) · polyfills and initial focus are **T2** (canon.js)

A task over the page that has to be finished or dismissed before going on: editing an event, confirming a deletion. Modal: the page behind can't be used. For a short task beside a button that leaves the page usable, a [Popover](popover.md).

## Elements

```html
<button type="button" class="canon-button" commandfor="edit-event" command="show-modal">…Edit event…</button>

<dialog class="canon-dialog" id="edit-event" aria-labelledby="edit-event-title">
  <form method="dialog">
    <header class="canon-dialog-header">
      <h2 class="canon-dialog-title" id="edit-event-title">Edit event</h2>
      <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" commandfor="edit-event" command="close">
        <span class="canon-icon" data-icon="close" aria-hidden="true"></span>
        <span class="canon-button-label">Close</span>
      </button>
    </header>
    <div class="canon-dialog-body">
      <div class="canon-dialog-section">…fields…</div>
      <div class="canon-dialog-section">…fields…</div>
    </div>
    <footer class="canon-dialog-footer">
      <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" commandfor="edit-event" command="close">…Cancel…</button>
      <button type="submit" class="canon-button" data-emphasis="high" data-align="end" value="save">…Save…</button>
    </footer>
  </form>
</dialog>
```

| Element | Required | Notes |
|---|---|---|
| Trigger | yes | A `<button>` with `commandfor` (the dialog's id) and `command="show-modal"`. |
| `dialog.canon-dialog` | yes | An `id`, named by its title (`aria-labelledby`) or `aria-label`. Never written `open`: it opens modal. Anywhere in the page (it is shown over everything). |
| `form` | no | Around the parts, taking no place: `method="dialog"` closes the dialog on submit (its `returnValue` is the submit button's `value`); the app's own form submits as usual. |
| `.canon-dialog-header` | yes | The title and an optional close button (an icon-only minimal neutral [Button](button.md) with `command="close"`, named "Close") at the end. Only these: what the dialog says goes in the body. |
| `.canon-dialog-title` | yes | A heading at the page's level (usually `<h2>`). |
| `.canon-dialog-body` | no | The content: a message, fields. It scrolls when the dialog is taller than the window; header and footer stay. |
| `.canon-dialog-section` | no | In the body: parts of the content, edge to edge, with a line between. |
| `.canon-dialog-footer` | no | Buttons (a Split Button, a Link, a Checkbox, a short text also fit). `data-align="end"` on an item sends it and what follows to the far end: Cancel at the start, Save at the end. |

- **Closing:** a button with `command="close"` (or `request-close`, which lets the app cancel it), a `method="dialog"` form's submit, Escape. Focus goes back to the button that opened it.
- **Alert dialog:** `role="alertdialog"` for a decision that interrupts ("Delete Hackweek?"): the question in the title, its consequence in the body (a paragraph the dialog points at with `aria-describedby`), no close button; the footer's buttons are the answers, a destructive one saying what it does with `data-intent="danger"`. Put `autofocus` on the safe answer.
- **Not for** messages that don't need an answer (a Toast), short tasks beside a button (a Popover), or long flows (a page).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `role` | the dialog | `alertdialog` | dialog | — |
| `closedby` (native) | the dialog | `any`: also a click beside it closes it (never an alert dialog) · `closerequest`: Escape · `none`: only its buttons | `closerequest` | — |
| `data-width` | the dialog | `sm` (a question) · `lg` (a table, a preview) | the theme's (a form) | no |
| `autofocus` (native) | a control inside | where focus starts | the body's first control | — |
| `data-size` | the dialog or a container | `sm` · `md` · `lg`: the controls inside | theme decides | yes |

## Behavior

**The browser (T1):** `show-modal` opens it in the top layer over a backdrop; the page behind is inert; focus moves in and stays; Escape (and, with `closedby="any"`, a click beside it) closes it; focus returns to the opener.

**canon.js (T2):**

- **Focus starts in the content:** to the `[autofocus]` element, else the body's first control, else the dialog itself, not the header's close button.
- **Polyfills** where the browser lacks them: the dialog commands (`show-modal`, `close`, `request-close`) and `closedby` (`any`: a click on the backdrop closes it; `none`: Escape doesn't).

## Core

- Centered, as wide as `--canon-dialog-width` (`sm` 25rem, the default 40rem, `lg` 56rem) and at most the window less 1rem each side, as tall as its content and at most the window less 1rem each side: a column of header, body and footer where only the body scrolls.
- While a dialog is open the page doesn't scroll (`html:has(.canon-dialog:modal)`).

## Accessibility

- A modal dialog (or alert dialog), named by its title; an alert dialog also described by its message. Screen readers announce it on opening.
- The close button is named ("Close"); Escape always works unless `closedby="none"`, in which case the footer must offer a way out.
- Focus starts in the content (a field to fill, or the safe answer), stays inside, and returns to the opener.

## Theme obligations

- The dialog stands apart from the page (the backdrop) and from what's behind it (its edge).
- Header and footer stay put while the body scrolls, and read as parts of the dialog (lines or space).
- Opening and closing motion stops with reduced motion.
- Use logical properties: in right-to-left the close button is on the left and the footer runs from the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A panel from the side or the bottom | [Drawer](drawer.md): this Dialog with `data-side` |
| Steps inside a dialog | Wizard (pattern) |
| A non-modal dialog | [Popover](popover.md) |
| Full-screen dialogs on phones | If it comes up (`data-width="full"`) |
| Asking before closing a dialog with unsaved changes | The app, from `cancel` / `request-close` |

## Look

**Sizes:** Widths 400 / 640 / 896 (`sm`, default, `lg`); 24px corners; header 72px (16 / 16 / 16 / 24 inside), footer 88px (24 inside), body and sections 24 inside, their content 24 apart.

White (dark zinc-900), no frame: a hairline edge (black at 12%, dark white at 12%) and the overlay shadow (0 24px 48px −12px at 18%, 0 4px 12px at 6%; dark 60% and 30%); the page behind white at 85% (dark zinc-950 at 75%) blurred 4px. The title 16px semibold zinc-900 (dark white); the close button a minimal neutral Button (zinc-500 icon); hairline rules (black at 10%, dark white at 10%) under the header, between sections and over the footer, that take no height; footer buttons 12px apart; Cancel a low neutral Button. The widths `sm` and `lg`; opening, it fades in from 98% and the backdrop fades (0.15s); with reduced motion they only fade.
