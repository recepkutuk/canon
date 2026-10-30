# Date

Tier: **T2** (without canon.js it is the browser's date field)

One date: a native `<input type="date">` in a `.canon-date` box, Text Input's frame. canon.js draws the field itself (day, month and year parts, the same in every browser) and adds a button that opens a calendar, or shows the calendar in the page (`data-inline`). The input stays underneath, hidden: the value (`2025-10-10`), `min`, `max`, `required` and the form value are still the browser's.

A **range** is two date inputs in one box (a start and an end), with a two-month calendar and optional presets. A **week** is an `<input type="week">` in the box, with week numbers in its calendar. The **day strip** (`data-strip`) shows a date as a row of days in the page (a week, or as many as fit).

## Elements

```html
<div class="canon-field">
  <div class="canon-label"><label class="canon-label-text" for="start">Start date</label></div>
  <div class="canon-date">
    <input type="date" id="start" name="start" min="2025-01-01" data-weekdays="1-5" placeholder="Select date">
  </div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-date` | yes | The box: Text Input's frame, sizes and states. |
| `<input type="date">` | yes | The value (what the form submits). Named by a `<label for>` (in a Field) or `aria-label`. |

### A range

```html
<div class="canon-field" role="group" aria-labelledby="stay-label">
  <div class="canon-label"><span class="canon-label-text" id="stay-label">Stay</span></div>
  <div class="canon-date">
    <input type="date" id="stay-from" name="from" aria-label="Check-in">
    <input type="date" id="stay-to" name="to" aria-label="Check-out">
    <datalist>                                          <!-- optional: presets -->
      <option value="this-week"></option>
      <option value="last-7-days"></option>
      <option value="2025-12-24/2025-12-26" label="Holidays"></option>
    </datalist>
  </div>
</div>
```

- **Two native date inputs**, each with its own `name` (the form submits both) and `aria-label` (the author's words: "Start", "Check-in"). As for a [Range Slider](range-slider.md), the field's label is a `<span id>` naming the pair, with `role="group"` and `aria-labelledby` on the field.
- **min, max and the other rules** can go on either input; the calendar follows them all (a day is out if any input rules it out). An end before the start is invalid ("The end date is before the start date.").
- **Presets** (`<datalist>` in the box): each option's value is a keyword, named in the reader's language — `all` (`min` to `max`, or empty), `today`, `yesterday`, `this-week`, `last-week`, `last-7-days`, `this-month`, `last-month`, `last-30-days`, `this-year`, `last-year` (weeks start on the calendar's first day; "this" is the whole period) — or a start/end range with a `label`. Without canon.js the datalist shows nothing.

### A week

```html
<div class="canon-field">
  <div class="canon-label"><label class="canon-label-text" for="sprint">Sprint</label></div>
  <div class="canon-date">
    <input type="week" id="sprint" name="sprint" value="2025-W42" min="2025-W01">
  </div>
</div>
```

- **The value is an ISO week** (`2025-W42`): weeks start on Monday, and a week belongs to the year of its Thursday, so `2026-W01` starts on 29 December 2025. The calendar starts on Monday whatever the language (`data-week-start` doesn't apply).
- **The field** shows the week and its year in the `week-format` string ("Week {week}, {year}"), drawn like a date's.
- **Browsers without week inputs** (Firefox, Safari) make it a text input; canon.js draws the same field and calendar, keeps the same value, and checks `min` and `max` itself ("This week can't be chosen."). Without canon.js there, it is a plain text field.
- `data-weekdays`, `data-unavailable` and `canonUnavailable` are for dates; a week takes `min` and `max`.

### The day strip

```html
<div class="canon-date" data-strip>
  <input type="date" id="slot" name="slot" value="2025-10-03" min="2025-10-01">
</div>
```

- **A row of days in the page**, in place of the box: each day its weekday, number and month. As many whole days as fit, a week at most; previous and next move by the days shown (a week when all seven show, three when three fit). For picking a day close to now (a delivery slot, a booking), where a month is more than needed. One date input; not with a range, a week or `data-inline`.
- A whole week starts as the calendar's (`data-week-start`, else the language's); fewer days start around the value (it near the middle) and slide from there. `min`, `max` and the other rules grey the days that can't be chosen.

- **Why canon.js draws the field:** browsers draw date fields differently and each adds its own picker (Firefox an icon inside the field that CSS can't hide, Safari a popup on click). Drawn by canon.js, it looks and behaves the same everywhere, and only Canon's calendar opens.
- **The order and separators follow the reader's language** (`10.10.2025`, `10/10/2025`, `2025-10-10`); the value is always ISO (`2025-10-10`).
- **Placeholder:** with `placeholder` on the input, canon.js shows it while the field is empty and not focused (a native date field has none).

### What canon.js adds

Themes style these; authors don't write them.

```html
<div class="canon-date">
  <input type="date" … tabindex="-1" aria-hidden="true">               <!-- underneath, invisible -->
  <div class="canon-date-segments" role="group" aria-labelledby="…">    <!-- the field; data-empty: empty, with a placeholder; a range's: data-part="start" / "end" -->
    <span class="canon-date-segment" data-type="month" role="spinbutton" contenteditable aria-label="Month"
          aria-valuemin="1" aria-valuemax="12" aria-valuenow="10" aria-valuetext="October">10</span>   <!-- data-empty: no value yet -->
    <span class="canon-date-literal" aria-hidden="true">/</span>
    …day, year in the language's order…
    <span class="canon-date-placeholder" aria-hidden="true">Select date</span>
  </div>
  <!-- a range: <span class="canon-icon canon-date-arrow" data-icon="arrow-forward" aria-hidden="true">, then the second input and its field -->
  <button class="canon-button canon-date-button" data-emphasis="minimal" data-display="icon"
          aria-haspopup="dialog" aria-expanded="false" aria-controls="…">  <!-- the popover's invoker -->
    <span class="canon-icon" data-icon="calendar" aria-hidden="true"></span>
    <span class="canon-button-label">Choose date</span>
  </button>
  <div class="canon-calendar" popover role="dialog" aria-labelledby="…" data-view="days">   <!-- data-inline: after the box, role="group" -->
    <div class="canon-calendar-header">
      <button class="canon-button" data-emphasis="minimal" data-display="icon">…Previous month</button>
      <button class="canon-button canon-calendar-title" data-emphasis="low" aria-label="Oct 2025, choose a month">Oct 2025</button>
      <button class="canon-button" data-emphasis="minimal" data-display="icon">…Next month</button>
    </div>
    <table class="canon-calendar-grid" role="grid" aria-labelledby="…title">
      <thead><tr><th scope="col" abbr="Sunday">Su</th>…</tr></thead>        <!-- data-unavailable: a weekday that can't be chosen -->
      <tbody><tr><td aria-selected="true">                                  <!-- the value -->
        <button class="canon-calendar-cell" data-date="2025-10-10" aria-label="Friday, 10 October 2025">10</button>
      </td>…</tr></tbody>
    </table>
  </div>
</div>
```

A range's calendar has two `.canon-calendar-month`s side by side (each a header and a grid; previous on the first, next on the last, a `.canon-calendar-spacer` in their place elsewhere; plain titles) and, with presets, a `.canon-calendar-presets` group of buttons (`aria-pressed` on the one matching the range). A one-month calendar is one `.canon-calendar-month` too.

The day strip (`data-strip`) follows the box: `.canon-date-strip` (`role="group"`, named like the input) holds previous, `.canon-date-strip-days` (as many days as fit) and next; each day is a `.canon-date-strip-day` button (named by its full date; `aria-pressed="true"` is the value, `aria-disabled` can't be chosen, `aria-current="date"` today) of `.canon-date-strip-weekday`, `.canon-date-strip-number` and `.canon-date-strip-month`.

A week's calendar adds a column of week numbers before the grid (`.canon-calendar-weeks`, a table hidden from assistive technology; its buttons, out of the tab order, carry `data-week`; the chosen one's cell is `[data-selected]`), in a `.canon-calendar-body` with the grid; its title is plain. The chosen week's day cells are `[data-in-week]` and `aria-selected`.

The days view is always six weeks, the days of the months before and after filling it, so the calendar keeps its height from month to month. A day button can be `[data-outside]` (another month), `aria-disabled="true"` (can't be chosen) and `aria-current="date"` (today). In a range, its cell is `[data-in-range]`, with `[data-range-start]` / `[data-range-end]` at the ends, `aria-selected` on every day of the range, and `[data-preview]` on the days a range in the making would take. The months view is a 3 × 4 grid of month buttons (`data-month`), the years view a 4 × 3 grid of a decade with the year before it (`data-year`; the first is `[data-outside]`).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `value`, `min`, `max` (native) | input | ISO dates | — | — |
| `data-weekdays` | input | ISO weekdays that can be chosen, 1 is Monday: `1-5`, `1,3,5`, `1-5 7` | every day | — |
| `data-unavailable` | input | dates and start/end ranges that can't be chosen: `2025-12-25 2025-12-29/2026-01-02` | none | — |
| `placeholder` | input | text shown while empty | none | — |
| `aria-label` | each input of a range | its name ("Start", "End") | — (required) | — |
| `data-inline` | `.canon-date` | (present) the calendar in the page, in place of the box | a box that opens it | no |
| `data-header` | `.canon-date` (not a range) | `select`: the month and the year as two Selects in the calendar's header | a title that zooms out | no |
| `data-strip` | `.canon-date` (one date input) | (present) a row of days in the page (as many as fit, a week at most), in place of the box | a box that opens a calendar | no |
| `data-week-start` | the box or a container | `1`–`7` (1 is Monday, 7 Sunday) | the language's first day | yes |
| `data-size` | the field, the box or a container | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` (three-size themes: xs is sm, xl and 2xl are lg) | theme decides | yes |

Everything else is native: `required`, `disabled`, `readonly`, `aria-invalid`, `aria-describedby`, `name`, `form`.

### The app's function

For rules no attribute can say (booked days, a holiday API), the app sets a function on the input:

```js
input.canonUnavailable = (iso) => bookedDays.has(iso);   // true: can't be chosen
```

canon.js asks it for every day it draws and every value typed. It is read when the calendar draws, so after the rules change, the next open (or the next month shown) follows them.

## Behavior (canon.js)

- **The field** (not inline): a part takes digits and moves on when it can't take more (a month of 2, a day of 4, four year digits); a separator key moves on too. Up and Down step a part (from today when empty, wrapping days and months), Left and Right move between parts (reversed right-to-left), Tab goes through them like a native field's segments, Backspace clears a part, then goes back. Enter submits the form. A pasted date (ISO, or numbers in the field's order) fills every part. Parts are editable (`contenteditable`), so phones show a number keyboard; typing goes through `beforeinput`. A press on the box, or on the label, goes to the first empty part.
- **The value:** a complete date sets the input and fires `input` and `change` (a day past the month's end becomes its last day); clearing a part empties it. Leaving an incomplete date fires `change`, and the input is invalid ("Enter a complete date.").
- **Opening:** the calendar button ("Choose dates" for a range, "Choose week" for a week), or Alt+Down in a field. A second click on the button, Escape or a click outside closes it; focus goes back to the field. It opens at the value (else today, kept within `min` and `max`), with focus on that day: with a focus ring from the keyboard, without one from the pointer.
- **Picking a day** sets the value, fires `input` and `change` (as the browser's picker does), closes, and focus goes back to the field.
- **The day strip:** a click, Enter or Space picks a day (`input` and `change`); one tab stop, the day in hand; Left and Right move a day, past either end on to the next days shown (reversed right-to-left), Home and End go to the first and last shown, Page Up and Page Down by the days shown; previous and next move by the days shown (and say which). How many show follows the space it has (whole days only, 1 to 7), again when it changes. It shows the value (else today) and follows the value. `disabled` makes it inert. A click on the label goes to the strip.
- **Picking a week:** a click on a week number, or on (or Enter on) any of its days, sets the week, fires `input` and `change`, closes, and focus goes back to the field. The keyboard moves by days as in a date's calendar.
- **Picking a range:** the first day picked sets the start (and empties the end); the pointer, or the keyboard, then previews the range to the day under it; the second sets the end (either order: the earlier one starts), closes, and focus goes to the end field. A preset sets both and closes. Each input fires its own `input` and `change`. The two months follow the focused day; previous and next move both. Days of the months before and after can be picked too.
- **Month and year Selects** (`data-header="select"`): the header holds two [Selects](select.md), "Month" and "Year", in place of the zooming title (which stays, hidden, naming the grid). Choosing either shows that month; previous and next update them. Months outside `min`–`max` are off; years run from `min` to `max`, else a century back and ten years ahead (always including the one shown).
- **Zoom:** the title shows the view and goes out a level: days → months → years → days. Picking a month shows its days; picking a year, its months. Previous and next move by a month, a year or ten years; the calendar is `data-turning="next"` or `"previous"` while the theme's animations run (also when the keyboard crosses into another month).
- **Keys** (the grid): arrows move a day (a week up and down); Home and End go to the week's start and end; Page Up and Page Down move a month, with Shift a year. In months, arrows move a month (three up and down) and Page keys a year; in years, a year (four up and down) and Page keys ten. Enter or Space picks. The grid follows the direction (right-to-left reverses Left and Right).
- **Can't be chosen:** before `min` or after `max`, a weekday outside `data-weekdays`, a date in `data-unavailable`, or one the app's function rules out. Such days are greyed, can be reached by the keyboard but not picked; months and years entirely outside `min`–`max` too, and previous / next stop there. A typed date ruled out by the last three makes the input invalid (`setCustomValidity`, "This date can't be chosen."), as `min` and `max` do natively; in a Field it shows like any validation message.
- **Inline (`data-inline`):** the calendar follows the box, in the page (`role="group"`, named like the input); the box is hidden. A click on the label goes to the calendar. `disabled` or `readonly` on the input makes it inert.
- **Disabled and read-only:** disabled parts leave the tab order; read-only parts can be focused but not changed, and the calendar button stays, off (`aria-disabled`).
- **The language** (the nearest `lang`) gives the month and day names (two letters in English, `Su Mo`; the narrow form where short names are long), the digits and the week's first day.
- **Apps** that set the value in code fire `input` or `change` on the input; canon.js follows. Form resets are followed.

Without canon.js: the browser's own date field and picker; `data-weekdays`, `data-unavailable` and the placeholder have no effect (`min` and `max` still do).

## States

| State | Hook | Notes |
|---|---|---|
| Open | `.canon-calendar:popover-open` | The box shows focus. |
| A range | `[data-in-range]`, `[data-range-start]`, `[data-range-end]`, `[data-preview]` on day cells | |
| Focus | the input's `:focus` | |
| Error | `aria-invalid="true"` on the input, or `:user-invalid` | With a danger message, in a Field. |
| Disabled, read-only | `disabled`, `readonly` | The calendar button is off; inline, the calendar is inert. |

## Core

- Without canon.js the input fills the box like a Text Input's. With it, the input covers the box, invisible and out of reach (`opacity: 0`, `pointer-events: none`), under `.canon-date-segments`: a flex row taking the input's place, tabular figures. The placeholder lies over it, at the box's padding, while `[data-empty]` and not `:focus-within` (the parts are transparent then).
- The popover is anchored to the box like Color Picker's (below, then above, then beside; `--canon-popup-offset`).
- The grid is a table: seven columns of the control height (`--canon-control-block-size`), months and years sharing that width. Cells are buttons filling them, tabular figures. Previous and next icons mirror in right-to-left.

## Accessibility

- The field is a group named like the input (its label, description, `aria-invalid` and `aria-required` copied) of spinbuttons named "Day", "Month", "Year", each with its value (the month by name) or "Empty". The hidden input is out of the tab order and the accessibility tree; its label still works (it moves focus to the field), and so does its validation (an invalid date on submit moves focus to the field, and a Field shows the message).
- The calendar button is named "Choose date" and says it opens a dialog; the calendar is a dialog (inline, a group) named like the input.
- The grid is `role="grid"` named by the title ("Oct 2025"); previous and next announce the new month, year or decade; weekday headers carry the full name (`abbr`); each day button is named by its full date ("Friday, 10 October 2025"), today is `aria-current="date"`, the value's cell `aria-selected`, days that can't be chosen `aria-disabled` (still reachable, so nothing jumps).
- One tab stop in the grid (roving `tabindex`); the title says what it does ("Oct 2025, choose a month").
- A range's fields are each named by their input ("Check-in"), inside the field's group ("Stay"); the range's end days add ", start" and ", end" to their names; presets are a group named "Presets" of toggle buttons.
- A week's field is spinbuttons named "Week" and "Year"; the week numbers' column is for the pointer only (the days pick the week from the keyboard, and the grid says which days are chosen).
- The day strip is a group named like the input, of toggle buttons named by their full dates ("Friday, 3 October 2025"); previous and next announce the days now shown.
- Strings (`choose-date`, `choose-dates`, `choose-week`, `previous-week`, `next-week`, `week-column`, `week-format`, `date-week`, `date-week-placeholder`, `week-incomplete`, `week-unavailable`, `range-start`, `range-end`, `date-range-order`, `presets`, `preset-all` … `preset-last-year`, `previous-month`, `next-month`, `previous-year`, `next-year`, `previous-years`, `next-years`, `show-months`, `show-years`, `show-days`, `date-unavailable`, `date-incomplete`, `date-day`, `date-month`, `date-year`, `date-day-placeholder`, `date-month-placeholder`, `date-year-placeholder`, `date-empty`) are translated in `i18n/` and follow `lang`.

## Theme obligations

- The box looks like a Text Input with the calendar button at its end; with focus in the field, or the calendar open, it shows focus. The part being typed in is marked; empty parts look like a placeholder.
- The chosen day stands out by more than a hue change (a filled cell); days of other months and days that can't be chosen are told apart from each other and from the rest; focus is visible on every cell and header button; today is marked.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A range calendar that wraps (one month under the other) in a narrow space | If needed: an inline range with presets is about 620px wide at sm |
| Several dates, time, date and time | Later in the family |

## Look

**Sizes (sm / md / lg):** The box: Text Input's (32 / 40 / 48). The calendar: cells 32 / 40 / 48 square, padding and corners 8 / 12 / 16 (240 × 328 / 304 × 396 / 368 × 464, always six weeks), cell corners 4 / 8 / 12, Text Input's type.

White (dark zinc-900); as a popover no frame: a hairline edge (black at 12%, dark white at 12%) and the floating shadow, in the page a zinc-300 line (dark zinc-800); 4px under the box. Header: Button's minimal icon buttons and a low title, zinc-900 (dark white). Weekdays regular zinc-500 (dark zinc-400); days medium; 16 between header, weekdays and days, rows 8 apart. Other months zinc-400 (dark zinc-500); can't be chosen zinc-300 (dark zinc-700), their weekday headers too; hover zinc-100 (dark zinc-800), a step lighter than a range's band; chosen as a neutral high Button: zinc-900 with white text (dark: white with zinc-900). The box: the calendar icon zinc-400 (dark zinc-500), the placeholder in the placeholder color. A range: two months the icon size (16 / 20 / 24) from a hairline rule between them (black at 10%, dark white at 10%), 496 × 328 / 624 × 396 / 752 × 464 with a six-week month, plain titles; its two ends chosen, the days between a zinc-200 band (dark zinc-700) in the text's color, rounded at its ends and each week's; days of other months in it the band at 40% with zinc-400 text (dark zinc-500), so the range reads in its own month's pane; a preview the band with zinc-400 text; presets a column past another line, Button's minimal ones in zinc-500 (dark zinc-400), the matching one on zinc-200 (dark zinc-700); the box: the two dates at its ends, a zinc-400 arrow (Lucide arrow-right) between. Today's dot sits 4 / 6 / 8 above the cell's bottom. `data-header="select"`: two Selects 4 apart, the month 68 / 84 / 100 wide and the year 76 / 92 / 108, centred. The day strip: the calendar's frame (432 × 72 / 576 × 88 / 720 × 104), padding 8 / 12 / 16 across and 4 down and its parts that far apart; days 48 / 64 / 80 wide, 4 above and below, Text Input's corners; weekday zinc-500 and month zinc-400 a step smaller than the medium number (10 / 12 / 14); chosen zinc-900 (dark white), the number white (dark zinc-900), the weekday at 75% and the month at 60% of it; hover zinc-100 (dark zinc-800), focus (the choices' ring), days that can't be chosen zinc-300 (dark zinc-700), no today dot (aria-current only). A week: the week numbers' column the cell width, a hairline rule the icon size from it on each side (304 × 328 at sm), "W" in the weekday type; the chosen week's number chosen (zinc-900, white); its days the band, rounded at the row's ends. The range's calendar button (kept, so both kinds open the same way), the dark range colors, the presets column sizing to its labels, the field's parts (empty ones and separators in the placeholder color, the focused one on zinc-200, dark zinc-700, 2px corners), the focus ring (the choices', blue: focus keeps the focus color), today's dot (4px, under the number), an inline calendar disabled at 45%.

**Motion:** the calendar opens and closes as a Popover does: it fades in from 97% (0.15s) and out where it is (0.1s); with reduced motion it only fades.

**Turning:** to another month (year, decade), the days slide in 12px from the side it turns to and fade in (0.2s); the header and weekdays stay. Mirrored in right-to-left; with reduced motion they only fade.

**Day strip:** picking a day, the chosen fill glides to it from the day before (0.3s, fast then settling; drawn once and anchored to the chosen day, each day drawing its own where anchor positioning is missing and in forced colors). Moving to other days (previous, next, the keys past either end; `data-turning` on the strip, canon.js), the days slide in 12px from the side they come from and fade in (0.2s), the fill moving with them. Mirrored in right-to-left; with reduced motion nothing glides or slides, the new days only fade in.
