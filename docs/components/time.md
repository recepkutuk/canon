# Time

Tier: **T2** (without canon.js it is the browser's time field)

A time of day: when a meeting starts, a shift ends, a report runs. A native `<input type="time">` in a `.canon-time` box, a component of its own. canon.js draws the field itself: each part (hours, minutes, and AM/PM where the reader's language uses it) is a cell of its own, typed into, stepped with the arrow keys, or nudged with the up and down arrows the focused cell shows. The input stays underneath, hidden: the value (`14:30`), `min`, `max`, `step`, `required` and the form value are still the browser's.

A **range** is two time inputs in one box: a start and an end.

## Elements

```html
<div class="canon-field">
  <div class="canon-label"><label class="canon-label-text" for="starts">Starts at</label></div>
  <div class="canon-time">
    <input type="time" id="starts" name="starts" value="08:00" step="900">
  </div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-time` | yes | The box. No frame of its own: each cell is framed. |
| `<input type="time">` | yes | The value (what the form submits, always 24-hour `HH:MM` or `HH:MM:SS`). Named by a `<label for>` (in a Field) or `aria-label`. |

### A range

```html
<div class="canon-field" role="group" aria-labelledby="shift-label">
  <div class="canon-label"><span class="canon-label-text" id="shift-label">Shift</span></div>
  <div class="canon-time">
    <input type="time" id="shift-from" name="from" aria-label="Start" value="08:00">
    <input type="time" id="shift-to" name="to" aria-label="End" value="16:30">
  </div>
</div>
```

- **Two native time inputs**, each with its own `name` and `aria-label`; the field's label is a `<span id>` naming the pair, with `role="group"` and `aria-labelledby` on the field, as for a [Date](date.md) range.
- **An end before the start** is invalid ("The end time is before the start time."), unless the range may run past midnight: `data-overnight` on the box (a night shift, 22:00 → 06:00).

### What canon.js adds

Themes style these; authors don't write them.

```html
<div class="canon-time">
  <input type="time" … tabindex="-1" aria-hidden="true">              <!-- underneath, invisible -->
  <div class="canon-time-segments" role="group" aria-labelledby="…">   <!-- data-empty: no value; a range's: data-part="start" / "end" -->
    <span class="canon-time-cell" data-type="hour">                      <!-- the frame; data-active, data-empty -->
      <span class="canon-time-value" role="spinbutton" contenteditable aria-label="Hours"
            aria-valuemin="0" aria-valuemax="23" aria-valuenow="8" aria-valuetext="8">08</span>
      <button type="button" class="canon-time-step" data-direction="up" tabindex="-1" aria-label="Later hour"></button>
      <button type="button" class="canon-time-step" data-direction="down" tabindex="-1" aria-label="Earlier hour"></button>
    </span>
    <span class="canon-time-literal" aria-hidden="true">:</span>
    <span class="canon-time-cell" data-type="minute">…</span>
    <!-- with seconds (step under 60): a second cell; in 12-hour languages: a day-period cell (AM / PM) -->
  </div>
  <!-- a range: <span class="canon-icon canon-time-arrow" data-icon="arrow-forward" aria-hidden="true">, then the second input and its cells -->
</div>
```

- Each cell is a frame holding its spinbutton (the same as Date's parts) and two step buttons beside it, for the pointer (`tabindex="-1"`, named for switch and voice users).
- A cell is `[data-empty]` while it has no value, `[data-active]` while its spinbutton has focus (the theme grows it). A press anywhere in a cell focuses it; its buttons step only once it is active.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `value`, `min`, `max` (native) | input | `HH:MM` or `HH:MM:SS` | — | — |
| `step` (native) | input | seconds: `900` steps minutes by 15, `1` adds seconds | `60` (minutes by 1) | — |
| `aria-label` | each input of a range | its name ("Start", "End") | — (required) | — |
| `data-overnight` | `.canon-time` (a range) | (present) the end may be earlier: the next day | an end before the start is invalid | no |
| `data-size` | the field, the box or a container | `sm` · `md` · `lg` (xs is sm, xl and 2xl are lg) | theme decides | yes |

Everything else is native: `required`, `disabled`, `readonly`, `aria-invalid`, `aria-describedby`, `name`, `form`.

- **12 or 24 hours** follows the reader's language (the nearest `lang`), as Date's order does: 12-hour languages get an AM/PM cell and hours 1–12. The value is always 24-hour.
- **`step` drives the arrows and the keys.** With `step="900"`, Up from 08:00 goes to 08:15, not 08:01; a typed 08:07 is invalid ("Enter a time in steps of 15 minutes.", the browser's own check).

## Behavior (canon.js)

- **Typing:** a cell takes digits and moves on when it can't take more (two digits; a first hour digit of 3–9 in 24-hour, 2–9 in 12-hour, is the whole hour: 3 → 03); `:` or a space moves on too; in the AM/PM cell, A or P chooses. Backspace clears the cell, then goes back. A pasted time (`14:30`, `2:30 pm`) fills every cell. Cells are editable (`contenteditable`), so phones show a number keyboard.
- **Keys:** Up and Down step the cell (from now when empty), wrapping (59 → 00, 23 → 00, PM ↔ AM); minutes and seconds step by `step` and carry nothing into the hour. Left and Right move between cells (reversed right-to-left); Tab goes through them like a native field's.
- **The arrows:** the up and down arrows of the focused cell step it as Up and Down do. Holding one repeats the step (after 0.4s, every 60ms), as Number Input's buttons do. A press doesn't take focus from the cell.
- **The value:** a complete time sets the input and fires `input` and `change`; clearing a cell empties it. Leaving an incomplete time fires `change`, and the input is invalid ("Enter a complete time."). A time outside `min`–`max` is invalid with the browser's own message; a range's end before its start, unless `data-overnight`.
- **A press on the box, or on the label,** goes to the first empty cell, else the hour.
- **Disabled and read-only:** disabled cells leave the tab order; read-only cells can be focused and read but not changed, and show no arrows.
- **The language** (the nearest `lang`) gives the cycle (12 or 24 hours), the day-period names (AM / PM, or the language's) and the digits.
- **Apps** that set the value in code fire `input` or `change` on the input; canon.js follows. Form resets are followed.

Without canon.js: the browser's own time field.

## States

| State | Hook | Notes |
|---|---|---|
| Hover | a cell's `:hover` | That cell's frame darkens. |
| Active | `[data-active]` on the focused cell | It grows, showing its arrows. |
| Empty | `[data-empty]` on a cell | Its placeholder ("--"). |
| Error | `aria-invalid="true"` on the input, or `:user-invalid` | Every cell takes the error line; one message, in a Field. |
| Disabled, read-only | `disabled`, `readonly` | No arrows; read-only cells dashed. |

## Core

- Without canon.js the input is a Text Input-sized field. With it, the input covers the box, invisible and out of reach (`opacity: 0`, `pointer-events: none`), under `.canon-time-segments`: an inline row of cells, literals and (a range) the arrow, tabular figures, centered on each other.
- **The active cell grows over what's around it, never moving it:** its size in the row stays the cell's, and the growth is drawn outside that box, from the middle, equally up and down. It is raised above its neighbours (and the field's label and message) while it is active.
- The step buttons are inside the cell, at its top and bottom; they take no room while the cell is at rest.

## Accessibility

- The field is a group named like the input (its label, description, `aria-invalid` and `aria-required` copied) of spinbuttons named "Hours", "Minutes", "Seconds" and "AM/PM", each with its value or "Empty". The hidden input is out of the tab order; its label still works, and so does its validation.
- One Tab stop per cell, as a native time field. The arrows are not Tab stops: the keys do what they do.
- A range's fields are each named by their input ("Start"), inside the field's group ("Shift").
- Strings (`time-hour`, `time-minute`, `time-second`, `time-period`, `time-hour-placeholder`, `time-minute-placeholder`, `time-second-placeholder`, `time-period-placeholder`, `time-step-up-*`, `time-step-down-*`, `time-incomplete`, `time-range-order`) are translated in `i18n/` and follow `lang`.

## Theme obligations

- Each cell reads as part of one control: the same frame, the separators quiet, the error on every cell at once.
- The active cell unmistakable (its growth and the focus ring), its arrows clearly for that cell only.
- The arrows' targets bigger than the arrows (see Look).
- Growing calm, and none with reduced motion.
- Use logical properties: right to left, the cells and a range's arrow follow the direction; a time's own digits stay in their order.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A list of suggested times | If it comes up (a `<datalist>`, as Date's presets) |
| Date and time in one field | Not a field of its own: a [Date](date.md) and a Time side by side, two components with their own looks (a framed box, a row of framed cells) |
| Durations ("1 h 30 min") | Not a time of day: a Number Input or Text Input with a suffix |
| Time zones | The app (a Select beside the field) |

## Look

**Sizes (sm / md / lg):** A cell is a control's height square (32 / 40 / 48), Text Input's corners (4 / 8 / 12) and type; cells 4 / 4 / 6 apart, the `:` in between; a range's arrow (Lucide arrow-right) the icon size, 8 / 8 / 12 from the cells. Active, a cell is the icon size taller on each side, up and down (52 / 64 / 76 tall), the growth drawn over its neighbours; its arrows fill its top and bottom, the icon size tall (each about 24 × 12 at md), 4px in from the frame.

At rest a cell is Text Input's frame (white, a zinc-200 line; dark zinc-900, zinc-700) with its arrows' tabs peeking: a 4px zinc-100 bar (dark zinc-800) inside its top and bottom edges, the frame's inner corners. Hover: that cell's line zinc-400 (dark zinc-500), the tabs zinc-200 (dark zinc-700). Active: Text Input's focus (blue-600 line, its 3px blue-100 halo; dark blue-400, blue-900), the tabs open into the arrows: zinc-100 buttons (dark zinc-800) with Lucide chevron-up and chevron-down in zinc-500 (dark zinc-400), hover zinc-200 (dark zinc-700), pressed zinc-300 (dark zinc-600). Cells wrap (59 → 00), so no arrow is ever unavailable. The `:` and the arrow zinc-400 (dark zinc-500). Empty cells show "--" in the placeholder color. Error: every cell's line red-400 (dark red-500). Disabled: zinc-50 cells (dark zinc-800), zinc-400 text, no tabs; read-only: dashed lines, no tabs.

**Targets:** for every pointer, each arrow's target reaches 12px further out than the button it draws, past the cell's edge, invisible; the active cell is above everything around it, so the larger target takes nothing from its neighbours.

**Motion:** becoming active, the cell grows from its middle to its full height and the tabs open into the arrows (0.15s, fast then settling); leaving, it shrinks back (0.1s). With reduced motion it changes at once.

## Open questions

- **The resting tabs:** shown at rest for now (as designed); whether they show only while a cell is hovered is still to be decided.
