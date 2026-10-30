# Textarea

Tier: **T0**

Text over several lines: a native `<textarea>` in a box that looks like a [Text Input](text-input.md). It can stay at a fixed height, grow as people type, and let them resize it. On its own it is named with `aria-label`; with a [Label](label.md) it is a [Field](field.md).

## Elements

```html
<div class="canon-textarea">
  <textarea id="note" name="note" rows="2" data-max-lines="5" data-resize="vertical" placeholder></textarea>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-textarea` | yes | The box: Text Input's frame, sizes and states. The frame, the focus ring and the states belong to it, not to the textarea. |
| `<textarea>` | yes | The only child, no class. |

No icons, affixes or buttons: they belong to a one-line box.

**Rich text:** `data-rich` on the box makes it an editor for formatted text (a toolbar, HTML as the value). See [Rich Text](rich-text.md).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `rows` (native) | textarea | a number | 2 | — |
| `data-max-lines` | textarea | a number, or `none` | absent: fixed at `rows` | no |
| `data-resize` | textarea | `vertical` · `none` | theme decides | no |
| `data-size` | box or a container | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` (three-size themes: xs is sm, xl and 2xl are lg) | theme decides | yes |
| `data-intent` | box | `warning` · `success` | none | no |

| Need | Contract |
|---|---|
| Starting / minimum height | native `rows` |
| Grow up to N lines, then scroll | `data-max-lines="N"`; `"none"` grows without limit. Absent: fixed at `rows`, scrolls (native) |
| Manual resize | `data-resize="vertical"` or `"none"`. Absent: theme decides. Horizontal resizing is not offered |

- Growth uses native `field-sizing: content`; heights are `rows × 1lh` and `data-max-lines × 1lh`, read with typed `attr()`. Browsers without typed `attr()` get the common values (rows 1–6; max lines 3, 4, 5, 6, 8, 10, 12); browsers without `field-sizing` keep the height of `rows` and scroll.
- If someone drags the resize handle, their height wins and growing stops for that textarea (native behavior).

Native attributes to use instead of new ones:

| Need | Native |
|---|---|
| Character limit | `maxlength` (in a Field, add a counter, which also makes the limit soft: [field.md](field.md#counter-t2-canonjs)) |
| No line wrapping | `wrap="off"` |
| No spellcheck | `spellcheck="false"` |
| Enter key label on mobile | `enterkeyhint` |
| Auto-capitalization | `autocapitalize` |

Everything else is native too: `placeholder`, `required`, `disabled`, `readonly`, `aria-invalid`, `autocomplete`.

## States

Text Input's: hover, focus (on the box), disabled, read-only, error (`aria-invalid="true"` or `:user-invalid`), warning and success (`data-intent` on the box, or a field's message), disabled with a status, empty (`:placeholder-shown`, needs a `placeholder` attribute; required inside a field).

## Core

- The textarea owns the box: it reaches 20rem past the start (the box clips it) and takes over the box's padding exactly on the other three sides, so its scrollbar and resize handle sit at the box's inner edge. Themes set `--canon-textarea-inset-block` and `--canon-textarea-inset-end` to their padding.
- The textarea measures its content box, so `rows × 1lh` is exact.
- No resize handle unless `data-resize="vertical"`; never horizontal.
- Never less than one line tall (`min-block-size: 1lh`), so the handle can't drag the text out of sight; `rows` with `data-max-lines` raises that minimum.

## Accessibility

- The name: a `<label for>` (in a Field) or `aria-label`. Placeholders are not names.
- Description and message (in a Field) are wired with `aria-describedby`.
- A limit set with `maxlength` stops typing silently: say it in the description ("Up to 280 characters").

## Theme obligations

- Look like the theme's Text Input, with the same states.
- Show where the text is when it scrolls (the native scrollbar is enough).

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Animated growth | A canon.js enhancer (CSS can't animate a size the content decides) |
| Code input (monospace, tabs) | `data-content="code"` |

## Look

**Sizes (sm / md / lg):** Text Input's: text 12 / 14 / 16 on 16 / 20 / 24px lines, radius 4 / 8 / 12, text 12 / 16 / 20px from the sides. The first line sits where a text input's does (8 / 10 / 12px from the top), so one row is 32 / 40 / 48px tall, a text input's height. md by default. No resize handle unless asked.

Text Input's colors and states.
