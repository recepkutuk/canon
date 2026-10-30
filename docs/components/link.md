# Link

Tier: **T0**

Text that goes somewhere: in a sentence ("see how payouts work"), or on its own ("View all invoices"). It takes the text's font and size.

## Elements

```html
<p>Payments arrive within two working days. See <a class="canon-link" href="/payouts">how payouts work</a>.</p>

<a class="canon-link" href="/invoices" data-standalone>
  View all invoices
  <span class="canon-icon" data-icon="arrow-forward" aria-hidden="true"></span>
</a>
```

| Element | When |
|---|---|
| `<a class="canon-link" href="…">` | It **goes** somewhere: another page, a place on this one, a file. |
| `<button type="button" class="canon-link">` | It **does** something, from inside text ("Didn't get the code? Send it again."). Elsewhere, an action is a [Button](button.md). |
| `.canon-icon` | Optional, before or after the text, `aria-hidden="true"`: the text names the link. |

- **Its text says where it goes** on its own ("how payouts work", not "click here"): screen reader users often list a page's links.
- **With an icon** the link is one piece (the text still wraps inside it), and the gap between icon and text is the theme's; the markup's spaces don't matter.
- **Not for actions outside text,** and not a Button with a link's look for navigation: an `<a class="canon-button">` goes somewhere and looks like a button ([Button](button.md)).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-standalone` | the link | (present): on its own, outside a sentence (under a list, in a card, a table cell) | in text | no |
| `data-emphasis` | the link | `low`: the surrounding text's color (a footer, fine print) | the theme's link color | no |
| `target="_blank"` (native) | `<a>` | opens a new tab | | — |
| `disabled` (native) | `<button>` | | | — |
| `aria-disabled="true"` | `<a>` without `href` | a link that can't go anywhere now | | — |

- **In text a link is underlined** (it shows by more than its color). A standalone link's place says it's a link, so the theme may drop the underline until hover or focus. A low link keeps its underline: its color doesn't tell it apart.
- **A new tab** (`target="_blank"`) only when leaving would lose the person's work. The theme draws the indicator, and screen readers hear "(opens in new tab)" (the `--canon-text-opens-in-new-tab` string, translated in `i18n/`). Browsers don't let the new page reach this one (no `rel` needed).
- No size: a link is as big as its text (a heading's, a `<small>`'s).

## States

| State | Hook |
|---|---|
| Hover, active, focus | `:hover`, `:active`, `:focus-visible` |
| Disabled | `disabled` (button), `aria-disabled="true"` (a link without `href`) |
| Visited | `:visited`, the theme's choice (app links usually show none) |

## Core

- Inline, in the text's font; icons are 1em. A `<button class="canon-link">` loses the button's box (no padding, border or background) and flows as text.
- With an icon: an inline flex row, the text setting the baseline, the icon centered, a `--canon-link-gap` (0.25em) between.

## Accessibility

- A link's name is its text; icons are hidden. A new tab is announced through the indicator's alternative text.
- A disabled `<a>` has no `href`: it isn't focusable or announced as a link, so say nearby why it isn't available when it matters.
- The focus ring follows the text across lines.

## Theme obligations

- A link in text tells itself apart from the text by more than color (an underline), in every color scheme.
- Hover and focus visible; focus as a ring around the text, on every line it wraps to.
- Draw the new-tab indicator with the `--canon-text-opens-in-new-tab` alternative text, mirrored where it points.
- Use logical properties: icons and the indicator follow the text's direction.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Plain `<a>` in long-form text (articles, docs) | Prose foundation (the Rich Text area already draws its links this way) |
| A link to the current page | Nav List, Tabs, Breadcrumb (`aria-current`) |
| Intents (a red link) | A [Button](button.md) with `data-intent`, if it comes up |
| Download size and format ("PDF, 2 MB") | The author's words after the link |

## Look

**Sizes:** The text's; icons 1em, 0.25em from the text; the new-tab icon 0.875em, 0.2em after it.

The rich text area's links made a component. Blue-600 (dark blue-400), hover blue-700 (dark blue-300); underlined 1px at 0.2em, the line at 40% of the color, full on hover. Standalone: no line until hover or focus. Low: the text's color, always underlined. Focus: a 1px blue-600 ring 2px out (dark blue-400), 2px corners. Disabled zinc-400 (dark zinc-600). New tab: Lucide's external icon, mirrored right to left. No visited color.
