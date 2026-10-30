# Field

Tier: **T0** (client-side messages and the counter are T2)

## Scope

Field is the **wrapper anatomy** for every control with a label above/beside a box: text-like inputs (`text-input.md`), textarea (`textarea.md`), select (`select.md`), number (`number-input.md`), password (`password.md`), search, combobox (`combobox.md`), sliders (`slider.md`, `range-slider.md`), the date family (`date.md`: date, range, week, inline calendar, day strip), color (`color-picker.md`), swatches (`swatches.md`) and one-time codes (`input-otp.md`). The Field page of the reference shows each of them in a field.

Around fields: [Fieldset](fieldset.md) groups them under a question, [Form Repeater](form-repeater.md) repeats a row of them, [Form Layout](form-layout.md) arranges a whole form (sections, fields side by side).

Checkbox, radio and switch are **not** Fields: their label follows the control and they come in groups. Each is its own component (`checkbox.md`, `radio.md`, `switch.md`), sharing the choice anatomy (`choice.md`); groups use Fieldset (`fieldset.md`).

## Anatomy

```
canon-field                       grid; every slot is a direct child
├── canon-label                   required · the label block: label, "(optional)", info, description (label.md)
├── canon-field-action            optional · a link or button on the label row
├── canon-text-input              the box, always present: text-input.md, or canon-textarea (textarea.md), canon-select (select.md), canon-combobox (combobox.md), canon-password (password.md), canon-number (number-input.md), canon-date (date.md), canon-color (color-picker.md), canon-swatches (swatches.md), canon-otp (input-otp.md); slider: canon-control for now
│   ├── canon-icon                optional · leading
│   ├── canon-text-input-prefix   optional · text
│   ├── <input> / <textarea> / <select>    the native element, no class
│   ├── canon-text-input-suffix   optional · text
│   ├── canon-icon                optional · trailing
│   └── canon-button              optional · trailing actions (clear, show password, copy)
├── canon-field-message           optional · data-intent="danger | warning | success"
└── canon-field-counter           optional, empty: canon.js shows the count (T2)
```

```html
<div class="canon-field">
  <div class="canon-label">
    <label class="canon-label-text" for="email">Work email</label>
    <p class="canon-label-description" id="email-description">Use your company address.</p>
  </div>
  <div class="canon-text-input">
    <span class="canon-icon" data-icon="mail" aria-hidden="true"></span>
    <input id="email" name="email" type="email" required
           aria-describedby="email-description email-message" aria-invalid="true">
    <span class="canon-text-input-suffix" aria-hidden="true">@acme.com</span>
  </div>
  <p class="canon-field-message" id="email-message" data-intent="danger">Enter a valid email address.</p>
</div>
```

- `canon-field` is a grid with every slot as a direct child, so themes place the label above, beside, or inside the box (floating) from the same DOM. The label never wraps the input.
- The box: for text-like inputs it is the [Text Input](text-input.md) component (`canon-text-input`), specified there with its anatomy, states and box actions; textareas are [Textarea](textarea.md) (`canon-textarea`), selects [Select](select.md) (`canon-select`) or [Combobox](combobox.md) (`canon-combobox`), and passwords [Password](password.md); sliders still use the shared `canon-control`. It is **always present**, even without affixes: the frame (border, background, focus ring, status icon) belongs to it, not to the native element. It can also be used without a Field (e.g. a toolbar search), with the native element named by `aria-label`.
- The **main control** is the box's direct `<input>`, `<textarea>` or `<select>` child. It has no class. A select box beside it (a country code: a `canon-select` inside the text input, see [text-input.md](text-input.md)) is a second control, not the main one.
- Box content follows Button's pattern: icon, text, native element, text, icon, in DOM order. Themes may reorder.
- DOM order is label (with its description) → action → box → message → counter. Themes reorder visually (to put the description under the box, `.canon-label { display: contents }` makes its parts grid items); only the box and the label's info button are focusable, so focus order is unaffected.
- **One helper text:** the label's description (`canon-label-description`). There is no separate hint under the box; below the box is for messages.
- `canon-field-action` goes on the element itself: `<a class="canon-field-action" href="…">Forgot password?</a>`, or a `canon-button` that also carries `canon-field-action`.

## Rules

