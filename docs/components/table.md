# Table

Tier: **T0** (the frame becoming a keyboard-scrollable region when the table is wider than it is **T2**, canon.js)

Rows and columns of data, read across and down: a native `<table>` in a frame. [Data Table](data-table.md) builds on it (sorting, selecting, filtering); a Table on its own shows data as it is.

## Elements

```html
<div class="canon-table">
  <table>
    <caption>Orders</caption>
    <thead>
      <tr>
        <th scope="col">User</th>
        <th scope="col">Date</th>
        <th scope="col" data-align="end">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Edwin Mueller</th>
        <td><time datetime="2024-08-16">16.08.2024</time></td>
        <td data-align="end">$495.90</td>
      </tr>
    </tbody>
    <tfoot>
      <tr><th scope="row">Total</th><td></td><td data-align="end">$495.90</td></tr>
    </tfoot>
  </table>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-table` | yes | The frame. Its only child is the table. It scrolls sideways when the table is wider. |
| `<table>` | yes | Named: by a `<caption>`, or `aria-label` / `aria-labelledby`. Never a layout table (`role="presentation"`). |
| `<caption>` | no | The table's title, shown as its first row. Visually hidden (`canon-visually-hidden`) when a heading nearby already says it; it still names the table. |
| `<thead>` | no | Column headers: `<th scope="col">`. A column whose header has nothing to say has an empty `<td>` there. |
| `<tbody>` | yes | The rows. A row's first cell can be its header (`<th scope="row">`): screen readers read it with every cell of the row. Several bodies are groups of rows. |
| `<tfoot>` | no | Totals and summaries. |
| Cell content | — | Text, numbers, `<time>`, links, and content components: a status [Tag](tag.md), an [Avatar](avatar.md) before a name (its fallback `aria-hidden`, the name written beside it). Selecting rows and a row's actions are [Data Table](data-table.md)'s. |

- **For data, not layout:** columns of the same kind of thing. A form's label and field pairs are [Form Layout](form-layout.md); term and description pairs are a Description List.
- **Figures** are tabular (all digits the same width), so numbers line up down a column; amounts still read better aligned to the end.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-align` | a cell (`th`, `td`) | `start` · `center` · `end` | `start` | no (write it on each cell of the column, its header too) |
| `data-wrap` | a cell (`th`, `td`) | `none`: the cell's text on one line · `normal`: it wraps | wraps (in a Data Table: one line) | no (write it on each cell of the column) |
| `data-lines` | the frame | `rows`: lines between rows · `grid`: between columns too · `none`: no lines between rows (the header keeps its line) | `rows` | no |
| `data-striped` | the frame | (present) every other body row filled | — | no |
| `data-hover` | the frame | (present) the body row under the pointer filled (devices with a pointer) | — | no |
| `data-frame` | the frame | `none`: no border, corners or fill; the table sits on the page | framed | no |
| `data-density` | the frame or a container | `compact` · `comfortable` · `spacious`: how much taller than the header a row is | theme decides | yes |
| `data-size` | the frame or a container | `sm` · `md` · `lg` | theme decides | yes |

## Behavior

**T0:** the browser's table. Cells wrap their text (not with `data-wrap="none"`); header cells stay on one line. The frame scrolls sideways when the table can't fit.

**canon.js (T2):** while the table is wider than its frame, the frame gets `data-scrolls`, `role="region"`, `tabindex="0"` and the table's name (its caption, through `aria-labelledby`), so keyboard users can reach it and scroll with the arrow keys. When it fits again they are removed. A role, tab stop or name the author wrote is kept.

## States

| State | Hook |
|---|---|
| Scrolls sideways | `data-scrolls` on the frame (canon.js) |
| Frame focused (when it scrolls) | `.canon-table:focus-visible` |

## Core

- The frame: `overflow-x: auto`, at most as wide as its container. The table: full width, `border-collapse: separate` (so the theme can round the frame and draw row lines), tabular figures. Cells: start-aligned (`data-align` changes it), vertically centered, sized including their padding; header cells and `data-wrap="none"` cells `nowrap`.

## Accessibility

- A native table: screen readers announce rows and columns, read headers with each cell, and move by cell. `scope` says which way a header reads.
- Named by its caption, so a list of tables on the page tells them apart; a visually hidden caption keeps the name without repeating a heading.
- A scrolling frame is a named region and a Tab stop, so its hidden columns can be reached without a mouse.

## Theme obligations

- `data-lines`, `data-striped`, `data-hover` and `data-frame` honored; a striped or hovered row still reads as one row (fills, not lines).

- Rows visibly separated (lines or fills); header cells distinguishable from data.
- A focus ring on the frame when it is focusable.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Sorting, selecting rows (checkboxes, a bulk bar), a row's actions, filtering, column menus, pagination, loading and empty states | [Data Table](data-table.md) |
| A header that stays in view while scrolling down | Data Table (`data-sticky`, with a height) |
| Column widths | The author's `<col>` / `<colgroup>` and CSS |
| Truncating a cell with "…" (`data-wrap="truncate"`), a column's setting written once on its header | Data Table |
| Stacking rows as cards on narrow screens | If it comes up |

## Look

**Sizes (sm / md / lg):** Header rows 32 / 40 / 48 (the button's height); body rows 16px taller (48 / 56 / 64), the same as the header with `compact`, 32px taller with `spacious`; an avatar 8px before a name; cells 12 / 16 / 20px in (where a text field's text sits); Text Input's type (12 / 14 / 16px); corners 8 / 12 / 16.

A hairline edge (black at 12%, dark white at 12%) for its frame, white (dark zinc-900); lines between rows hairline rules (black at 10%, dark white at 10%); header text medium zinc-500 (dark zinc-400), body regular zinc-900 (dark white). `data-lines="grid"` the same rules between columns; stripes zinc-50 (dark halfway from zinc-900 to zinc-800); hover zinc-100 (dark zinc-800), on devices with a pointer; `data-frame="none"` drops border, corners and fill; densities other than comfortable; the caption a title row (semibold, a line under it); the footer medium over a line; a focusable frame gets Button's ring.
