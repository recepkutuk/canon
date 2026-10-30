# Select

Tier: **T0** (the styled list is T1: browsers that support it, fine pointers; its steady width is T2)

Pick one option from a list. A native `<select>` in a box: keyboard, form value, validation and the mobile picker are the browser's. Where the browser supports customizable selects (`appearance: base-select`), the list is styled too; elsewhere, and on touch devices, it is the native list.

Searching, or picking several values, is a [Combobox](combobox.md): the same markup in `.canon-combobox`.

## Elements

```html
<div class="canon-select">
  <span class="canon-icon" data-icon="globe" aria-hidden="true"></span>      <!-- optional -->
  <select id="region" name="region" required>
    <button><selectedcontent></selectedcontent></button>                      <!-- optional -->
    <option value="" hidden>Please select</option>                            <!-- placeholder, optional -->
    <optgroup label="Europe">
      <option value="eu-west-1">Ireland</option>
      <option value="eu-central-1">Frankfurt</option>
    </optgroup>
    <hr class="canon-separator">
    <optgroup label="Asia">
      <option value="ap-northeast-1" disabled>Tokyo</option>
    </optgroup>
  </select>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-select` | yes | The box: [Text Input](text-input.md)'s frame, sizes and states. The theme draws the arrow. The select reaches under the whole box, so clicking anywhere opens it. |
| `<select>` | yes | Single choice: no `multiple`, no `size`. Named by a `<label for>` (in a Field) or `aria-label`. |
| `.canon-icon` | no | Leading, `aria-hidden="true"`. |
| `<option value="">` | no | **Placeholder:** first, with an empty value; `hidden` keeps it out of the list. With `required`, the select can't be submitted while it is chosen. Themes show it muted. |
| `<optgroup label>` | no | A group with a caption. |
| `<hr class="canon-separator">` | no | A [Separator](separator.md) between options or groups. |
| Clear button | no | After the select: a [Button](button.md) with `command="--canon-clear"` and `commandfor` the select. Goes back to the placeholder (or to nothing chosen); hidden while nothing is chosen. |
| `<button><selectedcontent></selectedcontent></button>` | no | First child. The closed box shows the chosen option's markup (icon, avatar, label); descriptions are left to the list. Without it, the closed box shows the option's text. |

### Options

Plain text, or markup inside the option, in this order:

| Part | Notes |
|---|---|
| `.canon-icon` or `.canon-avatar` | First. Decorative (`aria-hidden`); the theme sizes it. |
| `.canon-option-label` | The name. |
| `.canon-option-description` | After the label, muted. Shown in the list only. |

- **In a text input:** a `.canon-select` box can be the first or last child of a [Text Input](text-input.md) (a country code, a currency). It drops its own frame for a line beside the value, and keeps the width of its widest option.
- **Keep a space between the parts:** the native list shows the option's plain text ("t3.large 2 vCPU · 8 GiB").
- **Don't use the `label` attribute with rich options:** in a customizable list it replaces the option's markup.
- `disabled`: shown, not choosable.
- `data-intent="danger"`: an option that destroys something ("Delete the project"). Rare in a Select; mostly for menus.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-size` | box or a container | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` (three-size themes: xs is sm, xl and 2xl are lg) | theme decides | yes (the list follows) |
| `data-intent` | box | `warning` · `success` | none | no |
| `data-intent` | option | `danger` | none | no |

## States

| State | Hook | Notes |
|---|---|---|
| Open | `select:open` | Shown like focus; the arrow turns. |
| Focus | the select's `:focus` | |
| Placeholder | the empty option `:checked` | Muted text |
| Error | `aria-invalid="true"`, or `:user-invalid` (`required`, empty) | In a Field, canon.js shows the browser's message there. |
| Warning, success | `data-intent` on the box, or a field's message | |
| Disabled | `disabled` | Wins; a status still shows, softened |
| Option chosen | `option:checked` | The theme marks it (`::checkmark`) |
| Option highlighted | `option:hover`, `option:focus-visible` | Hover and the keyboard's place |

## Core

- The box: the shared box rules (like Text Input), with the select stretched under the box's padding, icon and arrow: themes set `--canon-select-start` and `--canon-select-end`, the distances from the border to the text.
- The list (customizable selects): anchored to the whole box, at least as wide, below it, flipping above when there's no room. The browser's arrow is hidden.
- After closing, core keeps the anchor for 400ms so a close transition fades out in place. **Themes keep close transitions under 400ms.**
- In the closed box, `selectedcontent` shows the label, not the description.

## Behavior (canon.js)

- **A steady width:** a Select that sizes to its content (outside a Field: in a Toolbar, a Pagination, a sentence) keeps the width of its longest choice, so what comes after it doesn't move as the choice changes. A plain select always did this; a styled one is only as wide as the choice it shows, so canon.js measures every choice once the select is shown (and again when the page's fonts have loaded) and sets that as its minimum width. A Field's own Select fills the field and is left alone. Without canon.js a styled select follows its choice.

## Accessibility

- Native: the select's role, keyboard (arrows, type to jump, Enter, Escape) and announcements are the browser's.
- Icons and avatars in options are decorative; the label is what is read.
- The placeholder is not a name: the select still needs a label.

## Theme obligations

- The list readable on every surface it opens over; options as tall as touch targets at their size.
- The chosen option marked by more than color (Canon: a check and medium weight).
- Touch devices keep the native picker.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Searching, filtering | [Combobox](combobox.md) with `data-search` |
| Several values (tags in the box) | [Combobox](combobox.md), `multiple` |
| A search field inside the list | [Combobox](combobox.md) with `data-search="list"` (a select's list can't hold one) |
| Typing a new value | [Combobox](combobox.md) with `data-creatable` |
| Menus of actions (context menu) | Menu |

## Look

**Sizes (sm / md / lg):** Box: Text Input's (32 / 40 / 48, radius 4 / 8 / 12); the arrow (Lucide chevron-down, the icon color) 2 / 2 / 0px past the text, turning up while open. List: 4px under the box and 8px wider, so the options' text lines up with the box's; radius 8 / 12 / 16; 4px padding. Options 32 / 40 / 48, the box's text size and inset, radius 4 / 8 / 12. Captions: 10px semibold capitals, 32px rows. Separators: [Separator](separator.md)'s (12 / 16 / 20px rows).

List white (dark zinc-900), no frame: a hairline edge (black at 12%, dark white at 12%) and the floating shadow. Options zinc-900 (dark white); hover zinc-100 (dark zinc-800); chosen medium with a check; disabled zinc-400 (dark zinc-600); destructive red-700 on red-400 at 15% (dark red-300 on red-500 at 20%). Captions zinc-500 (dark zinc-400). Placeholder zinc-500 (dark zinc-400). Styled list for fine pointers only.

**Motion:** the styled list fades in from 97% (0.15s) and fades out where it is (0.1s); with reduced motion it only fades.
