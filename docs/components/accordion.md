# Accordion

Tier: **T0** (the browser's `<details>`: no JavaScript)

Parts of a page that open one by one, under rows that name them: a settings page's advanced options, a record's less-used details, a help page's questions. Each item opens and closes by itself, or, with one `name`, one at a time.

## Elements

```html
<div class="canon-accordion">
  <details class="canon-accordion-item" open>
    <summary class="canon-accordion-summary">
      <span class="canon-accordion-title">Billing details</span>
      <span class="canon-accordion-description">Where invoices go, and when they're due</span>
    </summary>
    <div class="canon-accordion-content">…</div>
  </details>
  <details class="canon-accordion-item">
    <summary class="canon-accordion-summary">
      <span class="canon-icon" data-icon="mail" aria-hidden="true"></span>
      <span class="canon-accordion-title">Reminders</span>
      <span class="canon-count">3</span>
    </summary>
    <div class="canon-accordion-content">…</div>
  </details>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-accordion` | yes | A `<div>` around the items, even for one (an "Advanced options" disclosure). |
| `details.canon-accordion-item` | yes | One per part. `open` for one that starts open. |
| `summary.canon-accordion-summary` | yes | First in its item: the row people click. It is the button; the theme draws the chevron. |
| `.canon-accordion-title` | yes | A `<span>`: what the part is, a few words. |
| `.canon-accordion-description` | no | A `<span>` under the title: what's in it, or its state ("2 of 5 set"). |
| `.canon-icon` | no | First in the summary, `aria-hidden="true"`. Use them on every item or none. |
| A [Tag](tag.md), [Count](count.md) or [Status Indicator](status.md) | no | Last in the summary: a fact about the part ("3", "Overdue"), read with the title. |
| `.canon-accordion-content` | yes | After the summary: anything (text, a [Description List](description-list.md), fields, a nested accordion). |

- **One at a time:** the same `name` on every item of an accordion; opening one closes the one that was open. Use it for parts people compare one after the other (questions); leave it out where several are open together (settings).
- **Not a heading:** a summary is a button, and inside it a heading loses its role in screen readers. When the parts belong in the page's outline (people jump between them), use [Sections](section.md) instead, or a heading before the accordion.
- **Nothing interactive in the summary:** no links or buttons in the row; actions go in the content.
- **Accordion, Tabs or Sections?** [Tabs](tabs.md) show one part in place of another, for parts of the same weight; Sections show everything; an Accordion shows the names and opens what's needed, for parts people mostly skip.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `open` | an item | present: open | closed | — |
| `name` | every item | a name shared by the accordion's items: one open at a time | none: each on its own | — |
| `data-size` | the accordion or a container | `sm` · `md` · `lg` | theme decides | yes |

## Core

- The summary is a row: the icon, the title with the description under it, the Tag (Count, Status) at the end, the chevron last. Columns only for what's there. The browser's marker is hidden.

## Behavior (T0, the browser)

- **Opening and closing:** a click on the row, Enter or Space on it. The `toggle` event fires on the item.
- **Finding:** the browser's find in page, and links to something inside a closed item (`#id`), open it.
- **One at a time:** items sharing a `name` close each other.
- No canon.js.

## Accessibility

- Each summary is a button that says whether it's expanded ("Billing details, collapsed"); its whole text is its name, the description and the Tag included, so keep them short.
- The icon is decoration; the chevron is the theme's.
- Content in a closed item is out of the way: not read, not reached with Tab, but found by find in page.

## Theme obligations

- Rows told apart (a line, a gap), the open state shown by more than the content appearing (the chevron).
- The row's focus ring visible, around the whole row.
- Opening calm, and none with reduced motion.
- In forced colors, the chevron still shows.
- Use logical properties: in right-to-left the icon is on the right, the chevron on the left.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Expand all, collapse all | If it comes up: a canon.js command on the accordion |
| An action in the row (Edit, Delete) | The content; or a Section with header actions |
| Remembering what's open across visits | The app (`toggle`, then `open` in its markup) |
| A tree of nested items with keys | Tree View |

## Look

**Sizes:** rows 8 / 12 / 16px inside (sm / md / lg); titles 13 / 14 / 16px, descriptions 12 / 13 / 14px; icons 16 / 16 / 20px; the chevron 16px; 12px between the row's parts; the content 12 / 16 / 20px over the next line.

Rows divided by hairline rules (black at 10%, dark white at 10%), a line above the first and under the last (not under the last when it ends a Card's body, where the Card's edge closes it; neither for one nested in another's content, framed by the outer rows), no box, so it sits the same on a page and in a [Card](card.md). The title medium in the text's color, its description under it in zinc-500 (dark zinc-400); the icon zinc-500; the chevron zinc-500 (dark zinc-400), the text's color on hover, turning over when open. The content in zinc-600 (dark zinc-300), lined up with the title. Opening and closing slide (0.2s, where the browser can animate to the content's height; none with reduced motion). Focus: a 2px ring in the focus color around the row, 2px out, 6px corners. Forced colors: the chevron in the text's color.
