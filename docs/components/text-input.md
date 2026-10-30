# Text Input

Tier: **T0** (box actions are T2, via canon.js)

A one-line text box around a text-like `<input>` (`text`, `email`, `search`, `url`, `tel`; passwords are [Password](password.md)). On its own it is named with `aria-label`; with a [Label](label.md) it is a [Field](field.md). Multi-line text is [Textarea](textarea.md); selects are [Select](select.md) and [Combobox](combobox.md); number gets a component of its own.

## Elements

```html
<div class="canon-text-input">
  <span class="canon-icon" data-icon="tag" aria-hidden="true"></span>
  <span class="canon-text-input-prefix" aria-hidden="true">$</span>
  <input type="text" inputmode="decimal" aria-label="Price in USD" placeholder>
  <span class="canon-text-input-suffix" aria-hidden="true">USD</span>
  <button type="button" class="canon-button" data-emphasis="minimal" data-display="icon"
          commandfor="…" command="--canon-clear">…</button>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-text-input` | yes | The box. The frame, the focus ring and the states belong to it, not to the input. |
| `<input>` | yes | The main control: the box's direct child, no class. A text-like `type`. |
| `.canon-icon` | no | Leading and/or trailing, `aria-hidden="true"`. |
| `.canon-text-input-prefix` / `-suffix` | no | Text before / after the value ("https://", "kg"). `aria-hidden="true"`: the input's name carries the meaning ("Price in USD", not "Price" + "$"). Text only: a control goes in as a select box (next row). |
| `.canon-select` / `.canon-combobox` | no | A [Select](select.md) or one-value [Combobox](combobox.md) box as the **first or last child**: a country code before a phone number, a currency after an amount. One frame, with a line between them. The select needs its own name. |
| `.canon-button` | no | Trailing actions, last: clear, copy (below). |