1. **Inside a `canon-field`, text-like inputs and textareas carry a `placeholder` attribute.** A bare `placeholder` (empty value) is enough.
   - It is not content: it is the only signal CSS has for "this field is empty" (`:placeholder-shown`). Floating labels can't work without it.
   - Real text is an example value. Themes show it as their system does (floating-label themes only on focus).
   - Exempt: `<select>` and date/time/color/range/file inputs, which never look empty.
   - Standalone `canon-control` (no field, no label): optional.
   - A missing attribute is an authoring error. Themes' safety net keeps the field usable (a floating label stays floated), and `canon.debug.css` flags it.
   - Verified: bare `placeholder` matches `:placeholder-shown` in Chromium. Pending: Safari and Firefox (`reference/checks/placeholder-shown.html`). If either fails, the canonical spelling becomes `placeholder=" "`.
2. **Affix text is `aria-hidden`.** The label and description must carry the meaning ("Price in USD", not "Price" + `$`). Affixes hold text only; a control beside the value (a country code) is a select box in the text input, with its own accessible name.
3. **Description and message are wired with `aria-describedby`** on the native element.
4. **Required is native `required`.** The theme draws any symbol (e.g. an asterisk). **Words are the author's:** "(optional)" is written in the label text (`canon-label-optional`), never generated by CSS. See `label.md`.
5. **Expected length** is expressed with native `size` or `maxlength`. Themes may use them to size the box (the box shrinks to fit and the browser sizes the input from `size`).
6. **`type="search"` has no native clear button** (core removes it; it can't be themed). To offer clearing, add a trailing `canon-button`. Escape still clears natively.
7. **Side by side with a button:** a theme may give fields and buttons different heights. Containers align them; the default is `align-items: last baseline`, which lines up the input's text with the button's label.

## A field that names a group

When the box holds more than one control (a range slider's two thumbs, a date range's two dates) or a set of choices (swatches), the label names the group, not one control:

```html
<div class="canon-field" role="group" aria-labelledby="stay-label">
  <div class="canon-label"><span class="canon-label-text" id="stay-label">Stay</span></div>
  <div class="canon-date">
    <input type="date" name="from" aria-label="Check-in">
    <input type="date" name="to" aria-label="Check-out">
  </div>
</div>
```

- The label is a `<span id>`, not a `<label for>`; the field (or, for swatches, the `role="radiogroup"` box) is labelled by it, and each control has its own short name (`aria-label`).
- Description and message go in each control's `aria-describedby` (swatches: the group's).
- An error is the message; ARIA has no invalid state for a group (as in [Fieldset](fieldset.md)), so the controls that are wrong carry `aria-invalid`.

## Label beside the box (author hint)

```html
<form class="canon-form" data-label="start">
  <div class="canon-field">… Display name …</div>
  <fieldset class="canon-fieldset">… Notifications (radios) …</fieldset>
  <div class="canon-choice">… Show my profile publicly (switch) …</div>
</form>
```

