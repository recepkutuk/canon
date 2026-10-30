# Label

Tier: **T0** (the info tooltip is T0 where interest invokers exist, polyfilled by canon.js)

What a control is called, with everything that goes with the name: a required marker, "(optional)", an info button with a tooltip, and a description. The first part split out of Field; Field, Slider and Range Slider use it, and Fieldset and checkbox groups can later.

## Elements

```html
<div class="canon-label">
  <label class="canon-label-text" for="phone">Phone <span class="canon-label-optional">(optional)</span></label>
  <button type="button" class="canon-label-info" interestfor="phone-info" aria-describedby="phone-info">
    <span class="canon-visually-hidden">About phone</span>
  </button>
  <div class="canon-tooltip" id="phone-info" popover="hint" role="tooltip" data-placement="block-end inline-end">We only call about deliveries.</div>
  <p class="canon-label-description" id="phone-description">Include the country code.</p>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-label` | yes | The block. In a field, its first child (the field's label area). |
| `.canon-label-text` | yes | The name. `<label for>` when it names a control; an element with an `id` when it names a group (`role="group"` + `aria-labelledby`, as Range Slider does). One per block. |
| `.canon-label-optional` | no | Inside the label text, so it is read with the name ("Phone (optional)"). **Author text**, in the page's language. |
| `.canon-label-info` | no | `<button type="button">` with `interestfor` and `aria-describedby` pointing at a [Tooltip](tooltip.md) (it says more than the button's name), and a name (visually hidden text or `aria-label`) that says what it is about. The theme draws the icon. A sibling of the label text: buttons can't go inside a `<label>`. |
| `.canon-tooltip` | with info | The info button's tooltip, right after it. `data-placement` is the author's (`block-end inline-end` is a good fit). Text only: anything interactive belongs in a Popover. |
| `.canon-label-description` | no | Helper text, with an `id`. The control (or the group) lists it in `aria-describedby`. |

- **Required** is the control's native `required`; the theme draws the marker (it is not read: the control already says it). Themes find it beside the label: a required sibling, or one inside a sibling (a field's box). A control is required or optional, never both.
- **Size** follows `data-size` like the field it labels (inherited from the field or a container).
- Without the info button and description it is just `<div class="canon-label"><label class="canon-label-text" for="x">Name</label></div>`.

## Accessibility

- The label text is the control's name. "(optional)" is part of it; the required marker is not.
- The description is read after the name, through `aria-describedby`.
- The info button is reachable by keyboard; its tooltip shows on hover and focus, and `aria-describedby` reads it as the button's description. Don't put information there that people need to fill the field: that belongs in the description.

## Core

- A wrapping row: the label text takes the room left, the info button sits at the end of the first line, the description gets a line of its own.
- Long labels wrap; the info button stays on the first line.
- "(optional)" floats to the end of the label's last line.
- The info button: user-agent styles reset, the size of an icon (`--canon-icon-size`).

## Theme obligations

- Draw the required marker when the label's parent holds a required control (`:has(> .canon-label):has(> :required, > * > :required)`), and hide it from assistive tech (`content: "*" / ""`).
- Draw the info icon, with hover and focus states; the focus ring like buttons'.
- Themes that put the description elsewhere (under the box, say) use `.canon-label { display: contents }` and place the parts in the field's grid.

## Not in the contract

| Thing | Where it goes |
|---|---|
| Generated "(optional)" or "(required)" words | Not offered: words are the author's |
| Rich content in the tooltip (links, buttons) | Popover |
| Character counter | Field (`canon-field-counter`, reserved) |
| Label action ("Forgot password?") | Field (`canon-field-action`) |

## Look

**Sizes (sm / md / lg):** Label 12 / 14 / 16px medium on 16 / 20 / 24px lines; description 10 / 12 / 14px on 12 / 16 / 20px, 4 / 6 / 8px below; info icon 16 / 20 / 24px. md by default, like the controls.

Label zinc-900 (dark white); red-700 `*` (dark red-300), semibold, 4px after the label; "(optional)" zinc-500, regular; info Lucide `info`, zinc-400 (dark zinc-500), darker on hover and focus; description zinc-500 (dark zinc-400). The tooltip stays sm at every size and, end-aligned, reaches past the icon so its arrow sits under the icon (15px in from the edge).
