# Form Repeater

Tier: **T2** (without canon.js the items the page starts with are an ordinary form)

A list of items people add to and remove, each a row of fields: team members, line items, links. Items are ordinary [Fields](field.md) in a `.canon-repeater`, written once: Add copies the first item, empty, with the next number in its ids and names. The Add and Remove buttons are [Buttons](button.md) with Canon commands; canon.js copies, numbers, removes and moves focus.

## Elements

```html
<div class="canon-repeater" id="members" data-max="5">
  <div class="canon-repeater-item">
    <div class="canon-field">
      <div class="canon-label"><label class="canon-label-text" for="members-0-team">Team</label></div>
      <div class="canon-select">
        <select id="members-0-team" name="members[0][team]">
          <option value="" hidden>Select team</option>
          <option selected>HR</option>
          <option>Finance</option>
        </select>
      </div>
    </div>
    <div class="canon-field">
      <div class="canon-label"><label class="canon-label-text" for="members-0-name">Name</label></div>
      <div class="canon-text-input">
        <input type="text" id="members-0-name" name="members[0][name]" placeholder="Enter name" value="John Doe">
      </div>
    </div>
    <button type="button" class="canon-button" data-emphasis="low" data-intent="danger" data-display="icon"
            commandfor="members" command="--canon-remove">
      <span class="canon-icon" data-icon="trash" aria-hidden="true"></span>
      <span class="canon-button-label">Remove</span>
    </button>
  </div>
  <button type="button" class="canon-button" data-intent="neutral" commandfor="members" command="--canon-add">
    <span class="canon-icon" data-icon="plus" aria-hidden="true"></span>
    <span class="canon-button-label">Add member</span>
  </button>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-repeater` | yes | The list, with an `id` the buttons name. |
| `.canon-repeater-item` | — | One item: its Fields (or boxes, below) in DOM order, then its Remove button. The page starts with any number (from the server, the values people saved). |
| `<template>` | when the list can start empty | One `.canon-repeater-item`, empty, with `{index}` where the number goes (`id="members-{index}-team"`, `name="members[{index}][team]"`). Used instead of the first item when present. |
| `command="--canon-remove"` | no | The item's last child: a `<button type="button" class="canon-button">`, `commandfor` the repeater. Recommended: danger, low emphasis, icon only. Its label is the author's ("Remove", "Remove member"). |
| `command="--canon-add"` | no | After the items: a `<button type="button" class="canon-button" data-intent="neutral">`, `commandfor` the repeater. Its label is the author's ("Add", "Add member"). |

