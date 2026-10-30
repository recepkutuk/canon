# Status Indicator

Tier: **T0**

Where something stands, in a word and a dot: Draft, Sent, Paid, Overdue. A status in text, light enough for a column of a [Table](table.md) where every row has one.

## Element

```html
<span class="canon-status" data-intent="danger">
  <span class="canon-status-label">Overdue</span>
</span>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-status` | yes | A `<span>`; its only child is the label. The theme draws the dot. |
| `.canon-status-label` | yes | The status, a word or two. Also when only the dot shows (it stays as the status's text for screen readers). |

- **The label says it; the dot repeats it.** A status is never the color alone.
- **Status or [Tag](tag.md)?** The same words (`data-intent`), two weights. A Status in text and lists, many to a screen; a Tag where the status is the point, one or two to a screen (beside a record's title in its [Page Header](page-header.md)).
- **Not a [Count](count.md):** no numbers. Not an [Avatar](avatar.md)'s status: a person's presence is the avatar's dot.
- **Changing by itself** (a deploy finishing): the app puts the status in a live region (`role="status"`) if people should hear the change.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-intent` | the status | `info` · `success` · `warning` · `danger` | none: neutral | no |
| `data-pulse` | the status | present: in progress right now | absent | no |
| `data-size` | the status or a container | `sm` · `md` · `lg` | theme decides | yes |
| `data-display` | the status or a container | `icon`: the dot only, the label visually hidden | label shown | yes |

- **`data-intent`:** `info` (sent, scheduled), `success` (paid, live), `warning` (due soon, needs attention), `danger` (overdue, failed). None: neutral (draft, inactive, queued).
- **`data-pulse`:** for the few states that change by themselves while you look (syncing, deploying), not for "pending". Reduced motion stops it.
- **The dot only:** where something else says what the colors mean (a legend, a column header, a tooltip on what it sits beside). On its own, a dot is just a color.

## Core

- An inline row, one line: the dot (`::before`), then the label, cut (…) where there is no room.

## Accessibility

- Read as its text: "Overdue". No role and nothing announced around it. In a table cell, the column header gives it its context ("Status, Overdue").
- The dot is decoration; with the dot only, the label is visually hidden and still read.
- In forced colors the dot keeps its shape (filled, or a ring for neutral), in the text's color.

## Theme obligations

- Each intent's dot distinguishable from the others; neutral clearly "nothing happening".
- The pulse calm, and off with reduced motion.
- Use logical properties: in right-to-left the dot comes first on the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A status with a time ("Paid 3 days ago") | The app's text after it |
| Steps of a process | Steps |
| A progress amount | Meter / Progress |

## Look

**Sizes (sm / md / lg):** Dots 6 / 8 / 10px, 6 / 6 / 8px before the label; the label in the control's type (12 / 14 / 16px).

Labels zinc-700 (dark zinc-300). Dots: info blue-500, success green-600, warning amber-500, danger red-600 (dark: the 400s); neutral a hollow zinc-400 ring (dark zinc-500), as an avatar's offline. `data-pulse`: a ring grows from the dot and fades every 1.6s. Forced colors: the dot in the text's color.
