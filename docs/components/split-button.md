# Split Button

Tier: **T1** (the arrow opens its menu with the browser's popover) · the menu's keyboard is **T2** ([Menu](menu.md))

A button with a menu beside it: the action people usually want one click away, its variations one more ("Add", or add from a template, import…). Two [Buttons](button.md) joined, the second opening a [Menu](menu.md).

## Elements

```html
<div class="canon-split-button">
  <button type="button" class="canon-button" data-emphasis="high">
    <span class="canon-icon" data-icon="plus" aria-hidden="true"></span>
    <span class="canon-button-label">Add</span>
  </button>
  <button type="button" class="canon-button" data-emphasis="high" data-display="icon"
          popovertarget="add-menu" aria-haspopup="menu" aria-expanded="false">
    <span class="canon-button-label">More ways to add</span>
  </button>
</div>

<div class="canon-menu" id="add-menu" popover role="menu" aria-label="More ways to add">…</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-split-button` | yes | Exactly two Buttons. |
| The action | yes | A Button: what it does without the menu. |
| The arrow | yes | A Button with `data-display="icon"`, `popovertarget` (its menu) and `aria-haspopup="menu"`. Its label says what the menu holds ("More ways to add", "More save options"): it is the button's name. The arrow itself is the theme's (Button's menu indicator). |
| The menu | yes | A [Menu](menu.md), outside the split button, named like the arrow (`aria-label`, or `aria-labelledby` the arrow). |

- **One look:** both buttons carry the same `data-emphasis` and `data-intent` (a Delete with "Delete permanently" in its menu is danger on both).
- **Size:** `data-size` on the split button sizes both; the menu takes it from a container around both, or carries its own.
- **Minimal** suits toolbars ("Text color ▾": the action applies the last choice, the arrow picks another). Themes may draw it as one piece at rest and show the two halves only on hover, focus or while the menu is open.
- Each button keeps its own states: the arrow alone can be `disabled` (nothing else to offer just now); both disabled disable the split button.
- Not a group of equals: buttons that are alternatives side by side are a [Button Group](button-group.md).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-emphasis` | both buttons | Button's | `medium` | no |
| `data-intent` | both buttons | Button's | neutral | no |
| `data-size` | the split button or a container | `sm` · `md` · `lg` | theme decides | yes |

## Behavior

Each button is a Button; the arrow opens its menu like any menu button (Menu's behavior: Down or Enter opens it at the first item, a choice closes it and returns to the arrow). canon.js marks the menu `data-split-button`: it opens under the arrow and ends where the split button ends (flipping to fit).

## States

Button's, on each half. Open: `aria-expanded="true"` on the arrow.

## Core

- An inline flex row of the two buttons. The menu (`data-split-button`): `position-area: self-block-end span-self-inline-start`.

## Accessibility

- Two buttons, each with its own name: "Add", "More ways to add, menu, collapsed". Two Tab stops.
- The arrow's name says what is in the menu, not "More" or "Options" alone.

## Theme obligations

- Join the two buttons (one piece, a line or gap between) and show the arrow on the second.
- Keep the focus ring visible over the neighbour.

## Look

**Sizes (sm / md / lg):** Button's sizes (32 / 40 / 48); the arrow square.

The two joined, corners only at the ends; between them a hairline that takes no space, the button's own tint laid over it: white at 15% on high, the medium tint (tone-400 at 15%; dark tone-500 at 20%) on medium, the low border (tone-200; dark tone-300 at 35%) on low; disabled zinc-200 (dark zinc-800). Minimal (a toolbar's "Text color ▾") is one quiet piece at rest, with no line; pointing at either half, focusing it or opening the menu joins them: both take the lightest tint (tone-400 at 8%), the half in use a stronger one (15%, pressed 20%), and the line shows in the low border's color. The arrow is the menu chevron, turning up while open, the arrow held at the pressed look. The menu opens 4px under it, ends level. Minimal, intents, dark mode and states, from Button.
