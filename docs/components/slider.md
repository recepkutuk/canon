# Slider

Tier: **T0** (fill, value display and placed marks are T2, via canon.js)

Pick a value from a continuous or stepped range. For two values (a from–to range), use Range Slider (`range-slider.md`).

## Anatomy

A Slider is a **Field** (`field.md`) whose box holds a native range input:

```
canon-field
├── canon-label                   <label for> + optional description (label.md)
└── canon-control                 no frame around a slider
    ├── canon-control-prefix      optional · min label, author text, aria-hidden
    ├── <input type="range">      the native element, no class
    ├── canon-control-suffix      optional · max label, author text, aria-hidden
    ├── canon-control-value       optional · <output for aria-hidden>, kept in sync by canon.js
    └── <datalist>                optional · named marks, linked with list
└── canon-field-message
```

```html
<div class="canon-field">
  <div class="canon-label">
    <label class="canon-label-text" for="cpu">CPU limit</label>
    <p class="canon-label-description" id="cpu-description">Per instance.</p>
  </div>
  <div class="canon-control">
    <span class="canon-control-prefix" aria-hidden="true">0</span>
    <input type="range" id="cpu" name="cpu" min="0" max="16" step="1" value="4"
           aria-describedby="cpu-description">
    <span class="canon-control-suffix" aria-hidden="true">16 vCPU</span>
    <output class="canon-control-value" for="cpu" aria-hidden="true">4</output>
  </div>
</div>
```

- **The native input does the work:** keyboard, `min` / `max` / `step`, the form value, accessibility. Without CSS or JS it is still a working slider.
- **Min and max labels** are the box's prefix and suffix: author text (the words are the author's, "16 vCPU"), `aria-hidden` like every affix. CSS can't read the input's `min` / `max` from a sibling.
- **The value** is an `<output>` that canon.js keeps in sync. It is `aria-hidden`: the input already exposes its value, and a live `<output>` would announce every change a second time. Without scripting it isn't shown (it would go stale). Themes place it beside the slider or as a bubble over the thumb (Canon: a bubble while the thumb is hovered, focused or dragged).
- Core lays the box out as a grid with named areas, so every slot has its place whatever is present.

## The fill (T2)

CSS can't read a range input's live value, so canon.js sets `--canon-slider-percent` (0–100, unitless) on the box as the value changes, and core draws the fill from it. Without canon.js the slider works, unfilled.

For a value floated over its thumb, canon.js also reports, on the box, the track's length as `--canon-slider-track-length` and the `<output>`'s width as `--canon-slider-value-size` (CSS can't measure either), so a theme can keep the bubble centered on the thumb yet inside the track, and aim its arrow at the thumb.

## Named marks

```html
<input type="range" id="priority" name="priority" min="0" max="2" value="1" list="priority-marks">
<output class="canon-control-value" for="priority" aria-hidden="true">Medium</output>
<datalist id="priority-marks">
  <option value="0">Low</option>
  <option value="1">Medium</option>
  <option value="2">High</option>
</datalist>
```

- The `<datalist>` goes **inside the box**, after the input; themes show it as a row of labels under the track. The labels are the option text (the author's words).
- **T0:** the labels are spread evenly, which is right when the values are evenly spaced.
- **T2:** canon.js places each label at its value (`--canon-mark-percent`, `data-state="placed"` on the list), so uneven values (1 month / 6 months / 1 year) line up. Labels are centered on their value but start-aligned at the minimum and end-aligned at the maximum, so they never overhang the track.
- When the value is on a mark, canon.js shows the mark's name in the `<output>` and sets **`aria-valuetext`** on the input, so screen readers say "Medium", not "1".
- Values are formatted in the element's language (`Intl.NumberFormat`).

## Vertical (author hint)

```html
<div class="canon-field" data-orientation="vertical">
```

- Same hint as on Fieldset, in the `canon.hints` layer. Core stands the input up with native `writing-mode` (minimum at the bottom), so keyboard and accessibility follow.
- The length is `--canon-slider-length` (theme default; the app may override it). Height is layout, not markup.
- The suffix and value sit above the track, the prefix below; named marks beside it, spread evenly (not placed by value).

## States

| State | Hook |
|---|---|
| Focus | `:focus-visible` on the input (themes draw it on the thumb) |
| Disabled | `disabled` |
| Invalid | `aria-invalid="true"` + danger message, or `:user-invalid` |

## Theme contract

Core maps custom properties onto both engines' pseudo-elements (`::-webkit-slider-*`, `::-moz-range-*`), so a theme writes its slider once. **Set them on the box**, where marks and values see them too:

| Property | Draws |
|---|---|
| `--canon-slider-track-size`, `--canon-slider-track-radius` | track thickness and corners |
| `--canon-slider-track`, `--canon-slider-fill` | inactive and active colors |
| `--canon-slider-thumb-inline-size`, `-block-size`, `-radius` | thumb shape |
| `--canon-slider-thumb`, `--canon-slider-thumb-border`, `--canon-slider-thumb-shadow` | thumb paint, halo, focus ring |
| `--canon-slider-thumb-scale` | grow on hover / press without reflow |
| `--canon-slider-track-image` | replaces the fill gradient (on the input) |
| `--canon-slider-length` | vertical length |

Read-only, from canon.js (on the box): `--canon-slider-percent` (the value, 0–100), `--canon-slider-track-length` (the track's length in px, along it, vertical too) and `--canon-slider-value-size` (the `<output>`'s width, for a bubble). A value floated over the thumb can be placed in the track's cell: an absolutely positioned grid item with `grid-area: track` (the box positioned) has that cell as its containing block. Draw a bubble's arrow on the `<output>` itself, not on the input: browsers don't reliably paint (Chromium while it fades) or draw at all (Firefox) pseudo-elements on a range input.

For a custom track (gaps around the thumb, say), themes read `--canon-slider-pos-start`, `--canon-slider-pos-end` (positions on the track, accounting for the thumb's travel) and `--canon-slider-direction` in a `--canon-slider-track-image` declared on the input.

## Theme obligations

- No frame around a slider's box (no border, background, padding or focus ring on the box; focus is on the thumb).
- **No `gap` on a slider's box:** absent slots leave empty grid columns, and gaps would still apply. Core spaces slots with margins.
- Use the slider tokens; style vendor pseudo-elements only for what the tokens can't express.

## Size

**sm:** 4px track, 16px control (14.4px thumb), 12px value

**md / lg:** 5 / 6px, 20 / 24px (18 / 21.6px), 14 / 16px value

## Look

**Track and thumb:** A track a quarter of the control (4 / 5 / 6px), zinc-200 (dark zinc-700), filled zinc-900 (dark white); the thumb the checked radio's look, 90% of the control, white with a zinc-900 ring a quarter of it thick (dark zinc-900 with a white ring). Focus is the choices' ring (2px out, 1px blue-600, dark blue-300); disabled zinc-300 with a zinc-100 middle (dark zinc-600, zinc-400); invalid red-600 (dark red-500)

**Value:** the Tooltip inverted (zinc-900 with white text, in dark mode white with zinc-900 text) at the slider's size, 4px over the control (6px beside it on the left when vertical), only while hovered, focused or dragged; centered on the thumb, sliding in at the ends, its arrow on the thumb

**Min / max labels:** the label description's look

## Deferred

- **Editable value** (a number box you can type into): with Number input.
- **Tick marks on the track** at each named mark.
