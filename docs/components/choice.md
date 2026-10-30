# Choice anatomy

Not a component: the markup that **Checkbox** (`checkbox.md`), **Radio** (`radio.md`) and **Switch** (`switch.md`) share, the way text input, textarea and select share Field's box. Each has its own spec, reference page and playground. They are grouped with **Fieldset** (`fieldset.md`).

[Toggle Chip](toggle-chip.md) and [Segmented Control](segmented-control.md) are also checkboxes and radios, but look like buttons, so they don't use this anatomy.

## Anatomy

```
canon-choice                      grid; every slot is a direct child
├── <input>                       checkbox or radio, no class, first child, has an id
├── canon-choice-label            <label for>, required
├── canon-choice-hint             optional · helper text
├── canon-choice-state            optional, switch only · words for off and on (switch.md)
└── canon-choice-message          optional · data-intent="danger | warning | success"
```

```html
<div class="canon-choice">
  <input type="checkbox" id="updates" name="updates" aria-describedby="updates-hint">
  <label class="canon-choice-label" for="updates">Email me product updates</label>
  <p class="canon-choice-hint" id="updates-hint">About once a month.</p>
</div>
```

- `canon-choice` is a grid (core default: input, label beside it, hint and message under the label). Themes move slots with `grid-template-areas` (a toggle's label above it, say).
- **The input is first, the label follows.** The label never wraps the input.
- **The input draws itself.** Themes set `appearance: none` on the input and draw the box, ring or track on it; the check, dash, dot and thumb come from its state (`:checked`, `:indeterminate`) on its `::before` / `::after`. No extra markup.
- Core centers the input and the label's first line on each other, whichever is taller (themes size the input with `--canon-choice-control-size` and put the label's typography on `canon-choice`, so `1lh` matches).
- The item's own hint and message are wired with `aria-describedby` on its input.

## States

| State | Hook |
|---|---|
| Checked | `:checked` |
| Focus | `:focus-visible` on the input |
| Disabled | `disabled` on the input, or on its fieldset |
| Required | native `required` |
| Invalid (server) | `aria-invalid="true"` + danger `canon-choice-message` |
| Invalid (browser) | `:user-invalid` |

## Size

`data-size` reaches choices (on the choice or any ancestor). Themes map it where their system has sizes and ignore it otherwise. Each component's spec lists its mapping.

## Theme obligations (all three)

- Draw every state from the input itself (`appearance: none`; `::before` / `::after` for indicators). Never require markup.
- Never hide the label with `display: none`.
- Hide an empty message (`:empty`).
- Use logical properties, so RTL mirrors the layout.

## Pending verification

- Pseudo-elements on `appearance: none` checkboxes and radios render in Chromium. To check in Safari and Firefox: open `reference/checkbox.html`, `radio.html` and `switch.html`.
