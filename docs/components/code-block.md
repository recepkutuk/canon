# Code Block

Tier: **T0** · copying, wrapping and the scrolling region are **T2** (canon.js)

Code people read or copy: an API request, a webhook's payload, a config file, a log excerpt, an embed snippet. A `<pre><code>` in a frame, with an optional title and a copy button. Not an editor: code people change is a [Textarea](textarea.md).

## Elements

```html
<div class="canon-code-block">
  <div class="canon-code-block-header">
    <span class="canon-code-block-title">invoice.paid.json</span>
    <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" data-size="sm"
            commandfor="payload" command="--canon-copy">
      <span class="canon-icon" data-icon="copy" aria-hidden="true"></span>
      <span class="canon-button-label">Copy invoice.paid.json</span>
    </button>
  </div>
  <pre><code id="payload"><span class="tok punctuation">{</span>
  <span class="tok string">"id"</span><span class="tok punctuation">:</span> …</code></pre>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-code-block` | yes | The frame. Its children: an optional header, the `<pre>`, or a corner button. |
| `.canon-code-block-header` | no | First. A `.canon-code-block-title`, then [Buttons](button.md): the wrap toggle, then copy (others, such as download, between them). |
| `.canon-code-block-title` | with a header | What the code is: a file name ("deploy.yaml") or a description ("Request"). Names the code's scrolling region. |
| `<pre><code>` | yes | The code, as text or highlighted tokens (see Highlighting). The `<code>` gets an `id` for the copy button. |
| Corner button | no | Without a header: one copy button after the `<pre>`, icon only. |

- **Wrapping** is a Button with `command="--canon-wrap"` and `commandfor` naming the `<code>`, before the copy button, icon only and named "Wrap lines": a toggle whose `aria-pressed` is the state. Lines scroll while it's `false` and wrap while it's `true`; start it `true` where wrapped reads better (logs on a narrow screen). Only in a header: a short snippet without one doesn't need it.
- **Copying** is a Button with `command="--canon-copy"` and `commandfor` naming the `<code>`. It copies the code's text, without the highlighting. Name it for what it copies where a page has several ("Copy deploy.yaml", "Copy command").
- **Inline code** in a sentence is a plain `<code>`, not a Code Block.

## Highlighting

Canon doesn't highlight code. Do it before the page is sent (on the server, or at build time) and put the result in the `<code>`: token spans named as [twinkleplop](https://twinkleplop.pngwn.at/docs/themes-ref) names them, `<span class="tok keyword">`, `tok string`, `tok tag_name`, `tok attr_name` and so on. Themes color those names. Code without spans is plain text (logs, keys, output).

- Other highlighters' markup works too, but brings its own colors.
- Highlighting is never the only way something is told apart: it's a reading aid, and screen readers read the text.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-size` | the block or a container | `sm` · `md` · `lg`: the code's type and spacing | theme decides | yes |
| `--canon-code-block-max-height` | the block (a style) | a length | none | yes (CSS) |

## Core

- The code is always left to right, in a left-to-right box (`direction: ltr`, isolated), also on right-to-left pages; the header follows the page.
- Lines keep their breaks and indentation, and scroll sideways in their own box; while the header's wrap toggle is pressed (`aria-pressed="true"`) they wrap instead. With `--canon-code-block-max-height`, it scrolls down too.
- A long title is cut (…).
- The corner button sits in the top right corner (physical right, where code lines end), over the code.

## Behavior (T2, canon.js)

- **Scrolling:** when the code doesn't fit its box, the `<pre>` gets `data-scrolls` and becomes a region (`role="region"`, `tabindex="0"`) named by the title, else "Code" (the `--canon-text-code` string), so keyboards can reach and scroll it. It stops being one when the code fits. Attributes the author wrote are left alone.
- **Wrapping:** `--canon-wrap` flips the toggle's `aria-pressed`; the block's CSS follows it. The scrolling region comes and goes with it.
- **Copying:** the button gets `data-state="copied"` for 2 seconds and screen readers hear "Copied" (see [Button](button.md#copy-t2-canonjs)).

## Accessibility

- Screen readers read the code as text; token spans are not announced.
- A scrolling block is a named region and a Tab stop; arrow keys scroll it.
- The copy button is named for what it copies.

## Theme obligations

- Code set apart from the page (a fill or a frame), in a monospace face, readable token colors on that fill in both schemes (4.5:1 for text).
- A scrolling block's focus is visible.
- The corner button never lets code show through it.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Line numbers, highlighted lines, diffs | A later version (they need the lines marked) |
| Tabs between languages or files | Tabs around several blocks |
| Highlighting in the browser | The app (Canon stays dependency-free) |
| Editing code | Textarea, or an editor |

## Look

**Sizes (sm / md / lg):** Code 12 / 13 / 14px at 1.6 line height, 12 / 16 / 20px inside; the header 40 / 40 / 48px.

Table's frame (its hairline edge and corners), a hairline rule under the header; the header white (dark zinc-900) with the title in Table's header type (zinc-500 medium, dark zinc-400); the code on zinc-50 (dark halfway from zinc-900 to zinc-800, Table's stripe), zinc-800 (dark zinc-200), in JetBrains Mono (no ligatures). Tokens in palette colors, 700 on light and 400 (sky 300) on dark: tags, selectors and functions blue; attributes and variables violet; strings emerald; numbers amber; properties and keys sky; keywords rose; punctuation and comments zinc-500 (comments italic). The wrap and copy buttons minimal and neutral (wrap pressed: Button's filled pressed look; its icon a wrapping line); the corner one on the code's fill. Focus: Button's ring around the block.
