# Number Input

Tier: **T2** (without canon.js it is a native number field: typing and the arrow keys)

A count people nudge up and down: guests, seats, retries. A native `<input type="number">` in a `.canon-number` box, between two [Buttons](button.md) that step it; or, for a number typed as often as nudged, with both buttons stacked at its end.

## Elements

```html
<div class="canon-field">
  <div class="canon-label"><label class="canon-label-text" for="guests">Guests</label></div>
  <div class="canon-number">
    <button type="button" class="canon-button" data-display="icon" commandfor="guests" command="--canon-step-down">
      <span class="canon-icon" data-icon="minus" aria-hidden="true"></span>
      <span class="canon-button-label">Fewer guests</span>
    </button>
    <input type="number" id="guests" name="guests" value="2" min="1" max="8">
    <button type="button" class="canon-button" data-display="icon" commandfor="guests" command="--canon-step-up">
      <span class="canon-icon" data-icon="plus" aria-hidden="true"></span>
      <span class="canon-button-label">More guests</span>
    </button>
  </div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-number` | yes | The box. In a [Field](field.md) it takes the control's place; it is as wide as its parts. |
| `<input type="number">` | yes | The value, `min`, `max`, `step` and the form value. Named by a `<label for>` (in a Field) or `aria-label`. |
| The step buttons | yes | Around the input: first `command="--canon-step-down"`, last `command="--canon-step-up"` (icons `minus` and `plus`). At the end: after the input, step-up then step-down (icons `chevron-up` and `chevron-down`). Both `commandfor` the input, icon only (`data-display="icon"`), their labels the author's ("Fewer guests"). |

### Buttons at the end

```html
<div class="canon-number">
  <input type="number" id="port" name="port" value="8080" min="1024" max="65535">
  <button type="button" class="canon-button" data-display="icon" commandfor="port" command="--canon-step-up">
    <span class="canon-icon" data-icon="chevron-up" aria-hidden="true"></span>
    <span class="canon-button-label">Higher port</span>
  </button>
  <button type="button" class="canon-button" data-display="icon" commandfor="port" command="--canon-step-down">
    <span class="canon-icon" data-icon="chevron-down" aria-hidden="true"></span>
    <span class="canon-button-label">Lower port</span>
  </button>
</div>
```

- **The order says which:** the input first, then step-up, then step-down (icons `chevron-up` and `chevron-down`): the box fills its place like a [Text Input](text-input.md), the value starts where a text field's does, and the two buttons stack at its end, up over down. For a number typed as often as nudged that lines up with the fields around it: a port, a year, a quantity in a long form. Everything else (the keys, holding, the limits, the roll) is the same.
- **For counts:** whole numbers in a small range, nudged more than typed: the buttons around the value. A free number (a price, a weight with its unit, a percentage) is a [Text Input](text-input.md) with `type="number"` and a suffix.
- The value is the input's: typing, the arrow keys (the browser steps by `step`), `required`, `min` / `max` / `step` validation and the form value are all native.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `min`, `max`, `step` (native) | input | numbers | none, none, 1 | — |
| `data-size` | the field, the box or a container | `sm` · `md` · `lg` | theme decides | yes |

Everything else is native: `required`, `disabled`, `readonly`, `aria-invalid`, `aria-describedby`.

## Behavior (canon.js)

- **The buttons** step with the browser's `stepDown()` / `stepUp()` (so `min`, `max` and `step` apply) and fire `input` and `change`.
- They are out of the tab order (the input is one stop; its arrow keys step), and a press doesn't take focus from the input.
- **At a limit** its button is disabled (− at `min`, + at `max`); both are while the input is `disabled` or `readonly`. Values typed or set in code are followed.
- **Holding a button down** repeats the step (after 0.4 s, every 60 ms) until released or at the limit.
- **A step rolls the value** (a button or the arrow keys; not typing): the box is `data-rolling="up"` or `"down"` while the theme's animations run, restarted by the next step. For whole numbers canon.js puts an `aria-hidden` `.canon-number-ticker` over the input's text holding the old value and the new one (the theme moves them and hides the input's text meanwhile); for other values (which each browser writes its own way, `3.5` or `3,5`) the theme rolls the input's own text.
- Without canon.js (`scripting: none`) the buttons are hidden, like every Canon command, and the field is a plain number input.

## States

| State | Hook |
|---|---|
| Focus | the input's `:focus` (the box shows it) |
| Error | `aria-invalid="true"` on the input, or `:user-invalid` |
| Disabled | `disabled` on the input |
| Read-only | `readonly` on the input |
| A button at its limit | `disabled` on the button (canon.js) |
| Rolling after a step | `data-rolling="up"` / `"down"` on the box (canon.js) |

## Core

- The box: an inline flex row. The input: centered tabular figures, growing with its value (`field-sizing: content`), the browser's spin buttons hidden (`appearance: textfield`).
- Buttons at the end: the box is a grid as wide as its place (in a Field, the control's full width), the input start-aligned across both rows, the two buttons a column at the end, one row each.

## Accessibility

- One stop for Tab: the input, a spinbutton to screen readers, with its value, min and max. The arrow keys step it.
- The buttons have names ("Fewer guests"), for pointer and switch users; they are not Tab stops.
- A disabled button at a limit tells sighted users the limit is reached; the input's own `min` / `max` tell screen readers.

## Theme obligations

- The box reads as one control: Text Input's states (hover, focus, error, disabled, read-only) over the whole of it.
- A button at its limit visibly unavailable.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Bigger steps (Shift, Page Up / Down) | canon.js, if it comes up |
| A unit inside the box ("kg") | Text Input's suffix (a free number) |
| Formatting while typing (thousands separators) | If it comes up |

## Look

**Sizes (sm / md / lg):** 32 / 40 / 48 tall: the buttons square, the value at least 48 / 64 / 80px wide (112 / 144 / 176 in all), Text Input's type; corners 4 / 8 / 12 at the ends.

The value in Text Input's frame (white, zinc-200; dark zinc-900, zinc-700), centered; Text Input's faint lift under the whole box; the buttons zinc-100 with zinc-200 lines on their outer sides (dark zinc-700, no line), icons zinc-500 (dark white). From Text Input and Button: hover a darker frame (zinc-400), focus blue-600 with Text Input's 3px halo around the whole box, error red, read-only dashed, disabled zinc-50 with zinc-400 text; the buttons zinc-200 on hover and zinc-300 pressed (dark zinc-600, zinc-500); a button at its limit fades its icon (zinc-300, dark zinc-500).

**Motion:** a step rolls the value (0.2s): stepping up, the old value slides up and out as the new one comes up from below, both fading; stepping down, the other way. A value with decimals rolls in alone, from as far as the box leaves room. With reduced motion it only fades.

**Buttons at the end:** Text Input's frame, states and lift on the whole box, the value where a text input's sits (start-aligned, 12 / 16 / 20 in). The buttons a column 4px in from the end, top and bottom, 20 / 24 / 28 wide: zinc-100 (dark zinc-800), split by a 1px line of the box's color, its corners the box's less 4px; chevrons 10 / 14 / 18, zinc-500 (dark zinc-400); hover zinc-200 (dark zinc-700), pressed zinc-300 (dark zinc-600), at a limit the chevron fades (zinc-300, dark zinc-500). Read-only, the box's line dashed; disabled, zinc-50 (dark zinc-800). The value rolls from where it starts.
