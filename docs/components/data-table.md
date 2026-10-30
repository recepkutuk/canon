# Data Table

Tier: **T2** (without canon.js it is a [Table](table.md): rows, checkboxes and buttons work; sorting, select-all, pinning, paging, search, filters and the columns panel don't)

A Table people work with: search and filter it, sort it, select rows, act on a row, edit a value in its cell, choose and pin its columns, page through it, export it, and see where it stands while it loads or when there's nothing to show. Editing cells has its own page: [Data Table: editing cells](data-table-editing.md).

## Elements

```html
<div class="canon-data-table" data-local>
  <div class="canon-data-table-toolbar">
    <div class="canon-text-input">
      <span class="canon-icon" data-icon="search" aria-hidden="true"></span>
      <input type="search" aria-label="Search users" placeholder="Search">
    </div>
    <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" data-panel="filters">…Filter…</button>
    <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" data-panel="columns" data-align="end" aria-haspopup="dialog">…Columns…</button>
    <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" popovertarget="users-export" aria-haspopup="menu" aria-expanded="false">…Export…</button>
    <div class="canon-menu" id="users-export" popover role="menu" aria-label="Export">
      <button type="button" class="canon-menu-item" role="menuitem" data-export="csv">…CSV…</button>
    </div>
  </div>
  <div class="canon-table">
    <table>
      <caption class="canon-visually-hidden">Users</caption>
      <thead>
        <tr>
          <th scope="col" data-column="select">
            <div class="canon-choice">
              <input type="checkbox" id="users-all">
              <label class="canon-choice-label canon-visually-hidden" for="users-all">Select all rows</label>
            </div>
          </th>
          <th scope="col" aria-sort="none" data-type="text" data-pin>User</th>
          <th scope="col" aria-sort="none" data-type="date">Date</th>
          <th scope="col" aria-sort="none" data-type="number" data-align="end">Amount</th>
          <th scope="col" data-type="choice">Status</th>
          <td data-column="actions"></td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="canon-choice">
              <input type="checkbox" id="users-1" name="users" value="1">
              <label class="canon-choice-label canon-visually-hidden" for="users-1">Select Edwin Mueller</label>
            </div>
          </td>
          <th scope="row">Edwin Mueller</th>
          <td><time datetime="2024-08-16">16.08.2024</time></td>
          <td data-value="495.90">$495.90</td>
          <td data-value="Waiting"><span class="canon-tag" data-intent="warning">…Waiting…</span></td>
          <td>…the row's actions…</td>
        </tr>
      </tbody>
    </table>
  </div>
  <nav class="canon-pagination" aria-label="Pagination" data-per-page="10">
    <p class="canon-pagination-summary"></p>
  </nav>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-data-table` | yes | Around the toolbar, the Table and its [Pagination](pagination.md) (the toolbar and Pagination optional). As wide as its container: a wider table scrolls in its frame. |
| `.canon-data-table-toolbar` | no | Before the table: a search field (a [Text Input](text-input.md) with `type="search"`, named), a `data-panel="filters"` [Button](button.md), a `data-panel="columns"` Button, an Export menu button (low and neutral: `data-emphasis="low" data-intent="neutral"`), and anything else the app needs. `data-align="end"` on an item sends it and what follows to the far end. canon.js draws the panels these buttons open, and the filter chips under the toolbar. |
| `.canon-table` | yes | A [Table](table.md), named, with a header row (`<thead>`) whose cells line up one-to-one with the body's (no `colspan` in the header). |
| A sortable header | no | `<th aria-sort="none">` (or `ascending` / `descending` when the rows already come sorted). canon.js puts its content in a sort button. |
| A filterable header | no | `data-type` says what the column holds: `text`, `number`, `date` (cells with `<time datetime>` or an ISO `data-value`) or `choice` (a few values; `data-options="Ready, Waiting"` lists them, else canon.js collects them from the rows). |
| An Export item | no | A [Menu](menu.md) item with `data-export="csv"` (or another format the app handles). |
| `template.canon-data-table-no-results` | no | In the data table: the [Empty State](empty-state.md) shown when the search and filters leave no local rows (canon.js has a default). |
| The select column | no | Its header `data-column="select"` holds a select-all [Checkbox](checkbox.md); each row's cell in that column holds a row checkbox (`name` / `value` for a form), each with a visually hidden label ("Select Edwin Mueller"). |
| `.canon-data-table-bulk` | no | The actions for the selected rows: `role="region"`, named ("Selected users"), holding [Buttons](button.md) by meaning (the main action; `data-intent="danger"` for a destructive one), menu buttons or a [Toolbar](toolbar.md). Needs the select column. canon.js adds Clear selection, the count and Select all before them; without canon.js it is a row under the table (a form round trip). |
| The actions column | no | Its header cell `data-column="actions"`: an empty `<td>`, or a `<th>` with a title. Each row's cell holds either a menu button (a minimal icon [Button](button.md), "Actions for Edwin Mueller", opening a [Menu](menu.md)) or a few buttons in a [Toolbar](toolbar.md) named for the row. |
| A message row | no | One row, one cell, holding an [Empty State](empty-state.md): nothing yet, no results, or an error. canon.js spans it across the columns. |

- **Statuses** are status [Tags](tag.md) (`data-intent`).
- **Cells stay on one line**, so rows keep one height; `data-wrap="normal"` on a cell lets it wrap, `data-wrap="truncate"` cuts it with "…" (at `--canon-truncate`, 16rem), and `data-wrap="middle"` cuts plain text in its middle, keeping its end (its last third: at least 8 characters, and a file name's extension with the 5 before it), for file names, paths and ids that differ at the end. Don't cut numbers, amounts or dates: people compare them. `data-align` and `data-wrap` on a header apply to its whole column.
- **One select column, one actions column**, at the start and the end of the row.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-local` | the data table | (present) all the rows are in the page: canon.js sorts them and shows them a page at a time | — (the app sorts and pages) | no |
| `aria-sort` | a header `th` | `none` · `ascending` · `descending` | not sortable | — |
| `data-column` | a header cell | `select` · `actions` | — | — |
| `data-pin` | a header `th` | (present) keep the column in view while the others scroll | — | — |
| `data-value` | a body cell | the value to sort and filter by | the `<time datetime>` inside, else the text | — |
| `data-type` | a header `th` | `text` · `number` · `date` · `choice` | not filterable | — |
| `data-options` | a `choice` header | the values, comma-separated | the values in the rows | — |
| `data-panel` | a toolbar button | `filters` · `columns` | — | — |
| `data-export` | a menu item | `csv`, or a format the app handles | — | — |
| `data-export-name` | the data table | the CSV's file name | the caption, else "table" | no |
| `data-wrap` | a cell or a header | `none` · `normal` · `truncate` · `middle` | one line | — |
| `aria-busy` | the data table | `true` while the rows load | — | — |
| `data-loading-rows` | the data table | how many skeleton rows | a page (the Pagination's `data-per-page`), else the rows shown, else 5 | no |
| `data-size` | the data table or a container | `sm` · `md` · `lg` | theme decides | yes |
| `data-density` | the data table or a container | as [Table](table.md) | theme decides | yes |
| `data-lines`, `data-striped`, `data-hover`, `data-frame` | the Table's frame (`.canon-table`) | as [Table](table.md) | — | no |

## Behavior (canon.js)

- **Sorting:** a press cycles none → ascending → descending → none and fires **`canon-sort`** on the data table (`detail: { column, index, key, direction }`, bubbling, cancelable; `key` is the header's `data-key`, else its text). Unless cancelled, the header's `aria-sort` changes (the others go to `none`) and, with `data-local`, the rows are sorted: by `data-value`, else a `<time datetime>`, else the text; numbers as numbers, text in the page's language with numbers inside it in order ("Item 2" before "Item 10"). `none` restores the order they came in. One column sorts at a time.
- **Selecting:** the select-all checkbox checks or clears the rows shown; it is checked when they all are and mixed when some are. Shift+click on a row checkbox sets every row between it and the one clicked before. Each change fires **`canon-select`** (`detail: { rows, values, allMatching, count }`: the selected rows and their checkboxes' values; `allMatching` when every row matching the search and filters is selected, all pages included, and `count` how many that is).
- **The bulk bar** (`.canon-data-table-bulk`): canon.js makes it a manual popover, shown while rows are selected, floating at the bottom of the window, centered, over the page; it fades in and out without moving anything, and its width holds steady while the count changes (the theme gives it a minimum). Before the app's actions: Clear selection (an icon Button; it clears every row, and focus goes back to the select-all checkbox), the count ("3 selected", a status: screen readers hear it change) and a vertical [Separator](separator.md). When every row shown is selected and more match (`data-local`: the matching rows; else Pagination's `data-total`), the count reads "All 5 on this page selected" and a [Link](link.md) button offers "Select all 12": with `data-local` canon.js checks them all; otherwise `canon-select` says `allMatching`, rows the app adds come checked, and any change to the selection or the filters ends it. If the bar hides with focus in it, focus goes to the select-all checkbox.
- **Pinning:** the select column (at the start), `data-pin` columns and the actions column (at the end) stay in view while the others scroll under them. canon.js writes `data-pinned="start" | "end"`, `--canon-pin-offset` and `data-pin-edge` (the innermost pinned column of each side) on their cells, and on the frame `data-scroll-start` / `data-scroll-end` while rows are hidden under that side.
- **Paging** (`data-local` and a Pagination): the Pagination counts the rows (`data-total`), and its pages show those rows; sorting keeps the page. Without `data-local` the Pagination works as on its own: the app listens for `canon-page` and loads the page.
- **Loading:** while `aria-busy="true"`, skeleton rows stand in for the body (the body is hidden, not removed), and "Loading" is announced. When it goes, the rows return, and the data table is `data-loaded` while the theme shows them in.
- **Search:** typing in the toolbar's search field narrows local rows to those containing every word (in any data column, ignoring case and accents); without `data-local` the app hears it a quarter second after typing stops.
- **Filters:** one per column, each a column, a condition and a value: text (contains, doesn't contain, is, is not, starts with, ends with), number (=, ≠, <, ≤, >, ≥), date (is, is before, is after), choice (is, is not, any of several values). The Filter button opens the builder: a row per filter (Column, Condition, Value), Add filter, Apply filter; nothing changes until Apply. Applied filters show as chips under the toolbar (a choice's values as their Tags, two and "+N"): a chip opens that column's filter alone (Condition, Value, Apply), its × removes it, Clear all removes them all. A filtered column also shows a filter button in its header, which opens the same filter; unfiltered columns have none. Search and filter changes fire **`canon-filter`** (`detail: { query, filters: [{ column, key, operator, values }] }`); with `data-local` canon.js hides the rows that don't match, pages what's left and, when nothing is left, shows the no-results Empty State with Clear filters.
- **Columns** (the `data-panel="columns"` button): a panel listing the data columns, pinned ones first: a checkbox shows or hides each (the last one shown can't be hidden), a pin button pins it (moving it to the end of the pinned ones) or unpins it, and the grip reorders it within its group: drag it, or focus it and press Up / Down (the new position is announced). Changes fire **`canon-columns`** (`detail: { columns: [{ column, key, hidden, pinned }] }`) for the app to remember.
- **Export:** an item with `data-export` fires **`canon-export`** (`detail: { format, rows, columns }`, cancelable). For `csv`, unless cancelled, canon.js downloads the rows that match the search and filters (all pages) in the columns shown, as text.
- **A header that stays:** give the frame a `max-block-size` and it scrolls down as well; the header stays at its top.
- **Truncated cells** show their full text as a tooltip (`title`) while cut; the full text is in the page, so screen readers read it all.
- **Rows the app adds or replaces** are marked, pinned, and (with `data-local`) sorted, filtered and paged again.
- **Editing cells** (`data-edit` on a header): see [Data Table: editing cells](data-table-editing.md).
- **Without canon.js** it is a Table: checkboxes submit with a form, buttons and menus work, headers don't sort, the search field and the panel buttons do nothing.

## States

| State | Hook |
|---|---|
| Sorted column | `aria-sort="ascending" | "descending"` on its header |
| Selected row | its checkbox `:checked` (`tr:has(:checked)`) |
| Pinned cell | `data-pinned`, `data-pin-edge` (canon.js) |
| Rows under the pinned columns | `data-scroll-start`, `data-scroll-end` on the frame (canon.js) |
| Loading | `aria-busy="true"` on the data table |
| A filtered column | its header's filter button shown (canon.js) |
| A hidden column | `hidden` on its cells (canon.js) |
| Empty, no results, error | a message row with an [Empty State](empty-state.md) |

## Core

- The data table: a column, as wide as its container and never wider (`contain: inline-size`), so the frame scrolls. Cells `nowrap` (unless `data-wrap="normal"`). Select and actions columns as narrow as their content. Pinned cells `position: sticky` at `--canon-pin-offset`; header cells sticky at the top (above pinned body cells). While busy, the real body is hidden and the skeleton body shown. The toolbar and chips are wrapping rows; a truncated cell's text is a block cut with an ellipsis.

## Accessibility

- Sorting is a button in the header; the header's `aria-sort` tells screen readers the order. Only one column has a direction at a time.
- Every checkbox has a name ("Select all rows", "Select Edwin Mueller"); the select-all's mixed state is the native `indeterminate`.
- Row actions are named for their row; a set of buttons is a Toolbar (one Tab stop per row).
- While loading, the data table is `aria-busy` and "Loading" is announced; skeletons are hidden from screen readers.
- A message row keeps the table and its headers: screen readers hear the table, then the message.
- The search field is named; the panels are dialogs (Popovers) named "Filters", "Filter User", "Columns", with labelled fields; chips are a group named "Filters" whose buttons say what they do ("Edit filter: Status is Ready", "Remove filter: …").
- Reordering columns works from the keyboard (the grip and Up / Down), and each move is announced.

## Theme obligations

- Sort state visible in the header; a selected row distinguishable; pinned columns separated from what scrolls under them; a skeleton that reads as "loading".

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A bulk bar for lists that aren't tables | Bulk Action Bar (pattern), from this one |
| Keeping the bar off the page's last lines | The app's bottom padding (the bar floats over them) |
| A header that stays in view while the page (not the frame) scrolls | If it comes up |
| Sorting by several columns | If it comes up |
| Row click (opening a row) | If it comes up |
| Several filters on one column, or "or" between filters | If it comes up |
| Remembering columns and filters between visits | The app (from `canon-columns`, `canon-filter`) |

## Look

**Sizes (sm / md / lg):** Table's sizes; the select column as wide as a row is tall (48 / 56 / 64); the actions cell 8px in; the pagination 16px under the table.

Sort arrows (Lucide arrow-down-up; sorted, arrow-up, turning over to point down for descending, 0.2s) 8px after the label in the header's color; a selected row zinc-50 (dark zinc-800), its fill (and the hover's) fading in 0.12s; on a striped table zinc-100, a step darker than a stripe. Fill order: the row under the pointer, then selected, then striped; pinned cells paint the same fill. Pinned columns: a data column keeps a line at its end and a pin icon at the end of its header; the innermost pinned column casts a 4px band (black at 5%, dark white at 5%) while rows scroll under it; the actions column always has the line at its start, and the band before it while rows hide under it. Row action buttons: a Toolbar's buttons (zinc frame, zinc icons). Loading: ghost rows (lines of varying length, a square for the checkbox, a circle for the actions). Toolbar: items 12px apart, search 200px wide; filter chips 16px apart, joined segments on zinc-50 with zinc-200 lines (dark zinc-800, zinc-700), 2px end corners, choice values as their Tags; a filtered column's header shows its filter button (Lucide list-filter); the filter builder's rows 8px apart inside, 16px between, Add filter and Apply filter under a line; Columns: a grip (Lucide grip-vertical, zinc-400), the checkbox, a pin button shown while pinned, or with the row under the pointer or keyboard focus, a line after the pinned columns. The select column pinned on its own shows the line and band only while rows scroll under it; sort hover zinc-900 (dark white), focus Button's ring; Clear all a minimal Button; panels with Popover's corners and padding; the toolbar's Filter, Columns and Export are low neutral Buttons (`data-intent="neutral"`), as are row action Toolbars' buttons. The bulk bar: Canon's panel look, floating 1.5rem above the window's bottom, at least 48rem wide and at most 64rem (the window less 1rem each side when smaller), so the count changing moves nothing (the actions keep to the end; under 40rem they take their own row under a line); white (dark zinc-900), no frame: a hairline edge and the floating shadow, Popover's corners, 8px inside, items 8px apart; the count medium; it rises 8px and fades in 0.15s (still with reduced motion).
