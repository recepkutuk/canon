# Card

Tier: **T0**

A framed box: one thing (a customer, a project) or one part of a page (billing details, a settings group), set apart. A [Section](section.md) is the same anatomy without the frame.

## Elements

```html
<section class="canon-card">
  <header class="canon-card-header">
    <h3 class="canon-card-title">Billing details</h3>
    <p class="canon-card-description">Where invoices go, and when they're due</p>
    <div class="canon-card-actions">
      <button type="button" class="canon-button" data-intent="neutral">…Edit…</button>
    </div>
  </header>
  <div class="canon-card-body">
    <dl class="canon-description-list">…</dl>
  </div>
  <footer class="canon-card-footer">
    <button type="button" class="canon-button" data-intent="neutral">…Cancel…</button>
    <button type="submit" class="canon-button" data-emphasis="high" data-align="end">…Save…</button>
  </footer>
</section>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-card` | yes | A `<section>` when it is a part of the page; an `<article>` when it stands on its own (one of many, in a list or a grid); a `<form>` when it is one; a `<div>` otherwise. |
| `.canon-card-header` | no | First. The title, then an optional description and actions. |
| `.canon-card-title` | with a header | A heading (`<h2>`–`<h6>`), at the level the page's outline needs. |
| `.canon-card-description` | no | A `<p>`: one line about the card. |
| `.canon-card-actions` | no | [Buttons](button.md) about the card (Edit, View all, a "…" menu). |
| `.canon-card-body` | no | The padded content, its things one under another. At most one. |
| `.canon-card-footer` | no | Last, under a line: actions about the whole card. `data-align="end"` on an item sends it and what follows to the far end. |
| Anything else directly in the card | — | Runs edge to edge: a [Table](table.md) (dropping its own frame for the card's), an image. |
| [Section](section.md)s directly in the card | — | Its parts: padded like a body, a line between them (a settings card's groups). |
| `.canon-card-link` | no | An `<a href>` in the title: the whole card becomes its link. One per card. |

- **A link card:** a click anywhere on the card opens the title's link, and its other buttons and links stay themselves, above it. Screen readers hear one link, named by the title, not the whole card's text. Use it for cards that each open a record.
- **Landmarks:** a `<section>` card is not a landmark unless named (`aria-labelledby` its title). Name only the few that should be, or every card becomes one.
- **Not a Dialog or a Popover:** a card is part of the page, never on top of it.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-size` | the card or a container | `sm` · `md` · `lg` | theme decides | yes |
| `data-align` | an item in the footer | `end` | — | — |

## Core

- A column: the header, the body, the footer at the bottom. What runs edge to edge is clipped to the card's corners.
- The header: the title and the actions in a row, the description under both; when the card is narrow (under 20rem, a container query), the actions go under it all.
- A link card: the link's `::after` covers the card; other controls in it are raised above it.

## Accessibility

- The title is a real heading, so the card shows up in the page's outline.
- A link card is one link named by its title; its other controls are separate tab stops.
- The footer's actions read after the content they act on.

## Theme obligations

- The card set apart from the page (a line, a fill).
- A link card shows hover and focus on the whole card.
- Use logical properties: in right-to-left the actions sit on the left.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A card you select (a checkbox, a radio) | If it comes up: a [Checkbox](checkbox.md) or [Radio](radio.md) card |
| A collapsible card | Accordion |
| A danger card ("Delete workspace") | If it comes up: `data-intent` |
| Dashboard numbers | [Stat](stat.md), in the card |

## Look

**Sizes (sm / md / lg):** Padding 16 / 20 / 24 (the shell's inset and 8px); the header 12 / 16 / 20 above the body; titles 14 / 16 / 18px on 20 / 24 / 28px lines; text in the control's type (12 / 14 / 16px); Table's corners (8 / 12 / 16).

The shell's measures and Table's frame. White (dark zinc-900) with a hairline edge (black at 12%, dark white at 12%) and the raised shadow (0 1px 2px at 6%, 0 1px 3px at 4%); a link card's edge darkens to 22% under the pointer; titles semibold; descriptions zinc-500 (dark zinc-400). Hairline rules (black at 10%, dark white at 10%) between Sections and above the footer. A Table edge to edge, its edge cells lined up with the card's padding. A link card takes the focus ring when its link has focus.
