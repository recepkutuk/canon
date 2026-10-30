# Rich Text

Tier: **T2** (without canon.js the textarea shows the HTML as text)

A [Textarea](textarea.md) for formatted text: headings, emphasis, links, lists. `data-rich` on the box; canon.js draws a [Toolbar](toolbar.md) and an area to write in. The `<textarea>` keeps the value, clean HTML, which is what the form sends.

## Elements

```html
<div class="canon-field">
  <div class="canon-label">
    <label class="canon-label-text" for="notes">Release notes</label>
    <p class="canon-label-description" id="notes-description">Shown to everyone on the changelog.</p>
  </div>
  <div class="canon-textarea" data-rich data-tools="history block marks link lists">
    <textarea id="notes" name="notes" rows="6" placeholder="Write something…"
              aria-describedby="notes-description">&lt;p&gt;Hello&lt;/p&gt;</textarea>
  </div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-textarea[data-rich]` | yes | A Textarea box. |
| `<textarea>` | yes | The value: HTML (escaped in the markup, as any textarea text). Its label, description, `placeholder`, `rows`, `data-max-lines`, `required`, `disabled` and `readonly` are the editor's. |

### What canon.js adds

Themes style these; authors don't write them.

```html
<div class="canon-textarea" data-rich>
  <div class="canon-toolbar canon-rich-toolbar" role="toolbar" aria-label="Formatting" data-size="sm">…</div>
  <textarea …></textarea>                                    <!-- hidden: the value -->
  <div class="canon-rich-area" role="textbox" aria-multiline="true" contenteditable="true"
       aria-labelledby="…" aria-describedby="…">…</div>      <!-- data-empty while empty -->
</div>
```

- The toolbar is made of Canon components: [Button Groups](button-group.md) (toggles with `aria-pressed`, the alignment `data-select="one"`), a [Select](select.md) for the block style, single [Buttons](button.md), [Popovers](popover.md) (link, text color, image) and a [Menu](menu.md) (Insert). It is small (`sm`; `md` in a large box).
- The textarea stays in the box, hidden (`aria-hidden`, out of the tab order): still the form value, the label's target and what the browser checks. Its focus (the label, a failed check) goes to the area.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-rich` | `.canon-textarea` | (present) | — | no |
| `data-tools` | `.canon-textarea` | groups, space-separated, or `all` (below) | `history block marks link lists` | no |
| `rows`, `data-max-lines` | textarea | as [Textarea](textarea.md): the height, growing up to N lines (`none`: no limit) | 2, fixed | — |
| `data-size` | the box or a container | `sm` · `md` · `lg` | theme decides | yes |

**Tools**, shown in this order whatever order they are written in:

