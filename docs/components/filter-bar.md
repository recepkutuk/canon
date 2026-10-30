# Filter Bar

Tier: **T2** (without canon.js it is a search form: the popovers open, Apply submits)

Narrows a list (cards, search results, a feed): a search field, facets (a button opening the choices for one thing: Team, Date posted, Salary), quick [Toggle Chips](toggle-chip.md), Clear all and the number of results. For a table with columns, the [Data Table](data-table.md)'s own filters (column, condition, value) fit better.

## Elements

```html
<form class="canon-filter-bar" id="jobs-filters" role="search" aria-label="Filter jobs" method="get">
  <div class="canon-text-input">
    <span class="canon-icon" data-icon="search" aria-hidden="true"></span>
    <input type="search" name="q" aria-label="Search jobs" placeholder="Search jobs">
  </div>

  <div class="canon-filter-bar-facet">
    <button type="button" class="canon-filter-bar-button" popovertarget="jobs-team" aria-haspopup="dialog" aria-expanded="false">
      <span class="canon-filter-bar-label">Team</span>
    </button>
    <div class="canon-popover" id="jobs-team" popover role="dialog" aria-label="Team">
      <fieldset class="canon-fieldset">
        <legend class="canon-fieldset-legend canon-visually-hidden">Team</legend>
        <div class="canon-choice">…Design (checkbox, name="team")…</div>
        <div class="canon-choice">…Research…</div>
      </fieldset>
    </div>
  </div>

  <label class="canon-toggle-chip">
    <input type="checkbox" name="remote" value="1">
    <span class="canon-toggle-chip-label">Remote</span>
  </label>

  <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" commandfor="jobs-filters" command="--canon-clear">…Clear all…</button>
  <button type="submit" class="canon-button canon-filter-bar-apply" data-emphasis="high">…Apply…</button>
  <output class="canon-filter-bar-count" data-align="end">128 jobs</output>
</form>
```

| Element | Required | Notes |
|---|---|---|
| `form.canon-filter-bar` | yes | `role="search"`, named (`aria-label` or `aria-labelledby`). A wrapping row. Its children: the items below, [Buttons](button.md), a [Select](select.md) or [Segmented Control](segmented-control.md) (a sort, a view), hidden inputs. |
| Search field | no | A [Text Input](text-input.md) with `<input type="search">`, named. |
| `.canon-filter-bar-facet` | no | One thing to filter by: a `button.canon-filter-bar-button` (`type="button"`, `popovertarget`, `aria-haspopup="dialog"`) and, right after it, the [Popover](popover.md) it opens (`role="dialog"`, named like the button). |
| `.canon-filter-bar-label` | in a facet's button | The facet's name ("Team"). An icon (`aria-hidden="true"`) may come before it. canon.js adds `.canon-filter-bar-value` after it. |
| Facet content | yes | The choices: Checkboxes or Radios in a [Fieldset](fieldset.md) (its legend can be visually hidden: the button names it), or fields (two numbers for a range; dates are a [Date](date.md), a range in one box, never a bare date input). Every control has a `name`. |
| `.canon-toggle-chip` | no | A quick filter of its own ("Remote"), or a set of them. |
| Clear all | no | A minimal neutral Button with `command="--canon-clear"` and `commandfor` the bar's `id`. Shown while something is chosen. |
| `.canon-filter-bar-apply` | no | `button[type="submit"]`: for pages without JavaScript; hidden while scripting runs. |
| `output.canon-filter-bar-count` | no | The number of results, kept up to date by the app (an `<output>` is announced as it changes). |

- **`data-align="end"`** on an item sends it and what follows to the far end (the count, a sort).
- **A radio whose value is empty** ("Any time") means nothing is chosen in that facet; Clear all goes back to it.
- **Choices apply as they're made:** no Apply inside the facets.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-submit` | the bar | (present): canon.js submits the form after each choice (and on Enter in the search field), for pages the server renders | canon.js fires `canon-filter` | no |
| `data-align` | an item | `end` | — | no |
| `data-size` | the bar or a container | `sm` · `md` · `lg` | theme decides | yes |

