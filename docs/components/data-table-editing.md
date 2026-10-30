# Data Table: editing cells

Tier: **T2** (without canon.js the cells show their values, and fields in a form submit them unchanged)

Changing a value where it's shown, without opening the record: a target, an owner, a status, a date. Part of the [Data Table](data-table.md). One cell at a time, each change saved on its own or, in a form with a [Save Bar](save-bar.md), all together.

## Elements

```html
<div class="canon-data-table">
  <div class="canon-table">
    <table>
      <caption class="canon-visually-hidden">Hiring KPIs</caption>
      <thead>
        <tr>
          <th scope="col">KPI</th>
          <th scope="col" data-type="number" data-align="end" data-edit>Target</th>
          <th scope="col" data-type="text" data-edit>
            Owner
            <template class="canon-data-table-editor">
              <div class="canon-combobox" data-search="list">
                <select>
                  <option value="ada" data-seed="3">Ada Lovelace</option>
                  <option value="grace" data-seed="5">Grace Hopper</option>
                </select>
              </div>
            </template>
          </th>
          <th scope="col" data-type="choice" data-options="On track, At risk, Off track" data-edit>Status</th>
          <th scope="col" data-type="date" data-edit>Review</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Time to hire</th>
          <td data-value="40">40 days</td>
          <td data-value="ada">…Ada Lovelace's avatar and name…</td>
          <td data-value="On track"><span class="canon-tag" data-intent="success">…On track…</span></td>
          <td data-edit="none"><time datetime="2026-11-30">30 Nov 2026</time></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| An editable column | yes | Its header `th` has `data-edit`. Its cells are editable, except those marked `data-edit="none"`. |
| The editor | no | What a cell is edited with. By default it follows the column's `data-type`: `text` a [Text Input](text-input.md), `number` a Text Input with `type="number"`, `date` a [Date](date.md), `choice` a [Select](select.md) of its `data-options`. Without a `data-type` it is a Text Input. A `template.canon-data-table-editor` in the header gives another: one box (`.canon-text-input`, `.canon-number`, `.canon-select`, `.canon-combobox`, `.canon-date`) holding its control without a name or id. The control's own `min`, `max`, `step`, `pattern`, `maxlength` and `required` apply. |
| The value | yes | As for sorting: the cell's `data-value`, else a `<time datetime>` in it, else its text. In a form, a field in the cell holds it instead (below). |
| A field | in a form | `<input hidden name="kpi[3][target]" value="40">` in the cell: its value is the cell's, and it submits with the form. A text input with `hidden`, not `type="hidden"`, whose value can't be told from its default. |
| A checkbox or switch | no | A [Checkbox](checkbox.md) or [Switch](switch.md) in an editable column's cell is changed where it is: no editing, the same saving. The select column is never editable. |

- **Which columns:** the few that people change often. Each editable cell is a stop for Tab; a table where most cells are edited is a spreadsheet, which this is not (see Not in the contract).
- **Cells the person can't change** (a computed total, a locked record) are `data-edit="none"`: on a cell, a row, or the whole data table (a view-only mode).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-edit` | a header `th` | (present) its cells can be edited | not editable | — |
| `data-edit` | a cell, a row or the data table | `none`: not editable here | editable where the column is | yes (row and data table to their cells) |
| `data-type`, `data-options` | a header `th` | as [Data Table](data-table.md): they also pick the editor | text | — |
| `data-key` | a header `th` | the column's name in events | its text | — |
| `data-state` | a cell | `editing` · `saving` · `saved` · `failed` · `changed` (canon.js) | — | — |

## Behavior (canon.js)

- **Ready:** canon.js puts each editable cell's content in a button (`.canon-data-table-edit`) that fills the cell. Nothing else changes: the content looks and reads as before.
- **Starting:** a click, Enter, Space or F2 on the cell opens its editor in the cell, holding the value, all of it selected. Starting to type a letter or number (text and number cells) opens it with what was typed in place of the value. Pasting on the cell (not while editing) puts the pasted text in as the new value and saves it.
- **While editing:** the cell is `data-state="editing"`; its width and the row's height hold, so the table doesn't move. The editor's own keys work (a Select's or Combobox's list, a Date's calendar). A Select's or Combobox's list opens with it. An editor wider than the cell (a date, a list) reaches over the next cells, or the other way when the frame's edge is near.
- **Finishing:**
  - Enter, or leaving the cell (a click elsewhere, Tab), saves it. Tab then moves on as usual, to the next cell's button.
  - Picking from a Select, a Combobox (one value) or a Date's calendar saves at once.
  - Escape puts the value back and returns focus to the cell.
  - A value the control finds invalid (`min`, `required`, `pattern`, …) keeps the editor open, its message in a [Tooltip](tooltip.md) under it, until it's fixed or Escape.
  - A value that didn't change ends the editing quietly.