- Order is icon, prefix, input, suffix, icon, buttons. Themes may reorder (Canon shows the prefix first and the suffix last, at the box's ends, the icons and buttons inside them; both are hidden from assistive technology, so nothing that is read moves).
- **Clicking anywhere in the box** (padding, icons, affix text) focuses the input; only buttons and a select box keep their own clicks.
- Affixes truncate before the input gets less than 4rem; they keep their own direction in right-to-left text.
- **A select box in the text input:**

```html
<div class="canon-text-input">
  <div class="canon-select">
    <select name="country-code" aria-label="Country code" autocomplete="tel-country-code">
      <button><selectedcontent></selectedcontent></button>
      <option value="+44"><span class="canon-option-label">+44</span> <span class="canon-option-description">United Kingdom</span></option>
      <option value="+90"><span class="canon-option-label">+90</span> <span class="canon-option-description">Türkiye</span></option>
    </select>
  </div>
  <input type="tel" aria-label="Phone number" placeholder autocomplete="tel-national">
</div>
```

  The select keeps its own list and keyboard; the text input draws the frame and shows focus for both. With `selectedcontent`, the box shows the code and the list also names the country. A [Combobox](combobox.md) with `data-search="list"` lets people search a long list. The select box is as wide as its widest option (canon.js measures it), so the value doesn't move when the choice changes.
- `type="search"` has no native clear button (it can't be themed): add the clear action. Escape still clears natively.
- **Expected length:** native `size` or `maxlength`; themes may size the box from them.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-size` | box or a container | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` (three-size themes: xs is sm, xl and 2xl are lg) | theme decides | yes |
| `data-intent` | box | `warning` · `success` | none | no |

- **`data-intent`**: the value is accepted but questionable (warning), or checked and fine (success). ARIA has neither, so the meaning must also be in words (in a Field, the message). **Error is not an intent:** it is `aria-invalid="true"` on the input, which assistive tech reads.

Everything else is native on the input: `placeholder`, `required`, `disabled`, `readonly`, `aria-invalid`, `autocomplete`, `inputmode`.

## States

| State | Hook | Notes |
|---|---|---|
| Hover | `:hover` on the box | |
| Focus | the input's `:focus` | Shown on the box. A focused trailing button shows its own ring instead. |
| Disabled | `disabled` | Wins over every other state. |
| Read-only | `readonly` | The value can be selected and copied. |
| Error | `aria-invalid="true"`, or `:user-invalid` | The browser's check only counts once the user has been there. In a field, a danger message says what is wrong. |
| Warning, success | `data-intent` on the box, or a field's message intent | In a field, the message sets it; no need to repeat it on the box. |
| Disabled with a status | `disabled` + any of the above | The status still shows, softened. |
| Empty | `:placeholder-shown` | Needs a `placeholder` attribute (bare is enough). Required inside a field. |
| Autofilled | `:autofill` | Themes override the browser's colors. |

## Box actions (T2, canon.js)

Trailing `canon-button`s with invoker commands, pointing at the input (`commandfor` + its `id`). Hidden without scripting.

| `command` | Does | Notes |
|---|---|---|
| `--canon-clear` | Empties the input, fires `input` and `change`, focuses it | Hidden while there is nothing to clear (`:placeholder-shown`) |
| `--canon-copy` | Copies the value, announces "Copied" | `data-state="copied"` for 2 seconds |

Details (polyfill, the translated "Copied" string): [field.md](field.md#box-actions-t2-canonjs).

## Accessibility

- The name: a `<label for>` (in a Field) or `aria-label`. Placeholders are not names.
- Affix text and icons are hidden; the name says what they would.
- Description and message (in a Field) are wired with `aria-describedby`.

## Theme obligations

- Show focus on the box, error, disabled and read-only distinctly, and not by color alone where the system allows (Canon: read-only is dashed).
- Keep the input owning the whole box (core does it: the input reaches past the box's edges and the box clips it).
- Style `:autofill`.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Label, description, messages | [Field](field.md) |
| Number steppers | Number (its own component) |
| Multi-line | [Textarea](textarea.md) |
| A status icon | The Field's message carries it (field.md), not the box |

## Look

**Sizes (sm / md / lg):** 32 / 40 / 48px tall (the button's); padding 8 / 10 / 12, text a further 4 / 6 / 8 in; prefix, value and suffix 2 / 4 / 6 apart; icons 16 / 20 / 24, 2 / 2 / 0 from the text; text 12 / 14 / 16; radius 4 / 8 / 12. md by default.

White box, zinc-200 border, a faint lift under it (0 1px 2px, black at 5%; dark 30%), gone while pressed and when disabled (the focus halo takes its place), zinc-900 text, zinc-400 placeholder, affixes and icons (dark: zinc-900, zinc-700, white, zinc-500). Hover zinc-400 (dark zinc-500). Focus blue-600 with a 3px blue-100 halo (dark blue-400, blue-900). Error red-400, red-600 on hover and focus with a red-100 halo (dark red-500, red-400, red-900). Disabled zinc-50 with zinc-400 text, zinc-300 affixes (dark zinc-800, zinc-500, zinc-600). Also: warning (amber) and success (green) on the error recipe; disabled with a status: its border softened (300s, dark 800s); read-only dashed; box buttons 24 / 28 / 32px, the icon's color, a zinc tint on hover. Prefix and suffix are segments at the box's ends (the prefix first and the suffix last, whatever the markup's order): its full height, reaching its edge, zinc-50 (dark zinc-800) behind zinc-500 text (dark zinc-400), a 1px line in the frame's resting color (zinc-200, dark zinc-700) on the inner side, their text the box's inset from each side and what follows the line as far from it as from the box's edge; disabled, zinc-100 with zinc-400 text (dark zinc-700, zinc-500). A select box in it: no frame of its own, a 1px line in the frame's resting color (zinc-200, dark zinc-700) between it and the value, its text and the value's each the box's inset from the frame or the line.
