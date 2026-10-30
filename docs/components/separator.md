# Separator

Tier: **T0**

A line between things, optionally with a word or two in it ("or").

## Elements

```html
<hr class="canon-separator">

<div class="canon-separator">or</div>

<hr class="canon-separator" aria-orientation="vertical">
```

| Element | When | Notes |
|---|---|---|
| `<hr class="canon-separator">` | A line | A thematic break: screen readers hear a separator. As wide as its container, with space above and below. |
| `<div class="canon-separator">` | A line with words | The words are its only content, read as ordinary text; the two lines are the theme's. Not `role="separator"`: a separator's content is hidden from screen readers. |
| `aria-orientation="vertical"` | A vertical line | On the `<hr>`, in a row (a flex container): as tall as the row, with space beside it. No words. |

- Separators inside other components are this one too: between a [Menu](menu.md)'s items, a [Select](select.md)'s or [Combobox](combobox.md)'s options (in the `<select>`; canon.js copies them into a combobox's list), and before the [Color Picker](color-picker.md)'s swatches.
- The words say what comes on each side in a sentence's terms ("or", "Older messages"), not a heading's.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `aria-orientation` | the `<hr>` | `vertical` · `horizontal` | `horizontal` | — |
| `data-size` | the separator or a container | `sm` · `md` · `lg` | theme decides | yes |

## Core

- The `<hr>`: no browser border or margin, its own block. Vertical: stretches in its row.
- The `<div>`: a flex row, the words between `::before` and `::after` that share the rest of the width; one line of words.

## Accessibility

- An `<hr>` is a separator for assistive technology; a vertical one says so with `aria-orientation`.
- Words in a `<div>` are read in reading order, like the text around them.

## Theme obligations

- The line visible against its background, the words quieter than body text.

## Look

**Sizes (sm / md / lg):** A 12 / 16 / 20px row (the line in its middle); words 12 / 14 / 16px on 16 / 20 / 24px lines, 4 / 6 / 8px from the lines.

A hairline rule (black at 10%, dark white at 10%; 1px on screens under 2x), its space growing by what the line gives up so nothing moves; words zinc-500. Vertical, the same line with the same space beside it.
