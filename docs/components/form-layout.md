# Form Layout

Tier: **T0** (layout; a reveal's disabling is T2)

How a whole form is arranged: the space between what it holds, sections with a title, fields side by side, a settings layout with the sections' titles beside their fields, questions that appear after a choice, and the buttons at the end. Everything inside is ordinary [Fields](field.md), [Fieldsets](fieldset.md), [Form Repeaters](form-repeater.md) and choices.

## Elements

```html
<form class="canon-form" data-layout="aside">
  <section class="canon-form-section" aria-labelledby="profile-title">
    <header class="canon-form-section-header">
      <h2 class="canon-form-section-title" id="profile-title">Profile</h2>
      <p class="canon-form-section-description">Shown on your public page.</p>
    </header>
    <div class="canon-form-row">
      <div class="canon-field">… First name …</div>
      <div class="canon-field">… Last name …</div>
    </div>
    <div class="canon-field">… Bio …</div>
  </section>

  <section class="canon-form-section" aria-labelledby="contact-title">
    <header class="canon-form-section-header">
      <h2 class="canon-form-section-title" id="contact-title">Contact</h2>
    </header>
    <fieldset class="canon-fieldset">
      <legend class="canon-fieldset-legend">How should we contact you?</legend>
      <div class="canon-choice">… Email (radio) …</div>
      <fieldset class="canon-form-reveal">
        <div class="canon-field">… Email address …</div>
      </fieldset>
      <div class="canon-choice">… Phone (radio) …</div>
    </fieldset>
  </section>

  <div class="canon-form-actions" data-sticky>
    <button type="submit" class="canon-button" data-emphasis="high">…Save…</button>
    <button type="reset" class="canon-button" data-emphasis="low" data-intent="neutral">…Discard changes…</button>
  </div>
</form>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-form` | yes | On the `<form>` (or the element that holds a form's parts). Stacks what it holds a step apart. A size container (`canon-form`) for the rows and the aside layout. |
| `.canon-form-section` | no | A `<section>` named by its title (`aria-labelledby`). Starts with its header; then fields, fieldsets, rows, repeaters. |
| `.canon-form-section-header` | with a section | A `<header>`: the title and an optional description, nothing else. |
| `.canon-form-section-title` | with a header | A heading (`<h2>`, `<h3>`…) at the page's level. |
| `.canon-form-section-description` | no | A `<p>` under the title. |
| `.canon-form-row` | no | Fields side by side (only Fields). |
| `.canon-form-reveal` | no | A `<fieldset>` right after a `.canon-choice` (in a Fieldset, or alone): shown while that choice is checked. |
| `.canon-form-actions` | no | The buttons at the end: the main action first (DOM order is reading order; a theme may place it last). A form that edits something saved ends with a [Save Bar](save-bar.md) instead: it also says what changed and keeps it safe. |

- **Sections or not:** a short form is fields and actions; a long one is split into sections that each answer one thing ("Profile", "Notifications").
- **Rows** are for fields that belong on one line (City · Postcode, First · Last name, card number · expiry · CVC). Their boxes line up whatever their labels, descriptions and messages (the row's three grid rows, label / box / message, shared by its Fields), labels start together at the top. Columns share the width; `--canon-form-columns` sets them like `grid-template-columns` (`minmax(0, 2fr) minmax(0, 1fr)`), as layout. When the form is narrower than 24rem the row stacks.
- **A reveal** is the follow-up to a choice: a radio's question ("Email address" after "Email"), a checkbox's details. It shows while the choice before it is checked (CSS). canon.js disables it while hidden, so its fields are neither checked nor sent. Without canon.js the hidden fields are still sent and checked, so don't make them `required` unless the server checks which choice was made.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-layout` | `.canon-form` | `aside`: each section's header in a side column, its fields beside it (settings pages) | stacked | no |
| `data-sticky` | `.canon-form-actions` | (present): the actions stay at the bottom of the window while the form scrolls | in place | no |
| `data-size` | the form or a container | `sm` · `md` · `lg` | theme decides | yes |
| `--canon-form-columns` (CSS) | a row | a `grid-template-columns` value | equal | yes (custom property) |
| `--canon-form-aside` (CSS) | the form | the header column's width | `33%` | yes |

- `data-layout` and `data-sticky` are author hints (the `canon.hints` layer): only the author knows a form is a settings page read section by section, or long enough to keep its buttons in view.
- **Aside** applies when the form is at least 40rem wide; narrower, sections stack.

## Core

- `.canon-form`: a block and an inline-size container named `canon-form`. Sections: `display: flow-root`. Rows: a grid of three rows (label / box / message) and a column per field (`--canon-form-columns`, or equal), each Field spanning the three rows as a subgrid; below 24rem a column. Actions: a wrapping flex row. A reveal: a reset fieldset, `display: none` while the choice before it isn't checked.
- Aside (hint): the header floats to the inline start at `--canon-form-aside`; everything else in the section, and the actions, start `--canon-form-aside` + `--canon-form-aside-gap` in, and are at most the width left (so a full-width part, a Description List, doesn't run past the form).
- Sticky (hint): `position: sticky` at the block end.

## Accessibility

- Sections are landmarks of the form named by their titles; titles are headings at the page's level, so the form reads as an outline.
- A reveal follows its choice in the DOM, so it is read and tabbed in order; hidden, it is out of the tab order (and, with canon.js, disabled).
- Sticky actions must not cover the focused field: themes keep them short (one row of buttons).
- Rows keep each field's own label; on narrow screens they stack in reading order.

## Theme obligations

- Space fields a step apart and sections a larger one; show where a section ends.
- Section titles clearly above field labels in the type hierarchy.
- A reveal visibly attached to its choice.
- Sticky actions on the page's background, set off from the scrolling content.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Labels beside their boxes (horizontal fields) | `data-label="start"` on the form ([Field](field.md#label-beside-the-box-author-hint)) |
| A reveal driven by a select | If it comes up |
| Multi-step forms | Wizard (pattern) |
| An error summary at the top | With validation, if it comes up |

## Look

**Sizes (sm / md / lg):** Steps 12 / 16 / 20px (between fields, rows' columns, header to fields); sections 24 / 32 / 40px apart with the line halfway; titles 14 / 16 / 18px on 20 / 24 / 28px lines; actions a section's step under the content.

Built from the system's spacing (Fieldset's step between fields). Titles semibold zinc-900 (dark white), descriptions in the label description's type and zinc-500 (dark zinc-400); section lines hairline rules (black at 10%, dark white at 10%). Actions 8px apart; sticky ones on white (dark zinc-950) with a hairline rule above, 12px above and below. Aside: the header in the first third, 32px from the fields. A reveal: a 2px zinc-200 line (dark zinc-700) under the choice control's middle, its fields where the choice's label starts.
