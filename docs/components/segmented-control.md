# Segmented Control

Tier: **T0**

One value from a few, as joined segments: a view (Day, Week, Month), a period (Monthly, Yearly), an alignment. It is a radio group: the chosen option is a form value, and the keyboard is the browser's.

## Elements

```html
<div class="canon-segmented" role="radiogroup" aria-label="Calendar view">
  <label class="canon-segmented-option">
    <input type="radio" name="view" value="day">
    <span class="canon-segmented-label">Day</span>
  </label>
  <label class="canon-segmented-option">
    <input type="radio" name="view" value="week" checked>
    <span class="canon-segmented-label">Week</span>
  </label>
  <label class="canon-segmented-option">
    <input type="radio" name="view" value="month">
    <span class="canon-segmented-label">Month</span>
  </label>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-segmented` | yes | `role="radiogroup"`, named by `aria-label` or `aria-labelledby`. In a [Field](field.md) it takes the box's place and is named by the field's label (a `<span id>`, as for [Swatches](swatches.md)); a description is linked with `aria-describedby` on the group. As wide as its options. |
| `<label class="canon-segmented-option">` | yes | Two or more, the group's only children. Each wraps its radio, an optional icon and its text. |
| `<input type="radio">` | yes | The option's first child, one per option, the same `name` across the group. `value` is what the form submits. One is `checked`. |
| `.canon-icon` | no | Before the text, `aria-hidden="true"`. |
| `.canon-segmented-label` | yes | The option's text, also when only the icon shows (it stays as the option's name). |

- **One option is always chosen:** `checked` on one radio. A choice with no default, longer labels, descriptions or more than about five options are [Radio](radio.md) buttons.
- **Not Tabs:** [Tabs](tabs.md) switch between panels of content, each its own (General, Billing, Members); a Segmented Control sets a value for the same content (the same calendar by day, week or month). Both are a raised card on a track in Canon; Tabs carry icons and counts and head a page's parts.
- **Not a Button Group:** toggles (`aria-pressed`) change the interface right away and aren't form values (bold, italic); see [Button Group](button-group.md).
- **The keyboard is the radio group's:** Tab reaches the chosen option, the arrow keys choose the next one (skipping disabled ones). Choosing fires the radios' `change`.
- **No intents:** a choice between options has nothing to warn about.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-size` | the group or a container | `sm` · `md` · `lg` (xs is sm, xl and 2xl are lg) | theme decides | yes |
| `data-display` | the group or a container | `icon`: the text hidden, square options | theme decides | yes |
| `data-fill` | the group | present: as wide as its place, the options sharing it equally | absent: as wide as its options | no |
| `checked`, `disabled` (native) | a radio | | | — |

- `disabled` on a radio: that option can't be chosen. On every radio, or a disabled `<fieldset>` around the group, the whole control is disabled and keeps showing its value.

## States

| State | Hook |
|---|---|
| Chosen | `:has(> input:checked)` on the option |
| Hover, pressing | `:hover`, `:active` on the option |
| Focus | `:has(> input:focus-visible)` on the option |
| Disabled | `:has(> input:disabled)` on the option |

## Core

- The group is an inline flex row, as wide as its options (`max-inline-size: 100%`); with `data-fill`, as wide as its place, the options sharing it. Options are centered rows that don't wrap; in too narrow a place they shrink and cut their text (…), keeping their full name.
- Each radio covers its option, invisible (`opacity: 0`, `appearance: none`): clicks, touch, screen readers' exploring and the keyboard reach the real radio.

## Accessibility

- A radio group: the group's name, each option's name (its text), its state (checked) and the arrow keys come from the native radios. Heard as "Week, radio button, checked, 2 of 3".
- Icon-only options keep their text as their name. Tooltips can't attach to radios yet; choose icons that read without one.
- The chosen option is marked by more than color: its raised card, and its darker label.

## Theme obligations

- The chosen option unmistakable at a glance, by more than color; hover clearly weaker than chosen.
- Focus visible on the option, over its neighbours.
- In forced colors, the chosen option still shows (Canon: the system highlight).
- Use logical properties: in right-to-left the options run from the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Tooltips on icon-only options | When Tooltip supports radios |
| Several values at once | [Toggle Chips](toggle-chip.md) (checkboxes) |
| Switching panels of content | [Tabs](tabs.md) (the same look) |

## Look

**Sizes (sm / md / lg):** The group 32 / 40 / 48 tall with 3px inside and 2px between options, its corners Button's plus 2px (6 / 10 / 14); options 26 / 34 / 42, corners 3px tighter (3 / 7 / 11), so the card's curve follows the track's; padded and set as a button (Button Group's type); icon only, square.

A filled track, no lines: zinc-100 (dark zinc-800). Labels and icons zinc-600 (dark zinc-400); hover darkens the label to zinc-900 (dark white), pressing adds zinc-200 at 60% (dark zinc-700 at 60%). The chosen option is a white card (dark zinc-700) lifted by a ring of black at 6% (dark white at 6%) and a soft shadow (0 1px 2px at 8%, 0 1px 3px at 5%), its label zinc-950 (dark white). Focus: the button's ring (2px white, 1px blue-600; dark zinc-900, blue-400). Disabled labels zinc-400 (dark zinc-600); chosen and disabled, a flat card (the ring, no shadow; a zinc-400 label, dark zinc-500). The chosen card is drawn once by the track and anchored to the chosen option, so it glides to the next one (0.3s, fast then settling; none with reduced motion); without anchor positioning, and in forced colors, each option draws its own. Forced colors: the chosen option in Highlight.
