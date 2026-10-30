# Input OTP

Tier: **T2** (without canon.js it is one text field)

A one-time code: one native text input in a `.canon-otp` box, its `maxlength` the code's length. canon.js draws a cell per character, in groups, and keeps the input over them, invisible: typing, pasting, the browser filling a code it received (`autocomplete="one-time-code"`), the label and the form value all stay the input's.

## Elements

```html
<div class="canon-field">
  <div class="canon-label"><label class="canon-label-text" for="code">Verification code</label></div>
  <div class="canon-otp" data-groups="3 3">
    <input type="text" id="code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6">
  </div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-otp` | yes | The box. In a [Field](field.md) it takes the control's place; it is as wide as its cells. |
| `<input>` | yes | Its only child: `type="text"` (or `password`), `maxlength` (the length), `autocomplete="one-time-code"`. Named by a `<label for>` (in a Field) or `aria-label`. |

- **One input, not one per cell:** the browser fills a received code into it, a pasted code lands in one place, screen readers hear one field with its value, and the form submits one value.
- **The value is the characters alone**: groups are only drawn (`279279`, not `279-279`).

### What canon.js adds

Themes style these; authors don't write them.

```html
<div class="canon-otp" data-groups="3 3">
  <input …>                                         <!-- over the cells, invisible -->
  <div class="canon-otp-cells" aria-hidden="true">
    <span class="canon-otp-group">
      <span class="canon-otp-cell">2</span>          <!-- data-active: the caret's cell -->
      <span class="canon-otp-cell" data-placeholder="0"></span>   <!-- empty: its placeholder character -->
      …
    </span>
    <span class="canon-otp-separator"></span>       <!-- between groups -->
    <span class="canon-otp-group">…</span>
  </div>
</div>
```

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `maxlength` (native) | input | the code's length | — (required) | — |
| `data-groups` | `.canon-otp` | group sizes, space-separated, adding up to `maxlength` (`"3 3"`, `"2 2 2"`) | one group | no |
| `inputmode` (native) | input | `numeric`: digits only (and a number pad on phones) | letters and digits | — |
| `type` (native) | input | `password`: each filled cell shows a dot | `text` | — |
| `placeholder` (native) | input | one character per cell (`000000`) | none | — |
| `data-size` | the field, the box or a container | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` (three-size themes: xs is sm, xl and 2xl are lg) | theme decides | yes |

Everything else is native: `pattern` (the browser's check on submit), `required`, `disabled`, `readonly`, `aria-invalid`, `aria-describedby`, `autocapitalize`.

## Behavior (canon.js)

- **Characters:** only letters and digits are kept (digits only with `inputmode="numeric"`); anything else typed is ignored.
- **The caret's cell** shows focus. A filled one is selected, so typing replaces it and moves on; past the value the caret waits in the next empty cell (with a full code, the last cell).
- **Pointer:** a press picks the cell under it, or the first empty one past the value. Focus from Tab or the label starts after the value.
- **Keys:** Left and Right move a cell; Home or Up go to the first, End or Down past the value. Backspace and Delete work as in any field (later characters move up).
- **Paste:** the code is cleaned (`123-456` becomes `123456`). A whole code replaces the value; a part is inserted at the caret. The input gets `input` (`insertFromPaste`).
- **Autofill:** a code the browser fills in (`autocomplete="one-time-code"`) is cleaned and drawn.
- **Apps** that set the value in code fire `input` on the input; canon.js redraws. Form resets are followed.
- Codes read left to right in every language: the cells keep their order in right-to-left.

Without canon.js the input is one text field, about as wide as the code (typed `attr()`; elsewhere 8 characters wide).

## States

| State | Hook | Notes |
|---|---|---|
| Focus | `.canon-otp-cell[data-active]` | The caret's cell, while the input has focus. |
| Hover | the box's `:hover` | On every cell but the active one. |
| Error | `aria-invalid="true"` on the input (or `:user-invalid`) | With a danger message, in a Field. |
| Disabled | `disabled` | |

## Core

- Without canon.js the input is sized by its `maxlength` (`1.5ch` a character). With canon.js it covers the box, `opacity: 0`, over `.canon-otp-cells`: a flex row of groups `--canon-otp-gap` apart (default 0.75rem), `direction: ltr`.
- Cells are square at the control height (`--canon-control-block-size`), the control's font size, tabular figures. An empty cell's `::before` shows its `data-placeholder`.

## Accessibility

- One labelled text input: its name, value, description and state are the native ones. The cells are `aria-hidden`.
- `autocomplete="one-time-code"` lets browsers and phones offer a code from a message; `inputmode="numeric"` brings up a number pad.
- Focus is shown on the cell where typing will go; themes show it by more than color (the ring).

## Theme obligations

- Cells visibly separate, the groups apart; the active cell clearly marked; an empty active cell shows where typing goes (a caret).
- Text Input's states on the cells: hover, focus, error, disabled.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Submitting the form when the code is complete | An option if it comes up (`data-autosubmit`); apps can listen for `input` with a full value |
| Success and warning (data-intent) | With the rest of Text Input's intents, if needed |
| A resend link and countdown | The app, next to the field |

## Look

**Sizes (sm / md / lg):** Cells 32 / 40 / 48 square, text 12 / 14 / 16 (Text Input's). Groups 12 / 14 / 16 apart, the separator 8 / 12 / 16 long. Corners 4 / 8 / 12 at a group's ends.

Cells are Text Input's frame (white, a zinc-200 line; dark zinc-900, zinc-700), joined in a group by one line between neighbours; a group of three is 96 / 120 / 144 wide. The separator is a 1px zinc-300 line (dark zinc-700). The states, Text Input's: hover zinc-400 on every cell; the active cell blue-600 with a 3px blue-100 ring (dark blue-400, blue-900) and, empty, a blinking caret (steady with reduced motion); error red; disabled zinc-50 cells with zinc-400 text; the placeholder in zinc-400 (dark zinc-500).