| `data-label` | On | Labels |
|---|---|---|
| absent, `above` | a field or a container | above the box (`above` inside a `start` container puts them back) |
| `start` | a field | beside the box, always |
| `start` | a form or any container | beside the boxes of the fields inside while the container has 32rem of room (a size container; a Form Layout's form already is one); above below that |

- **Beside:** the label at the box's inline start, in a column `--canon-label-width` wide (default 33%), `--canon-label-gap` (1rem) from the box, level with the box's first line (a textarea's first line, not its middle). The label's description stays under it; the message and counter go under the box; a field action under the label.
- **In the same container:** a [Fieldset](fieldset.md)'s legend (and hint) takes the label column, its items beside it (a horizontal fieldset: the legend first on the row); a single checkbox or switch starts where the boxes do.
- **Fields side by side** (a [Form Layout](form-layout.md) row, a [Form Repeater](form-repeater.md) item) keep their labels above.
- **When:** forms people edit and scan (account details, settings, a record's properties, an inspector). A form filled in once, top to bottom, reads faster with labels above, and long or translated labels fit better there.
- A hint in the `canon.hints` layer, like `data-size`: only the author knows the form's purpose.

## Message

| `data-intent` | Meaning | Native element |
|---|---|---|
| `danger` | Error | add `aria-invalid="true"` |
| `warning` | Accepted but questionable | — (ARIA has no warning state; the message is the hook) |
| `success` | Validated | — |

For client-side validation, render the message **empty and present** so it works as a live region; themes hide it while `:empty`:

```html
<p class="canon-field-message" id="email-message" aria-live="polite"></p>
```

**canon.js fills it (T2).** In a field whose message is empty, the browser's own validation (`required`, `type`, `pattern`, `minlength`, and custom checks such as Password's rules or confirmation) shows there instead of the browser's bubble:

- on a failed submit, every invalid field shows its message, and the first gets focus;
- on leaving a changed field that is still invalid;
- as people type, an open message updates, and clears once the value is valid (also when another field fixes it: a confirmation).

It writes the browser's `validationMessage` (localized by the browser, or the custom message), sets `data-intent="danger"` on the message and `aria-invalid="true"` on the control, and marks the message `data-state="validation"`. A message the author wrote is never touched. Forms with `novalidate` are left alone.

## States

| State | Hook | Theme reads it as |
|---|---|---|
| Focus | `:focus-within` on `canon-control` | Focus ring on the box |
| Disabled | `disabled` on the native element | `.canon-field:has(:disabled)` |
| Read-only | `readonly` | `:read-only` |
| Invalid (server) | `aria-invalid="true"` + `danger` message | Error styling |
| Invalid (browser) | `:user-invalid` | Same styling. canon.js (T2) copies `validationMessage` into an empty message, below |
| Warning | `.canon-field:has(.canon-field-message[data-intent="warning"])` | Warning styling |
| Success | `.canon-field:has(.canon-field-message[data-intent="success"])` | Success styling |
| Empty / filled | `:placeholder-shown` (only when `placeholder` is present) | Floating labels |
| Autofilled | `:autofill` | Theme obligation: override browser autofill colors |

## Counter (T2, `canon.js`)

```html
<div class="canon-field">
  <div class="canon-label">
    <label class="canon-label-text" for="bio">Bio</label>
    <p class="canon-label-description" id="bio-description">Up to 160 characters.</p>
  </div>
  <div class="canon-textarea">
    <textarea id="bio" name="bio" rows="3" maxlength="160" placeholder aria-describedby="bio-description bio-message"></textarea>
  </div>
  <p class="canon-field-message" id="bio-message" aria-live="polite"></p>
  <p class="canon-field-counter"></p>
</div>
```

- `canon-field-counter`: empty, after the message. canon.js shows how much of the control's `maxlength` is used ("12 / 160") and, for screen readers, what is left ("148 characters left"). Without canon.js it stays empty and hidden. It sits at the end of the message's row.
- **The limit is `maxlength`** on the control (a text input or textarea), and with a counter it is **soft**. A hard limit fails quietly: typing stops and pasted text is cut without saying what was lost. So canon.js moves `maxlength` to `data-maxlength` (again if an app puts it back), and people can type or paste past it, then shorten. Without canon.js, `maxlength` stays a hard limit. Without a counter, it is native everywhere.
- **Past the limit** the control is invalid with "Use 160 characters or fewer." (`setCustomValidity`). Unlike other validation, which waits until people leave the field, this shows at once (also for a value that starts too long): the box's error state (`aria-invalid="true"`) and the field's message, cleared as soon as the text fits. So a field with a counter needs a message (an empty one is enough).
- **The characters that are too many** are marked in the control itself. A textarea can't color part of its text, so canon.js draws a copy of the text behind the control (`.canon-limit-mirror`, `aria-hidden`: same font, padding, wrapping and scroll position), with the excess in a `<mark class="canon-limit-excess">`, and the control's own text turns transparent (`data-state="over"` on it). The caret, selection, spellcheck and typing stay the control's.
- **The last tenth** of the limit: `data-state="near"` on the counter; past it `data-state="over"`. Screen readers hear what is left (or how many too many) after a second's pause in typing, only once it is near.
- Characters are counted as `maxlength` counts them (a line break is one).
- Say the limit in the description too.
- Strings: `count`, `characters-left-*`, `characters-over-*`, `too-long-*` (plural forms), translated in `i18n/`.

The message's type (10 / 12 / 14px) in its muted zinc-500 (dark zinc-400), tabular figures, at the end of the message's row; near the limit amber-700 (dark amber-300), over it red-700 (dark red-300), both medium weight. The characters past the limit: the danger button's medium colors, red-700 on red-400 at 15% (dark red-300 on red-500 at 20%), corners 2px; the caret keeps the text color, the selection a translucent blue.

## Textarea

Textareas have their own component: [Textarea](textarea.md) (`canon-textarea`), with fixed, growing and resizable heights.

## Select

Selects have their own component: [Select](select.md) (`canon-select`), with the styled list, groups, separators and rich options.

## Box actions (T2, `canon.js`)

Trailing buttons get behavior from the platform's **invoker commands**: `commandfor` names the target, `command` names a Canon custom command. `canon.js` handles the command; browsers without invoker commands get a polyfill for custom commands.

| Command | Does | State the theme can style |
|---|---|---|
| `--canon-clear` | Empties the target, fires `input` and `change`, focuses it | Core hides the button while the field is empty (`:placeholder-shown`) |
| `--canon-toggle-password` | Switches `type` between `password` and `text` | `aria-pressed` (label stays "Show password") |
| `--canon-copy` | Copies the target's value (or text), announces "Copied" ([Button: Copy](button.md#copy-t2-canonjs)) | `data-state="copied"` for 2 seconds |

```html
<div class="canon-text-input">
  <input id="password" name="password" type="password" placeholder>
  <button type="button" class="canon-button" data-emphasis="minimal" data-display="icon"
          aria-pressed="false" commandfor="password" command="--canon-toggle-password">
    <span class="canon-icon" data-icon="eye" aria-hidden="true"></span>
    <span class="canon-button-label">Show password</span>
  </button>
</div>
```

- Without scripting (`@media (scripting: none)`), core hides command buttons, so there are no dead buttons.
- The "Copied" announcement is the string `--canon-text-copied`, translated by `i18n/<lang>.css` (see decisions: Strings).

## Drawn by the theme, never written in HTML

| Visual | Trigger |
|---|---|
| Required marker | A required control beside the label (`label.md`), on `canon-label-text` |
| Error / warning / success icon in the box | `aria-invalid`, `:user-invalid`, message intent |
| Select chevron | `.canon-select` (select.md) |

## Theme obligations

- Support label placement for the theme's own system from the same DOM; never require markup changes.
- **Space slots with margins, never `row-gap`.** The field grid has a fixed row per slot; absent slots leave empty rows, and grid gaps still apply between empty rows.
- An author hint wins over the theme (`canon.hints` layer). E.g. a `canon-field-action` button with `data-size="sm"` stays that size; a theme that wants a one-line label row uses negative block margins, not a smaller size.
- Hide an empty `canon-field-message` (`:empty`).
- Style `:autofill`.
- Use logical properties (RTL). Affix text keeps its own direction (`unicode-bidi: plaintext` in core).
- **The main control owns its whole box.** Clicking anywhere in the box (padding, icons, affix text, status icon, select arrow) focuses or opens the native element; only trailing buttons and controls inside an affix keep their own clicks. Box icons, affix text and decorations ignore the pointer.
  - **Select:** core extends it exactly to both borders. Themes set `--canon-select-start` (padding, + icon and gap with a leading icon) and `--canon-select-end` (gap + arrow + padding, + the status icon when shown). Exact, because a native popup is as wide as the select.
  - **Input:** affix widths are unknowable, so core extends it 20rem past both edges with matching padding (text doesn't move) and the box clips the overshoot (`overflow: clip`). Paint order keeps trailing buttons on top. No theme values needed.
  - **Textarea:** 20rem overshoot at the start; on the other sides it takes over the box padding exactly, so its scrollbar and resize handle sit at the box's inner edge. Themes set `--canon-textarea-inset-block` and `--canon-textarea-inset-end`. Inputs and textareas measure their content box, so `rows × 1lh` and the 4rem minimum are unaffected.
- A theme may give fields and buttons different heights, and may ignore the size hint where it has one size.

## Look

**Label:** above, description under it; beside with `data-label="start"`, start-aligned

**Description / message:** message below, after an icon in its color (error triangle-alert; warning circle-alert, success circle-check). Filling in (an error after leaving the field or a submit), it slides down 4px and fades in (0.15s) while its room opens, so the form under it moves instead of jumping (where the browser can animate to its height); cleared, it goes at once. With reduced motion it appears at once

**Status icon:** none in the box

**Required:** red `*` 4px after the label

## Deferred

- `data-content="code"` on textarea: monospace, tab width, no wrapping.

## Out of scope (for now)

- Enter-to-submit behavior.