- **The new value shows:** canon.js writes it in `data-value` (and the field), and draws it in the cell:
  - a choice the way another cell of the column with that value shows it (its Tag, say), else as its option shows it (an avatar or icon and the label; avatars sized as the column's);
  - a number in the reader's format, kept in its words when the old number shows in them ("40 days" becomes "45 days", "$495.90" keeps its decimals);
  - a date as a `<time>` in the reader's medium format ("Nov 18, 2026");
  - text as it is.

  An app that shows values its own way draws them in its `canon-edit` listener (`detail.content`).
- **Saving on its own** (not in a form with a Save Bar): **`canon-edit`** fires on the cell (bubbling, cancelable; `detail: { value, previous, row, column, key, name, content }`, `content` the element showing the value).
  - Not cancelled: the edit stands; the app saves it as it likes.
  - Cancelled (`preventDefault()`): the app saves it and answers on the cell (the event needn't bubble), as with a Save Bar: the cell is `data-state="saving"` until **`canon-saved`** (then `saved` for a second), or **`canon-save-failed`** (`detail.message` optional), which puts the old value back, marks the cell `failed` with the message, and announces it. An app refusing a value at once (a rule across cells, a permission) answers `canon-save-failed` straight away.
- **In a form with a Save Bar:** an edit changes the cell's field (firing `input` and `change`), so the Save Bar counts it; the cell is `data-state="changed"`. Discard (the form's reset) puts every cell's value back; `canon-saved` on the form makes the values the new defaults and clears the marks. `canon-edit` fires too, not cancelable.
- **Checkboxes and switches** in an editable column save on change, with the same events and states (disabled while saving); a failure unchecks or checks them back and describes them with the message.
- **Rows stay put:** with `data-local`, an edited value doesn't move its row or hide it; the next sort, filter or page change puts it where it belongs.
- **Not while loading:** while the data table is `aria-busy`, cells can't be edited, and an open editor puts its value back.
- **Rows the app adds** are set up like the others.

## States

| State | Hook |
|---|---|
| Editable cell | in a `data-edit` column, not `data-edit="none"` |
| Editing | `data-state="editing"` on the cell |
| Saving | `data-state="saving"` on the cell |
| Saved | `data-state="saved"` on the cell, for a second |
| Saving failed | `data-state="failed"` on the cell, until it's edited again |
| Changed, not yet saved (in a form) | `data-state="changed"` on the cell |

## Core

- The edit button fills the cell and lays its content out as the cell would (alignment, wrapping, truncation); it adds no frame, padding or fill of its own.
- The editor takes the cell's place without changing its size: over the cell (the button stays, unseen, holding its size), as wide as it (a date or a list at least that), centered in the row; at the cell's end in end-aligned columns, keeping their alignment, and without a number field's arrows.

## Accessibility

- The cell's button is named by its content (the value), so moving through the table reads as before: "Target, 40 days, button". It is described as editable ("Edit", the `data-table-edit` string); an empty cell's button reads "Empty".
- The editor is labelled with the column and the row: "Target for Time to hire".
- Saving is silent; a failure is announced with its message ("Couldn't save", or the app's), and stays as the cell's description until it's edited again.
- Escape always gets back to the value as it was; focus returns to the cell after every edit.
- In a form, the Save Bar announces the changes as for any field.

## Strings

`data-table-edit` ("Edit"), `data-table-empty` ("Empty"), `data-table-edit-cell` ("{column} for {row}"), `save-failed` ("Couldn't save", shared with the Save Bar), translated in `i18n/`.

## Theme obligations

- Starting to edit moves nothing: the editor sits where the value was, its text where the value's text was.
- An editable cell is told from the others under the pointer and with focus, never only at rest.
- Saving, failed and changed show by more than color (a spinner, an icon or a mark).
- Use logical properties: in right-to-left a cell's marks are on its other side.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A spreadsheet: arrow keys between cells, selecting ranges, pasting several cells, filling down, formulas | A grid of its own, if it comes up |
| Enter moving to the cell below | The spreadsheet |
| Undo and redo across edits | The app (`canon-edit` gives the previous value; a [Toast](toast.md) with an Undo action) |
| Values computed from others (totals, scores) | The app, from `canon-edit` |
| Editing several rows at once | A bulk bar action |
| Adding and removing rows in the table | The app, or a [Form Repeater](form-repeater.md) for a short list |
| Colors from thresholds ("below target") | `data-intent` on a cell, if it comes up |

## Look

**Sizes (sm / md / lg):** The edit frame and the editor the control's height (32 / 40 / 48), as wide as the cell, centered in the row (8px above and below; the whole row when `compact`), the text where the cell's text was (12 / 16 / 20px in); the spinner and the marks 16px, 8px from the value (before it in end-aligned columns); the changed mark 6px.

At rest an editable cell looks like any other. Under the pointer, Text Input's frame shows around it (a zinc-200 line, dark zinc-700, Text Input's corners) and the pointer is a text cursor. With focus, Button's ring around that frame. Editing: the editor at the table's size, in Text Input's focus look (blue-600 line and its halo), shown at once (no animation, for typing speed). Saving: the value in zinc-400 (dark zinc-500) and a Spinner at the frame's end, shown at once. Saved: a green-600 check (dark green-400) at the frame's end for a second, then it fades (0.2s). Failed: Text Input's error line around the frame and a danger icon (Lucide circle-alert, red-600, dark red-400) at the end; the message in a [Tooltip](tooltip.md) while the cell is under the pointer or focused. A checkbox or switch saving fades to 60%; failed, the danger icon at the cell's end. Changed (in a form): an amber-500 dot (dark amber-400) at the cell's top end corner, the Save Bar's changed color. Number cells keep their end alignment while editing. Forced colors: the frame and marks in the text's color, the failed frame in Mark.
