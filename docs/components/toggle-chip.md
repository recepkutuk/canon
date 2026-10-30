# Toggle Chip

Tier: **T0**

Options you turn on and off, drawn as chips: quick filters (Remote, Full-time), interests, categories. Each chip is a checkbox, or a radio when only one can be on; its value is sent with the form.

## Elements

```html
<div class="canon-toggle-chips" role="group" aria-label="Job type">
  <label class="canon-toggle-chip">
    <input type="checkbox" name="job-type" value="remote" checked>
    <span class="canon-toggle-chip-label">Remote</span>
  </label>
  <label class="canon-toggle-chip">
    <input type="checkbox" name="job-type" value="contract">
    <span class="canon-toggle-chip-label">Contract</span>
  </label>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-toggle-chips` | for a set | The set's only container: `role="group"` for checkboxes, `role="radiogroup"` for radios, named by `aria-label` or `aria-labelledby`. A wrapping row. In a [Field](field.md) it takes the box's place and is named by the field's label (a `<span id>`, as for [Swatches](swatches.md)); a description is linked with `aria-describedby` on the group. A single checkbox chip needs no set. |
| `<label class="canon-toggle-chip">` | yes | Wraps its input, an optional icon and its text. |
| `<input type="checkbox">` or `<input type="radio">` | yes | The chip's first child, named; `value` is what the form submits. Radios share a `name` and live in a set. |
| `.canon-icon` | no | Before the text, `aria-hidden="true"`. While the chip is on, the theme's check takes its place. |
| `.canon-toggle-chip-label` | yes | The chip's text and name. |

- **Checkboxes:** any number on; Tab moves from chip to chip, Space turns one on or off.
- **Radios** (`role="radiogroup"`): one on at a time; Tab reaches the chosen chip, the arrow keys move between them. For a few short options in one row, a [Segmented Control](segmented-control.md) reads better; chips suit a longer set that wraps (sizes, time slots).
- **Not a Tag:** a [Tag](tag.md) shows something and can at most be removed. **Not a Checkbox list:** [Checkbox](checkbox.md) suits longer labels, descriptions, a form read top to bottom. **Not a Button toggle:** `aria-pressed` changes the interface right away and isn't a form value ([Button](button.md)).
- Choosing fires the input's `change`; an app filtering as you click listens there.
- **No intents.**

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-size` | a chip, the set or a container | `sm` · `md` · `lg` (xs is sm, xl and 2xl are lg) | theme decides | yes |
| `checked`, `disabled` (native) | an input | | | — |

## States

| State | Hook |
|---|---|
| On | `:has(> input:checked)` on the chip |
| Hover, pressing | `:hover`, `:active` on the chip |
| Focus | `:has(> input:focus-visible)` on the chip |
| Disabled | `:has(> input:disabled)` on the chip |

## Core

- The set is a wrapping flex row, as wide as its chips (`max-inline-size: 100%`). A chip is an inline row that doesn't wrap; wider than the room, it cuts its text (…) and keeps its full name.
- Each input covers its chip, invisible (`opacity: 0`, `appearance: none`), as in Segmented Control: clicks, touch, screen readers and the keyboard reach the real input.

## Accessibility

- Checkboxes and radios: the set's name, each chip's name (its text), its state and the keys come from the native inputs. Heard as "Remote, checkbox, checked" ("M, radio button, checked, 3 of 6").
- On is marked by more than color: the check.

## Theme obligations

- On unmistakable by more than color; hover clearly weaker than on.
- Turning a chip on or off never changes its width, so the chips after it stay where they are (Canon: a chip without an icon keeps the check's room while off).
- Focus visible on the chip.
- In forced colors, chips that are on still show (Canon: the system highlight).
- Use logical properties: in right-to-left the chips run from the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A count on a chip ("Remote 12") | A [Count](count.md) accessory, if it comes up |
| A chip that removes itself | [Tag](tag.md) with its remove button |
| A row of filters with facets | [Filter Bar](filter-bar.md) (chips sit in it as quick filters) |

## Look

**Sizes (sm / md / lg):** Chips 24 / 32 / 40 tall (a control's height − 8), padded and set as a button, fully rounded, 6 / 8 / 10 apart; icons and the check the icon size.

Button's look as a chip. A zinc-200 line (dark zinc-700), labels zinc-700 (dark zinc-200), icons zinc-500 (dark zinc-400); hover zinc-50 with a zinc-300 line (dark zinc-800, zinc-600), pressing zinc-100 (dark zinc-700). On: a neutral high Button's colors, zinc-900 with a white label (dark: white with zinc-900), hover zinc-800 (dark zinc-200), pressing zinc-700 (dark zinc-300), and a check before the label in place of the icon; a chip without an icon keeps the check's room while off, half on each side, and the check grows into it (0.15s, none with reduced motion), so its width never changes; hover and pressing a step stronger. Focus: the button's ring (2px white, 1px blue-600; dark zinc-900, blue-400). Disabled: zinc-400 labels, a zinc-100 line (dark zinc-600, zinc-800); on and disabled, zinc-100 (dark zinc-800). Forced colors: on in Highlight.
