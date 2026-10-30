# Stat

Tier: **T0**

One number that matters, with what it measures and how it moved: revenue this month, open invoices, average response time. The headline numbers of a dashboard, the top of a list page ("142 orders"), a record's overview. Plain content: a [Card](card.md), a row of stats or the page around it frames it. Also called a KPI.

## Elements

```html
<div class="canon-stat">
  <p class="canon-stat-label">Revenue this month</p>
  <p class="canon-stat-value">$48,210</p>
  <p class="canon-stat-change" data-direction="up" data-intent="success">Up 12% from last month</p>
  <p class="canon-stat-description">Goal: $50,000</p>
  <div class="canon-stat-chart"><svg viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true">…</svg></div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-stat` | yes | A `<div>`. Its children in this order; only the label and the value are required. |
| `.canon-stat-label` | yes | What is measured, with its period where it matters ("Revenue this month"). A `<p>`; holds a `.canon-stat-link` when the stat leads somewhere (see Linking). |
| `.canon-stat-value` | yes | The number, formatted by the app: units, currency, abbreviations ("$48,210", "1.2 s", "48.2K"). A `<p>`. Empty: a dash, heard as "Not set" (`--canon-text-not-set`, as Description List's). |
| `.canon-stat-change` | no | How it moved, in the app's words: the whole phrase, direction and comparison included ("Up 12% from last month", "+3 since yesterday", "No change"). A `<p>`. The theme draws an arrow before it from `data-direction`. |
| `.canon-stat-description` | no | More context: a target, a breakdown, when it was updated ("Goal: $50,000", "8 overdue", "Updated 5 minutes ago"). A `<p>`. |
| `.canon-stat-chart` | no | A sparkline the app draws: an inline `<svg>` that strokes or fills with `currentColor`, so the theme colors it. `aria-hidden="true"` when the change already says the trend; `role="img"` and a name when it says more. Canon doesn't draw charts. |

- **The app writes the change.** Canon never formats numbers or composes "12%" into a sentence: the phrase is the app's, in the reader's language. It must say the direction in words ("Up", "+", "more"), because the arrow is decoration.
- **Direction and meaning are separate.** `data-direction` says which way it moved; `data-intent` says whether that's good. Revenue up is good, an error rate up is bad, a headcount up is neither: the author says each, the theme never guesses from the direction.
- **Stat or [Description List](description-list.md)?** A Description List gives facts about one thing at equal weight; a Stat puts one number first, to be compared with others and over time.
- **Stat or [Count](count.md)?** A Count is a small badge on something else ("3 unread"); a Stat is a number that stands on its own.

### A row of stats

```html
<div class="canon-stats" role="group" aria-label="This month" data-lines>
  <div class="canon-stat">…</div>
  <div class="canon-stat">…</div>
  <div class="canon-stat">…</div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-stats` | no | Stats side by side, as many columns as fit (each at least 12rem), wrapping onto more rows. Named (`role="group"` and `aria-label` or `aria-labelledby`) when the stats share a context the page doesn't already give ("This month"). Its only children are stats. |

### Linking

```html
<div class="canon-stat">
  <p class="canon-stat-label"><a class="canon-stat-link" href="/invoices?status=overdue">Overdue invoices</a></p>
  <p class="canon-stat-value">8</p>
</div>
```

- A stat that leads to the list behind it ("8 overdue" → the overdue invoices): its label holds an `<a href class="canon-stat-link">`, whose target covers the whole stat, as `.canon-card-link` does a [Card](card.md). The link's name is the label; the value and change are read after it, as the stat's text.
- One link per stat. A stat with other actions keeps them out of it (in the Card's header, say).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-direction` | the change | `up` · `down` · `flat` | none: no arrow | no |
| `data-intent` | the change | `success` (good) · `danger` (bad) · `warning` · `info` | none: neutral | no |
| `data-size` | the stat, the row or a container | `sm` · `md` · `lg` (xs is sm, xl and 2xl are lg): the value's size, and the rest to match | theme decides | yes |
| `data-lines` | the row | present: a line between the stats of a row | no lines | no |
| `aria-busy` | the stat or the row | `true` while the value loads | — | — |

- **`data-size` is the only way to make a stat bigger.** A headline stat over smaller ones is `lg` beside `sm`, not a different kind of stat.
- **`data-intent` on the change, not the stat.** The number itself is neutral; only how it moved is good or bad.
- **`warning`** for a move toward a limit (storage 90% full, "Up 40%: near your plan's limit"); **`info`** for a change worth noticing that is neither good nor bad.

## States

| State | Hook | Notes |
|---|---|---|
| Loading | `aria-busy="true"` on the stat or the row | The app puts a [Skeleton](skeleton.md) (`data-shape="block"`) in the value, and leaves the change empty or out. |
| No value | an empty `.canon-stat-value` | A dash, heard as "Not set". |
| Out of date | the app's words in the description ("Updated 3 hours ago"), `data-intent="warning"` on the change where it matters | Canon doesn't track time. |

## Core

- A stat is a column: label, value, change, description, chart, each on its own line, in that order whatever the theme does with spacing.
- The value never breaks inside a number: it wraps only at spaces ("$48,210 per month"), and its figures are tabular, so values in a row line up as they change.
- A row is a grid of columns at least 12rem wide (`--canon-stats-min`), as many as fit. With `data-lines`, each stat draws a line before it at the gap's middle; the row cuts off the one before its first column, so lines only fall between stats. Wrapped rows are apart by the gap, without a line.
- The chart fills the stat's width at a height the theme sets; its SVG is stretched to it (`preserveAspectRatio="none"` is the app's), and core keeps its strokes their drawn width (`vector-effect: non-scaling-stroke`).
- A linked stat: the label's link reaches over the whole stat (its `::after`, as a link card's), so all of it is the target.

