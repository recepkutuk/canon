# Color Picker

Tier: **T2** (without canon.js it is the browser's color input)

Pick any color: a native `<input type="color">` in a box that shows it. canon.js opens a picker under the box instead of the browser's: a saturation and brightness area, hue, opacity, an eyedropper, the value as HEX, RGB, HSL or HSB, and swatches. For a choice among a few colors, use [Swatches](swatches.md).

## Elements

```html
<div class="canon-field">
  <div class="canon-label"><label class="canon-label-text" for="brand">Brand color</label></div>
  <div class="canon-color">
    <input type="color" id="brand" name="brand" value="#3b82f6" list="brand-colors">  <!-- alpha: opacity -->
    <datalist id="brand-colors">                                                       <!-- optional -->
      <option value="#3b82f6" label="Blue"></option>
      <option value="#22c55e" label="Green"></option>
    </datalist>
  </div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-color` | yes | The box: Text Input's frame, sizes and states, as wide as its swatch and chevron. |
| `<input type="color">` | yes | The value (what the form submits). Named by a `<label for>` (in a Field) or `aria-label`. |
| `<datalist>` | no | Linked with `list`, inside the box. Its options are swatches in the picker, named by their `label`; their values may have opacity (`#18181b80`). The browser's own picker shows them too. |

### What canon.js adds

Themes style these; authors don't write them.

```html
<div class="canon-color">
  <input type="color" … aria-haspopup="dialog" aria-expanded="false" aria-controls="…">  <!-- transparent, over the box -->
  <span class="canon-color-swatch" aria-hidden="true"></span>                          <!-- --canon-color on the box -->
  <div class="canon-color-popup" popover role="dialog" aria-labelledby="…">
    <div class="canon-color-area" role="slider" tabindex="0" aria-label="Saturation and brightness" aria-valuetext="…">
      <span class="canon-color-thumb"></span>
    </div>
    <div class="canon-color-tools">
      <button class="canon-color-eyedropper" aria-label="Pick a color from the screen"></button>   <!-- where the browser has one -->
      <div class="canon-color-sliders">
        <input type="range" class="canon-color-hue" aria-label="Hue">
        <input type="range" class="canon-color-opacity" aria-label="Opacity">                       <!-- alpha -->
      </div>
    </div>
    <div class="canon-color-fields">
      <div class="canon-select" data-size="sm"><select aria-label="Format">HEX · RGB · HSL · HSB</select></div>
      <div class="canon-color-values"><div class="canon-text-input" data-size="sm">…</div>…</div>   <!-- one per value -->
      <div class="canon-text-input canon-color-percent" data-size="sm">…%</div>                    <!-- alpha -->
    </div>
    <hr class="canon-separator" data-size="sm">                                                <!-- with a datalist -->
    <div class="canon-color-caption">Swatches</div>
    <div class="canon-swatches" role="radiogroup">…</div>
  </div>
</div>
```

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `value` (native) | input | a color | `#000000` | — |
| `alpha` | input | (present) opacity: the value is an 8-digit hex | opaque | — |
| `data-inline` | `.canon-color` | (present) the picker in the page, always shown, in place of the box | a box that opens it | no |
| `list` (native) | input | the `<datalist>`'s id: swatches | none | — |
| `data-size` | the field, the box or a container | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` (three-size themes: xs is sm, xl and 2xl are lg) | theme decides | yes |

Everything else is native: `disabled`, `required`, `aria-invalid`, `aria-describedby`.

## Behavior (canon.js)

- **Opening:** a click on the box, Enter, Space or Down on it opens the picker (not the browser's). Escape, a click outside or a second click on the box closes it, and focus goes back to the box. Opened from the keyboard, focus starts on the area with its ring; by the pointer, on the area without one.
- **The area:** drag or click to set saturation (across) and brightness (down); the arrow keys move by 1, with Shift by 10. It mirrors in right-to-left. Screen readers hear "Saturation 76%, brightness 96%".
- **Hue and opacity** are native range inputs (keyboard and screen readers included).
- **Fields:** the format select shows the value as HEX (one field), RGB, HSL or HSB (three joined fields), and the opacity in percent with `alpha`. A value applies on Enter or when the field is left; one that isn't a color is put back.
- **Swatches** (the datalist): picking one sets the color; the one matching the color is chosen.
- **Eyedropper:** where the browser has the EyeDropper API (Chromium), a button picks a color from the screen. Elsewhere there is no button.
- **The value:** the input gets `input` as the color changes and `change` when the picker closes with a new color, as the native one does. Without `alpha` it is the browser's 6-digit hex. With `alpha` it is an 8-digit hex (`#3b82f680`); browsers can't keep opacity in a color input yet, so canon.js turns the input into a read-only text field holding that code (the same name, id and label; the box still shows the swatch). Where a browser supports `alpha` natively, its input is kept.
- **Inline (`data-inline`):** canon.js puts the picker right after the box, as a `role="group"` named like the input, and the box is hidden (its input still holds the value the form submits). A click on the label goes to the area. `change` fires where a native control's would: a drag ends, a key is released, a slider's `change`, a field is applied, a swatch is picked, the eyedropper returns. The input's `disabled` disables every control in the picker; its `aria-invalid` and `aria-describedby` are copied to the group. Without canon.js it is the usual box.
- **Apps** that set the value in code fire `input` or `change` on the input; canon.js follows. Form resets are followed.

Without canon.js (inline too), the box shows the native swatch and opens the browser's picker, with the datalist's colors; `alpha` has no effect.

## States

| State | Hook | Notes |
|---|---|---|
| Open | `.canon-color-popup:popover-open` | Shown like focus; the chevron turns. |
| Focus | the input's `:focus` | |
| Error | `aria-invalid="true"` on the input | With a danger message, in a Field |
| Disabled | `disabled` | Doesn't open. Inline: every control in the picker is disabled. |

## Core

- Without canon.js the input owns the box as a Select does (`--canon-select-start` / `-end`), its swatch where a value would be. With canon.js it covers the box, transparent, over `.canon-color-swatch`.
- The popover is anchored to the box, in the first place it fits in the window: below, then above (starting at the box's start edge, else ending at its end edge), then beside the box at its inline end, then its inline start (centered on the box, shifted to stay in the window). Five fallbacks (`position-try-fallbacks`), the most Chromium tries. `self-` keywords: the field's own direction (in right-to-left, "end" is the left). Themes set the gap with `--canon-popup-offset`.
- The area is the hue under a white-to-clear gradient (from the inline start) and a clear-to-black one (from the top); the thumb sits at `--canon-color-saturation` and `--canon-color-brightness`. The hue track shows every hue, the opacity track the color fading to clear (`--canon-color-track`). Colors for themes: `--canon-color` (with opacity), `--canon-color-opaque`, `--canon-color-hue`.

## Accessibility

- The input keeps its label and is announced as opening a dialog (`aria-haspopup="dialog"`, `aria-expanded`). The picker is a dialog named like the input.
- The area is a slider with a two-part value text; hue and opacity are native sliders; fields are named ("Red", "Hue", "Opacity").
- Swatches are a radio group named "Swatches", each named by its datalist label.
- Strings (`color-area`, `color-area-value`, `hue`, `opacity`, `eyedropper`, `color-format`, `hex`, `red`, `green`, `blue`, `saturation`, `lightness`, `brightness`, `swatches`) are translated in `i18n/` and follow `lang`.

## Theme obligations

- The box looks like a Select at rest, with the color in place of the value; see-through colors over a checkerboard.
- Thumbs visible on any color (area and sliders); focus visible on the area, the sliders and every field.
- The picker reads as part of the box (anchored to it), and fits a narrow screen.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Every format at once (four rows) | Dropped: one row with a format select |
| Wide-gamut colors (`colorspace="display-p3"`) | When browsers support it on color inputs |
| Saving picked colors as new swatches | Not decided |

## Look

**Sizes (sm / md / lg):** The box: a text input's height (32 / 40 / 48), the swatch and chevron the icon size, 8px apart and (height - icon) / 2 from the edges (56 / 68 / 80px wide). The picker: one size, 344px wide.

The box is Text Input's, the swatch a swatch's circle (90%). The picker: 16px padding and gaps, corners 16px, white (dark zinc-900), 4px under the box; as a popup no frame: a hairline edge (black at 12%, dark white at 12%) and the floating shadow, in the page a zinc-300 line (dark zinc-600). The area fills the width (312px), corners 4px, a zinc-200 ring (dark zinc-700); its thumb 24px. The eyedropper: 40px, corners 8px, zinc-100 (dark zinc-700) with a 20px zinc-500 pipette (dark zinc-400). Sliders 16px from it, 4px apart: 12px tracks with round ends and a 20% line, the opacity one over a checkerboard; 16px thumbs. Thumbs: the color with a 3px white ring inside and a 1px zinc-900 line. Fields: sm, the select 72px, hex 80px or three joined into 156px, opacity 60px at the end. A small [Separator](separator.md) (12px), the caption in Select's group caption type, 24px swatches 12px apart, 16px more under them. Focus rings (the choices'), the eyedropper's hover (zinc-200, dark zinc-600). Inline: the same panel, no wider than its container; an error turns its line red-600 (dark red-500); disabled, it fades to 45% like a disabled swatch. The format select keeps Select's chevron.

**Motion:** the picker opens and closes as a Popover does: it fades in from 97% (0.15s) and out where it is (0.1s); with reduced motion it only fades.
