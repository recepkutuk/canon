# Stack, Cluster and Grid

Tier: **T0**

The space between components. Canon's components never set the space around themselves: what sits next to what, and how far apart, is a container's job. These three are those containers, and an app writes no spacing CSS of its own.

- **Stack:** things one under another, a steady gap apart: a page's sections, cards in a column, a form above a table.
- **Cluster:** things in a row that wrap when they run out of room: tags, a few buttons, a page's facts ("Draft · Edited 2 hours ago · Ada").
- **Grid:** equal columns, as many as fit: cards in a gallery, settings tiles, a dashboard's panels.

## Elements

```html
<div class="canon-stack" data-gap="xl">
  <section class="canon-section">…</section>

  <div class="canon-grid" data-columns="3">
    <section class="canon-card">…</section>
    <section class="canon-card">…</section>
    <section class="canon-card">…</section>
  </div>

  <div class="canon-cluster">
    <span class="canon-tag">…Design…</span>
    <span class="canon-tag">…Research…</span>
    <button type="button" class="canon-button" data-align="end">…Edit tags…</button>
  </div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-stack` | — | A `<div>` (or the element the content needs: a `<section>`, a `<ul>`). Its children one under another, each as wide as the stack. |
| `.canon-cluster` | — | A row of its children at their own widths, wrapping onto more lines, centered on each other. A child with `data-align="end"` goes to the row's end, and what follows it with it. |
| `.canon-grid` | — | Columns of equal width, at least `--canon-grid-min` each (16rem), as many as fit, up to `data-columns`; its children fill them in order. |

- **No roles, no names.** They are layout: they add nothing for assistive technology and change no reading order. A list of things is still a `<ul>` (`<ul class="canon-cluster">`), a group still a named group.
- **They nest:** a page is usually a Stack of Sections, whose content holds a Grid or a Cluster.
- **Buttons and other inline things go in a Cluster.** In a Stack every child is as wide as the stack, a Button too.
- **Not a [Toolbar](toolbar.md):** a Toolbar is one control (one Tab stop, arrow keys between); a Cluster is only space. **Not a [Form Layout](form-layout.md):** a form's fields, rows and sections have their own spacing; put the form in a Stack, not its fields.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-gap` | a stack, cluster or grid | `none` · `sm` · `md` · `lg` · `xl` | theme decides (Canon: `md`) | no: each one's own |
| `data-columns` | a grid | `2` · `3` · `4` · `5` · `6`: at most that many columns | as many as fit | no |
| `--canon-grid-min` | a grid (a style) | the narrowest a column may be | 16rem | — |
| `data-align` | a cluster's child | `end`: it, and what follows it, at the row's end | — | no |
| `data-size` | the container or one above | `sm` · `md` · `lg`: the gaps scale with it | theme decides | yes |

- **`data-gap` is the author's because only the author knows how related the things are.** Tags that belong together sit close (`sm`); a page's sections sit far apart (`xl`). Each step is a step of Canon's spacing at the current size, never a length.
- **It isn't inherited:** a stack inside a `data-gap="xl"` stack has its own gap (the theme's, unless it says).
- **`data-columns`** caps the count; the columns still narrow to one when there isn't room for two at `--canon-grid-min`. No breakpoints: the grid fits the room it has, wherever it is (a page, a Card, a Drawer).

## Core

- **Stack:** a flex column; children stretch to its width; their own block margins are dropped (the gap is the space).
- **Cluster:** a flex row that wraps, children centered on each other's middles; the gap both across and between lines. `data-align="end"` takes the free space before that child.
- **Grid:** `repeat(auto-fit, minmax(…, 1fr))`: a column is at least `--canon-grid-min` (never more than the grid's width), and, with `data-columns`, at least the share of `data-columns` columns, so no more than that many fit. Children can shrink below their content's width (`min-inline-size: 0`), so long words wrap instead of widening a column.
- `data-gap` and `data-columns` are hints (the `canon.hints` layer): they win over the theme. The gap's lengths are the theme's (`--canon-gap-sm` … `--canon-gap-xl`, at each size).

## Accessibility

- Nothing is announced: they are presentation only, and reading order is the markup's. A Cluster's `data-align="end"` moves a child visually only within its row, never before what precedes it.
- Right to left, rows and columns run from the right.

## Theme obligations

- Four gaps that read as clearly different steps, at every size, and a default.
- Use logical properties: in right-to-left a Cluster starts at the right, and `end` is the left.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Two parts side by side that stack when narrow (a list and its detail) | [Split Pane](split-pane.md), or Form Layout's aside layout |
| Lines between children | [Separator](separator.md) between them; a row of stats has its own lines ([Stat](stat.md)) |
| Items spanning several columns, a masonry | If it comes up |
| Centering a page's content to a measure | The app's page CSS (an [App Shell](app-shell.md) holds the page) |

## Look

**Gaps (sm / md / lg sizes):** `sm` 4 / 8 / 12; `md` 12 / 16 / 20 (Fieldset's step between fields, the default); `lg` 16 / 24 / 32; `xl` 24 / 32 / 40 (Form Layout's step between sections); `none` 0. A grid's columns at least 16rem.

No look of their own: no lines, fills or padding.
