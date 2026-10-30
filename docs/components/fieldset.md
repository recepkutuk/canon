# Fieldset

Tier: **T0**

Groups choices (checkboxes, radios, switches) or fields under one question.

```
canon-fieldset                    <fieldset>
├── canon-fieldset-legend         <legend>, first child, required
├── canon-fieldset-hint           optional
├── canon-choice / canon-field …  the items
└── canon-fieldset-message        optional · data-intent="danger | warning | success"
```

```html
<fieldset class="canon-fieldset" aria-describedby="regions-hint regions-message">
  <legend class="canon-fieldset-legend">Regions</legend>
  <p class="canon-fieldset-hint" id="regions-hint">Where the service runs.</p>
  <div class="canon-choice">
    <input type="checkbox" id="regions-eu" name="regions" value="eu">
    <label class="canon-choice-label" for="regions-eu">Europe</label>
  </div>
  <div class="canon-choice">
    <input type="checkbox" id="regions-us" name="regions" value="us">
    <label class="canon-choice-label" for="regions-us">United States</label>
  </div>
  <p class="canon-fieldset-message" id="regions-message" data-intent="danger">Select at least one region.</p>
</fieldset>
```

- DOM order is legend → hint → items → message. Themes reorder visually (a theme may put the error above the items, or the hint and error below them).
- Hint and message are wired with `aria-describedby` **on the fieldset**.
- **Invalid group:** ARIA has no invalid state for a group, so a message with `data-intent="danger"` is the signal (`aria-invalid` on a fieldset is a contract error).
  - Typical case: "select at least one" (roles, notification channels, regions, weekdays). HTML can't express it (`required` on a checkbox means that box must be checked), so the error always comes from the server or the app's JS.
  - Themes decide whether to mark every checkbox in the group or only the group (Canon marks every checkbox).
- For client-side validation, render the message empty and present with `aria-live="polite"`; themes hide it while `:empty`.
- **Disabled group:** native `disabled` on the fieldset disables every control in it (`:disabled` matches them).
- Core lays the fieldset out as a wrapping flex row: legend, hint and message take a line each; items too, unless the group is horizontal. The legend is floated, which turns it from a "rendered legend" (drawn in the border) into an ordinary item, so themes order and space it like any slot.
- Grouping fields (a date split into day / month / year) works the same way. Laying out whole forms is [Form Layout](form-layout.md)'s job.

## Orientation (author hint)

```html
<fieldset class="canon-fieldset" data-orientation="horizontal">
```

| `data-orientation` | Items |
|---|---|
| absent | the theme decides (Canon stacks them) |
| `horizontal` | in a row, wrapping when the row runs out |
| `vertical` | stacked |

A hint in the `canon.hints` layer, like `data-size`: only the author knows whether the labels are short enough to share a row.

In a container with `data-label="start"` ([Field](field.md#label-beside-the-box-author-hint)), the legend and hint take the label column and the items sit beside them, lined up with the fields' boxes.

## Theme obligations

- Keep items' top margins equal, so items in a horizontal row line up.
- Space stacked fields wider than choices (Canon: fields 16px apart, choices 8 / 8 / 12px).
- Space slots with margins (no gaps that apply between absent slots).
- Hide an empty message (`:empty`).

## Look

**Legend:** The label's type (12 / 14 / 16px medium), a red `*` when required

**Hint / message:** hint in the label description's type, 4 / 6 / 8px under the legend; items 12 / 16 / 16px under them and 8 / 8 / 12px apart; message (the field's, with its icon) 12 / 16 / 16px after them. Switches reach 2px past their box, so their steps grow by that (4px more between two) and the visible spaces are the same

**Error:** the danger message

## Deferred

- **Conditional reveal** (choosing an option reveals a nested field): done in [Form Layout](form-layout.md) (`.canon-form-reveal` after a choice).