| Group | Controls |
|---|---|
| `history` | Undo, Redo |
| `block` | Paragraph, Heading 1, 2, 3 (written `h2`, `h3`, `h4`: content sits under the page's own `h1`), Quote, Code |
| `align` | Align left, Center, Align right, Justify (one at a time; written as logical `start` / `end`) |
| `marks` | Bold, Italic, Underline, Strikethrough |
| `link` | Link: a popover with the address, "Open in a new tab", Apply and Remove link |
| `color` | Text color: a popover of Swatches (red, orange, yellow, green, blue, purple, gray) and Default color |
| `clear` | Clear formatting |
| `script` | Subscript, Superscript |
| `lists` | Numbered list, Bulleted list |
| `indent` | Decrease, Increase indent (in lists) |
| `insert` | A Menu: Horizontal line, Image… (a popover: address and description) |

## The value

Only this HTML is kept. Whatever is typed, pasted or set is cleaned to it, both when it is shown and when it is written back:

| Kind | Kept |
|---|---|
| Blocks | `p`, `h2`, `h3`, `h4` (`h1` becomes `h2`, `h5` and `h6` `h4`), `blockquote`, `pre` (its text only), `ul`, `ol`, `li`, `hr`, `img` (`src`, `alt`) |
| Inline | `strong` (from `b`), `em` (from `i`), `u`, `s` (from `strike`, `del`), `sub`, `sup`, `br`, `a` (`href`; `target="_blank"` with `rel="noopener"`), `span` with a palette color (`style="color: #2563eb"`) |
| Alignment | `style="text-align: center \| end \| justify"` on blocks (left and right are turned into start and end for the text's direction; start, the default, isn't written) |

- Links and images take `http:`, `https:`, relative addresses, `mailto:` and `tel:` (links only); anything else (`javascript:`, `data:`) is dropped.
- Dropped with their content: scripts, styles, embeds, forms. Unwrapped (their text kept): every other element, classes, ids, event attributes and other styles. A `div` of text becomes a paragraph; loose words between blocks go into paragraphs.
- **Empty is empty:** an editor with no text (and no image or line) has the value `""`, so `required` works.
- The value is written on each change (`input` on the textarea), and `change` when the editor loses focus. An app that sets the textarea's value and fires `input` sees the editor follow; form resets are followed.

## Behavior (canon.js)

- **The toolbar follows the selection:** toggles show what is applied (Bold pressed in bold text), the block style shows the paragraph's (Heading 2), the alignment its side; Indent and Outdent are available in lists only.
- **Buttons keep the selection:** pressing one doesn't take focus from the text (from the keyboard, focus stays on the button).
- **Keys:** the toolbar is one Tab stop (Toolbar's arrows); in the text the browser's own ⌘B / Ctrl+B, ⌘I, ⌘U, ⌘Z work, and ⌘K / Ctrl+K opens the link popover.
- **Paste** is cleaned (HTML), or inserted as text.
- **Popovers:** the link popover opens on the selection's link if there is one (with Remove link); without a selection, the address becomes the link's text. Color and image popovers close once applied; focus goes back to the text.
- **States:** `disabled` and `readonly` on the textarea make the area uneditable (`aria-disabled`, `aria-readonly`) and the toolbar unavailable; `required`, `aria-invalid` and `aria-describedby` are copied to the area. A failed check shows in the field's message (Field's validation), the box turns red, and focus goes into the text.
- Without canon.js the textarea is an ordinary one showing the HTML as text.

## States

The Textarea box's: focus in the text rings the whole editor; error, disabled, read-only and the intents as on any box.

## Accessibility

- The area is a multi-line textbox named by the field's label, described by its description and messages, with `aria-required` / `aria-invalid` from the textarea.
- The toolbar is a named toolbar, its buttons named, toggles pressed or not, shortcuts in `aria-keyshortcuts`.
- Headings in the content start at `h2`, under the page's `h1`.
- An image's description is asked for in its popover (its `alt`).

## Theme obligations

- The toolbar visibly part of the editor; the text styled readably (headings, lists, quotes, code, links).
- The placeholder shown while the editor is empty.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Tables, mentions, emoji, file uploads | If they come up (Insert's menu is where they'd go) |
| Markdown shortcuts while typing (`# `, `- `) | If it comes up |
| A character counter | Counter counts the value's HTML today; a text count if it comes up |
| Collaborative editing, comments | Out of scope |

## Look

**Sizes (sm / md / lg):** The toolbar sm (md in a lg box), 8px inside the box; the text where a textarea's sits.

The Toolbar inside the Textarea's box, a hairline rule under it; focus in the text rings the whole box. The text: paragraphs 0.75em apart, headings semibold (1.375 / 1.2 / 1em), lists 1.5em in, quotes after a 2px zinc-300 line (dark zinc-600) in zinc-600 (dark zinc-400), code blocks on zinc-100 (dark zinc-800) in JetBrains Mono, code in the text a chip (zinc-100 behind zinc-700, dark zinc-700 behind zinc-100; 4px either side, 2px corners; 0.8em and larger corners in a heading; Link's blue on blue-50, dark blue-950, in a link), links blue-600 (dark blue-400) underlined, lines hairline rules (black at 10%, dark white at 10%); the placeholder Textarea's.
