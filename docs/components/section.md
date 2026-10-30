# Section

Tier: **T0**

A titled part of a page: billing details, payment terms, a settings group. The same anatomy as a [Card](card.md), without the frame; in a Card, Sections are its parts.

## Elements

```html
<section class="canon-section">
  <header class="canon-section-header">
    <h2 class="canon-section-title">Billing details</h2>
    <p class="canon-section-description">Where invoices go, and when they're due</p>
    <div class="canon-section-actions">
      <button type="button" class="canon-button" data-intent="neutral">…Edit…</button>
    </div>
  </header>
  <dl class="canon-description-list">…</dl>
</section>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-section` | yes | A `<section>` (a `<div>` or `<fieldset>`'s content also fits). |
| `.canon-section-header` | no | First. The title, then an optional description and actions. |
| `.canon-section-title` | with a header | A heading (`<h2>`–`<h6>`): under the page's `<h1>`, an `<h2>`; in a Card, one level under the card's title. |
| `.canon-section-description` | no | A `<p>`: one line about the section. |
| `.canon-section-actions` | no | [Buttons](button.md) about the section. |
| Content | — | Anything after the header. |

- **Section or Card?** A Section when the page's own spacing is enough to tell parts apart; a [Card](card.md) when a part needs setting apart (on a tinted page, among other things, or as one of many).
- **In a Card:** Sections directly in a card are its padded parts, a line between them.
- **Landmarks:** a `<section>` is not a landmark unless named; its heading already puts it in the page's outline.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-size` | the section or a container | `sm` · `md` · `lg` | theme decides | yes |

## Core

- The header: the title and the actions in a row, the description under both; narrow (under 20rem, a container query), the actions go under it all.

## Accessibility

- The title is a real heading: people move through the page by its sections.

## Theme obligations

- The header clearly above its content; the title more prominent than the description.
- Use logical properties: in right-to-left the actions sit on the left.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Space between sections on a page | [Stack](stack.md) (`data-gap="xl"`) |
| A collapsible section | Accordion |

## Look

**Sizes (sm / md / lg):** The header 12 / 16 / 20 above the content; titles 14 / 16 / 18px on 20 / 24 / 28px lines; text in the control's type (12 / 14 / 16px).

A Card's header and type, without the frame: titles semibold, descriptions zinc-500 (dark zinc-400). In a Card, padded like its body with a hairline rule between (black at 10%, dark white at 10%).
