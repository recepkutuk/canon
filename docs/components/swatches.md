# Swatches

Tier: **T0** (expanding is T2, via canon.js)

Pick one color from a few: a radio group drawn as colored circles. Each radio's value is its color and is what the form submits. For any color, use [Color Picker](color-picker.md), which shows these swatches in its popover too.

## Elements

```html
<div class="canon-field">
  <div class="canon-label"><span class="canon-label-text" id="color-label">Color</span></div>
  <div class="canon-swatches" role="radiogroup" aria-labelledby="color-label">
    <input type="radio" name="color" value="#3b82f6" aria-label="Blue" checked>
    <input type="radio" name="color" value="#22c55e" aria-label="Green">
    <input type="radio" name="color" value="#ef4444" aria-label="Red">
  </div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-swatches` | yes | `role="radiogroup"`, named with `aria-labelledby` (the field's label, a `<span id>` as for a [Range Slider](range-slider.md)) or `aria-label`. In a [Field](field.md) it takes the control's place; it is as wide as its swatches. |
| `<input type="radio">` | yes | The only children, one `name`. Each is a swatch: `value` is the color (any CSS color) and the submitted value; `aria-label` names it ("Blue"), since a color has no visible text. |

- **Its color** is the value, read with typed `attr()`. When the value isn't a color (a token or an id: `value="ocean"`), set the color with `style="--canon-swatch: #0ea5e9"`. Browsers without typed `attr()` get it from canon.js, which copies a color value to `--canon-swatch` (an author's `--canon-swatch` always wins).
- **The keyboard is the radio group's:** Tab reaches the chosen swatch (or the first), the arrow keys choose the next one.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-collapse` | `.canon-swatches` | (present) only the chosen swatch shows until the group opens | every swatch shows | no |
| `data-size` | the group or a container | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` (three-size themes: xs is sm, xl and 2xl are lg) | theme decides | yes |
| `disabled` (native) | a radio, or all | | | — |
| `checked`, `required` (native) | a radio | | | — |

## Expanding (`data-collapse`, T2)

canon.js adds a chevron button after the swatches (`.canon-swatches-toggle`, `aria-expanded`, named with the `more-colors` string, out of the tab order). While it is closed, only the chosen swatch shows (none chosen: the first, so Tab still reaches the group).

- **Opens** when focus enters the group (Tab) or on a click anywhere in it: closed, the chevron's target is the whole box.
- **Closes** when focus leaves, on Escape, after a click picks a swatch, or on a click after the last swatch: open, the chevron's target is everything from there to the box's end, its full height. With focus still inside, an arrow key, Enter or Space opens it again (the first key only opens).
- Without canon.js every swatch shows: a plain swatch row.

## States

| State | Hook |
|---|---|
| Chosen | `:checked` |
| Hover, focus | `:hover`, `:focus-visible` on the radio |
| Open (expanding) | `.canon-swatches-toggle[aria-expanded="true"]` |
| Disabled | `disabled` on a radio |

## Core

- The group is a wrapping flex row; swatches are `--canon-swatch-size` (default: the icon size), `--canon-swatches-gap` apart. Radios draw nothing themselves (`appearance: none`): themes paint `--canon-swatch-color` on their `::before` / `::after`.
- While an expanding group is closed, the swatches that aren't chosen are hidden.

## Accessibility

- A radio group: the group's name, each swatch's name, its state (checked) and the arrow keys come from the native radios.
- The chevron is for the pointer; keyboard users open the group by entering it. Its `aria-expanded` says whether the other colors show.
- Colors alone don't tell swatches apart for everyone: the names do. Themes mark the chosen swatch by more than color (a dot, a ring).

## Theme obligations

- The chosen swatch marked by more than its color; focus visible on the swatch, or on the box when the box shows the keyboard's place.
- Every swatch visible against the page, white and black included (an outline or a ring where needed).
- An expanding group looks like a control while closed (it opens), and its chevron shows which way it goes.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Several colors at once | Checkboxes drawn the same way, if it comes up |
| Any color, typed or picked | [Color Picker](color-picker.md) |

## Look

**Sizes (sm / md / lg):** The box is a text input's height (32 / 40 / 48), swatches the icon size (16 / 20 / 24), 8 / 10 / 12 apart and from the edges, Text Input's corners (4 / 8 / 12).

A swatch is the radio's circle (90% of the control) in its color; the chosen one has the radio's white dot (a quarter of the control). Hover: a 3px blue-100 halo (dark blue-900); focus: the choices' ring (2px out, 1px blue-600, dark blue-300). The box: white with a zinc-100 line (dark zinc-900, zinc-800). Expanding: Text Input's line and hover, a zinc-400 chevron (dark zinc-500) pointing right while closed and left while open; open, or closed with keyboard focus inside, the box shows Text Input's focus (blue-600 line, 3px blue-100 ring; dark blue-400, blue-900) and the swatches lose their own ring. A 1px edge inside every swatch (10% black, dark 15% white), so white and black swatches still show; disabled swatches at 45% opacity.

**Motion:** opening, the other swatches grow in from the chosen one and fade in (0.2s), the chevron turning; closing, they shrink back into it. Not while canon.js sets the group up (the toggle is `data-state="ready"` after the first paint); none with reduced motion.