## Behavior (canon.js)

- **Each facet's button shows what is chosen** in its popover: the first choice's label and how many more ("Team: Design +1"), a pair of values as a range ("Salary: 80,000 – 120,000"), dates in the reader's format ("Due: Oct 1 – Oct 31"), numbers with the reader's separators. Its name for screen readers lists everything ("Team: Design, Research"). The facet gets `data-active`; the bar gets `data-active` while anything in a facet, a chip or the search field is chosen.
- **Every change fires `canon-filter`** on the bar (`detail: { values }`, the form's values by name, each an array: `{ q: ["engineer"], team: ["design", "research"] }`): choices at once, typing a quarter second after it stops, Enter in the search field at once. The form doesn't submit. With `data-submit` the form submits instead.
- **Clear all** (`--canon-clear` on the bar): checkboxes off, each radio group back to its empty-valued radio, fields emptied, sliders to their full range, then one `canon-filter`; focus moves to the search field (else the first control). A sort or other control outside the facets, chips and search is left as it is.
- **The popovers** are Popovers: focus moves in, closing returns it, the button's `aria-expanded` follows.
- A form reset updates the buttons and fires `canon-filter`. After changing values in code, dispatch `change` on the control.

## States

| State | Hook |
|---|---|
| A facet with a choice | `.canon-filter-bar-facet[data-active]` (canon.js) |
| Something chosen | `.canon-filter-bar[data-active]` (canon.js) |
| A facet open | `.canon-filter-bar-button[aria-expanded="true"]` |
| Hover, focus | `:hover`, `:focus-visible` on the button |

## Core

- The bar is a wrapping flex row, items centered; `data-align="end"` takes the rest of the row before an item. A facet's button is an inline row that doesn't wrap; its value cuts with … where it must.
- Clear all hides while nothing is chosen; Apply hides while scripting runs.

## Accessibility

- A search landmark, named for what it filters. Each facet's button says what is chosen (its name lists every choice); its panel is a named dialog with a group of choices.
- The count is an `<output>`, so its changes are announced. Say what changed in it ("12 jobs"), not only a number.
- Focus stays where the person is: choosing in a facet doesn't close it; Escape or a click outside does, returning focus to its button.

## Theme obligations

- Facet buttons and chips read as one row with the search field (the same height).
- A facet with a choice stands out from one without, beyond color where the system allows (its value shows in the button).
- The facet's open state and focus visible; the chevron shows it opens.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A long facet with its own search (50 owners) | A [Combobox](combobox.md) in the panel, if it comes up |
| Collapsing to "Filters (3)" in a drawer on small screens | With Drawer |
| Removable chips for each choice under the bar | As Data Table's chips, if it comes up |
| A single Slider in a facet (only pairs are summarized) | If it comes up |
| Sort | The app's Select at the end (`data-align="end"`) |

## Look

**Sizes (sm / md / lg):** Items 8px apart; the search field 16rem (at most the row); facet buttons and chips a control's height (32 / 40 / 48) so the row lines up.

A facet button is a Toggle Chip with a chevron (zinc-500, dark zinc-400, turning while open): a zinc-200 line (dark zinc-700), labels zinc-700 (dark zinc-200); hover zinc-50, a zinc-300 line (dark zinc-800, zinc-600); open zinc-100 (dark zinc-700). With a choice, a chosen [Toggle Chip](toggle-chip.md)'s look: zinc-900 with a white label and chevron (dark: white with zinc-900), hover zinc-800 (dark zinc-200), open or pressing zinc-700 (dark zinc-300); forced colors, Highlight. Panels at least 12rem, choices in a column 8px apart. The count zinc-500 (dark zinc-400), tabular figures. Clear all a minimal Button.

**Motion:** Clear all fades in (0.15s) when something is chosen; it goes at once.