- **Labels are optional.** With Fields, their labels show over the first item only, as column headers; later items keep theirs for screen readers (visually hidden), so each control is still named by its own label. Without labels, an item holds the boxes themselves (`canon-select`, `canon-text-input`, …), each control named by `aria-label`, and there are no headers.
- **The new item** is the first item as the page wrote it, empty: values, choices (a select goes back to its placeholder option, `value=""`, or its first), checks, `aria-invalid` and messages cleared. canon.js takes the copy before it enhances anything, so drawn parts (date segments, combobox lists) are made fresh. Hidden inputs are cleared too (a row's record id belongs to that row).
- **Numbers:** the first item's number is the first `[n]` in its names (`members[0][name]`). In the copy, that whole number is replaced in ids, names and the attributes that point at ids (`for`, `aria-describedby`, `aria-labelledby`, `aria-controls`, `list`, `commandfor`, `popovertarget`, `data-match`): `members-0-name` becomes `members-3-name`, but `q10-name` keeps its 10. The new number is one past the highest item's, skipping numbers whose ids are taken; numbers aren't reused or closed up after a removal (most servers read `members[0]`, `members[3]` as a list). Names without a number (`team`, repeated) stay as they are, and the copy's ids get `-<number>` added.
- **A list that can start empty** has no item to copy: give a `<template>` instead.
- **Field actions** and messages work in items as in any Field. A message shows under its box; boxes and Remove buttons stay in line.
- To give the list a name ("Members") and say the limit ("Up to 5 members."), put it in a [Fieldset](fieldset.md): the legend and hint describe the list.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-max` | `.canon-repeater` | the most items | no limit | no |
| `data-min` | `.canon-repeater` | the fewest items | `1` | no |
| `data-size` | the repeater or a container | `sm` · `md` · `lg` (xs is sm, xl and 2xl are lg) | theme decides | yes |
| `--canon-repeater-columns` (CSS) | `.canon-repeater` | a `grid-template-columns` value, one track per Field or box: `minmax(0, 2fr) minmax(0, 3fr)`, `10rem minmax(0, 1fr)` | equal columns | yes (custom property) |

- `--canon-repeater-columns` is layout: only the author knows the team names are short and the names long. Set it wherever the page sets its layout (a stylesheet, or `style`).

## Behavior (canon.js)

- **Add** puts the new item after the last one, opening its room (`data-state="opening"` while the theme's animations run), and moves focus to its first control. At `data-max` items, Add is hidden (`hidden`); it comes back when an item goes. With nothing to copy (no items and no template) it stays hidden.
- **Remove** takes its item out, announces "Item removed", closes its room (`data-state="closing"`, its fields disabled and left out of the form meanwhile, then it goes), and moves focus to the next item's first control (the previous item's, for the last; Add's when no items are left). At `data-min` items every Remove is hidden: with the default 1, a single item has none (people clear its fields instead).
- **Item names:** each item is `role="group"`, named "Item 2 of 3" (the `repeater-item` string), kept current as items come and go. An item the author named (`aria-label`, `aria-labelledby`) keeps its name.
- **Events:** the repeater fires `canon-add` and `canon-remove` (bubbling; `detail.item` is the item) after the change.
- **Apps** that add or remove items themselves (or change `data-min` / `data-max`) are followed: the buttons and names update. New items' components (selects, dates, …) are set up as anywhere else.
- **Form reset** restores values, not items: items added since stay.
- **Disabled:** a disabled fieldset around the repeater disables every control in it, the buttons too.
- Without canon.js (`scripting: none`) the buttons are hidden, like every Canon command, and the items the page starts with are an ordinary form.

## Core

- `.canon-repeater` is a column; items are `--canon-repeater-gap` apart (0.5rem by default; themes set it).
- An item is a grid of three rows, label, box and message, that its Fields share (`grid-template-rows: subgrid`), so boxes line up whatever their labels and messages. Boxes without a Field go in the box row. Columns are `--canon-repeater-columns`, or equal; the same gap apart.
- The Remove button sits at the end of the box row, in padding kept for it (`--canon-repeater-remove-size`, by default the control height, plus the gap) while it shows. Hidden Remove buttons give their space back.
- Labels of items after the first are visually hidden (clipped, never `display: none`).

## Accessibility

- Every control keeps its own label (or `aria-label`), so later items are named although their labels don't show.
- Items are groups named by position ("Item 2 of 3"); a Remove button is heard inside its item.
- Focus never gets lost: it moves into a new item, and to a neighbour when one goes. Removal is announced.
- Say the limit in the description (or the fieldset's hint): Add disappears at the limit without a message.

## Strings

`repeater-item` ("Item {index} of {count}"), `repeater-removed` ("Item removed"), translated in `i18n/`.

## Theme obligations

- Space items like rows of a form, closer than separate fields; Add a clear step under the last item.
- Line boxes and Remove buttons up; keep the header labels over their columns.
- Use logical properties (in right-to-left, the columns mirror and Remove moves to the left).

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Reordering (drag, move up / down) | An addition if it comes up (`--canon-move-up`, `--canon-move-down`, then drag) |
| Undo after removing | The app (`canon-remove` gives it the item) |
| A count ("3 of 5") | The author's text, or Count, if it comes up |
| Nested repeaters | Allowed (each button names its own repeater); not designed further |
| Items as cards (fields stacked) | Form Layout, with the repeater's behavior |

## Look

**Sizes (sm / md / lg):** Items and columns 8 / 8 / 12 apart, Add 12 / 16 / 16 under the last item. Remove as tall as the box (32 / 40 / 48, square).

Fields (label 6px over the box), Remove the danger icon button with low emphasis, Add the medium button with a plus. Labels over the first item only.

**Motion:** a new item's room opens (0.2s), then it fades in (0.15s), the Add button moving down with it; a removed item fades out (0.15s), then its room closes (0.2s) and the items under it move up. With reduced motion it only fades.
