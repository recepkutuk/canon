# Button Group

Tier: **T0** (toggling is T2: canon.js flips `aria-pressed`)

Related buttons joined in one row: text styles, alignment, actions on one thing. The buttons are ordinary [Buttons](button.md) in a named group; the theme draws them as one piece.

## Elements

```html
<div class="canon-button-group" role="group" aria-label="Text style">
  <button type="button" class="canon-button" aria-pressed="true">
    <span class="canon-icon" data-icon="bold" aria-hidden="true"></span>
    <span class="canon-button-label">Bold</span>
  </button>
  <button type="button" class="canon-button" aria-pressed="false">
    <span class="canon-icon" data-icon="italic" aria-hidden="true"></span>
    <span class="canon-button-label">Italic</span>
  </button>
  …
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-button-group` | yes | `role="group"`, named by `aria-label` or `aria-labelledby` ("Text style", "Alignment"). |
| `.canon-button` | yes | Two or more, `<button>` or `<a>`, each a complete Button (its own label, also when only the icon shows). |
| `.canon-tooltip` | no | A button's tooltip, right after it ([Tooltip](tooltip.md)); it takes no place in the row. |

- **Each button does its own thing.** Tab moves through them one by one, as through any buttons. (A toolbar's single tab stop with arrow keys is Toolbar's job.)
- **Toggles:** buttons that switch something on and off carry `aria-pressed` ([Button](button.md)); canon.js flips it on click. Any number can be on (bold, italic, underline), or one at a time with `data-select="one"` (alignment). A choice that is a form value (one of several, submitted with the form) is a [Segmented Control](segmented-control.md), a radio group.
- Buttons stay in one row; a group never wraps. Groups next to each other (a toolbar) wrap as wholes.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-select` | the group | `one`: pressing a toggle releases the others; the pressed one stays pressed · `any` | `any` | no |
| `data-size` | the group or a container | `sm` · `md` · `lg` (xs is sm, xl and 2xl are lg) | theme decides | yes |
| `data-display` | the group or a container | `icon`: every label hidden, square buttons | theme decides | yes |
| `data-intent` | a button | `neutral` · `success` · `warning` · `danger` | none | no |

- `data-emphasis` on buttons in a group: a group is one piece, so themes may draw every emphasis alike (Canon does). `data-intent` still shows (a Delete in a group stays red).

## Behavior (canon.js)

- **A click flips `aria-pressed`, like a checkbox:** before the click's listeners run, so they read the new state, and back if one cancels the click (`preventDefault()`). An app that keeps the state itself (a text editor, from the selection) cancels the click and sets `aria-pressed` as it needs.
- **`data-select="one"`:** the clicked toggle is pressed and the group's others released; clicking the pressed one leaves it pressed.
- Not for command buttons (the command sets the state) or submit buttons (the server does). The same applies to a toggle Button outside a group.
- Without canon.js the buttons show their state but don't flip; the app (or a form round trip) does.

## States

Each button's own ([Button](button.md)): hover, focus (its ring shows over the neighbours), pressed (`aria-pressed="true"`, drawn as clearly held), disabled (`disabled` or `aria-disabled="true"`). A group with every button disabled is disabled.

## Core

- An inline flex row (`max-inline-size: 100%`), buttons at their own width. Nothing else: the joining is the theme's.

## Accessibility

- The group's name says what the buttons share; each button's label says what it does. Icon-only buttons keep their label as their name, and can show it in a tooltip.
- Pressed state is `aria-pressed`, heard as "pressed" / "not pressed".

## Theme obligations

- Draw the buttons as one piece (Canon: one frame), the ends rounded as the theme's buttons.
- Keep the focus ring visible over the neighbours.
- A pressed button clearly held, by more than color alone where the system allows (Canon: filled, pressed in by an inner shadow, and a darker icon).
- Use logical properties: in right-to-left the group runs from the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| One tab stop, arrow keys between buttons | Toolbar |
| A choice that is a form value | [Segmented Control](segmented-control.md) |
| Vertical groups | If it comes up (`data-orientation`) |
| A menu button in a group (split button) | Split Button |

## Look

**Sizes (sm / md / lg):** The group 32 / 40 / 48 tall, its ends rounded 4 / 8 / 12; the buttons its full height, their padding the button's; icon only, square (32 / 40 / 48).

The buttons joined in one frame: a zinc-200 line (dark zinc-600) around them and a 1px line between them that takes no space, like a [Toolbar](toolbar.md)'s single buttons and Selects, with the low button's faint lift under the frame. Labels zinc-900 (dark white), icons zinc-500 (dark zinc-300); disabled labels zinc-400, icons zinc-300 (dark both zinc-500). Hover zinc-50 (dark zinc-800), pressing zinc-100 (dark zinc-700). Pressed (`aria-pressed`): zinc-100 (dark zinc-700), pressed in by an inner shadow (0 1px 2px, black at 8%; dark 40%), the icon in the label's color; pressed and disabled, zinc-50 (dark zinc-800) without the shadow. Forced colors: pressed in Highlight, the lines between buttons borders. Focus: the button's ring (2px white, 1px blue-600; dark zinc-900, blue-400). Every emphasis alike; an intent colors label and icon, and hover and pressing take its tints, the low button's (danger: red-400 at 8% / 15%; dark red-500 at 10% / 20%).