## Accessibility

- Read in order: "Revenue this month, $48,210, Up 12% from last month, Goal: $50,000". No role, nothing announced around it; a row is a named group when it has a name.
- The arrow is decoration: the change's words say the direction. Its intent is shown by color, so where good or bad isn't plain from the label and the direction, the app says it ("Error rate up 3%: above target").
- An abbreviated value ("48.2K") reads as written; where the exact number matters, the app adds it as visually hidden text ("48.2K<span class="canon-visually-hidden"> (48,210)</span>") or links to it.
- A loading stat says so with `aria-busy`; its Skeleton is hidden from assistive technology, so only the label is read until the value comes.
- Values that update while the page is open are not announced: a dashboard that speaks every refresh can't be used. An app that must announce one (a threshold crossed) uses an [Alert](alert.md) or a [Toast](toast.md).
- A linked stat is one link, named by its label; its focus ring goes around the whole stat.

## Theme obligations

- The value is the first thing read on the stat; the label quieter, the change and description quieter still.
- Each intent told apart by more than its hue alone: the direction's arrow is always drawn, and the change keeps its words.
- A chart in a quiet color by default, so it supports the number instead of competing with it.
- A row's stats start level with each other, so short labels put their values on one line. (A label that wraps pushes its value down: keep labels short.)
- Use logical properties: in right-to-left the arrow and the text start on the right, and the sideways part of the arrows mirrors (time runs the other way).

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Drawing charts (sparklines included) | The app, as an `<svg>` in `.canon-stat-chart`; charts are planned later |
| Formatting numbers, units and currency | The app (`Intl.NumberFormat`) |
| Progress toward a target as a bar | Meter / Progress, in the description's place |
| Counting up to a value as it loads | Out of scope: motion that doesn't explain a change |
| Choosing the period ("This month ▾") | The app: a [Select](select.md) or [Segmented Control](segmented-control.md) over the row |
| Layout of mixed content in columns | [Grid](stack.md) |

## Look

**Sizes (sm / md / lg):** The value 24 / 30 / 36px on 32 / 36 / 44px lines, semibold; the label 12 / 14 / 16px on 16 / 20 / 24px lines, medium, the value 4 / 4 / 8 under it; the change and the description in the control's type (12 / 14 / 16px), 4 / 6 / 8 under what's above; the arrow 16 / 16 / 20, 4px before the change's text; the chart 32 / 40 / 48 tall, 8 / 12 / 16 under what's above. A row: stats 24 / 32 / 40 apart, rows the same; with `data-lines`, the line halfway between the stats of a row.

No frame, no fill, no padding: it takes its container's. The label zinc-500 (dark zinc-400); the value zinc-900 (dark white), tabular figures; the change in its intent's color, the 600 (dark the 400; warning amber-600, dark amber-400), neutral zinc-500 (dark zinc-400), medium, with Lucide's `trending-up`, `trending-down` or `move-right` before it; the description zinc-500 (dark zinc-400). The chart zinc-400 (dark zinc-500), or the change's intent color at 60% when the change has one. A row's lines hairline rules (black at 10%, dark white at 10%). Loading: a Skeleton block 6rem wide at the value's size, Button's corners. A linked stat: its label in the text's color, underlined on hover with Link's line; focus a 1px ring in the focus color 4px out from the stat, at Button's corners. Forced colors: the arrow and the chart in the text's color.
