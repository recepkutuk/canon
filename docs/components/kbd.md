# Kbd

Tier: **T0**

A keyboard key or shortcut, shown as a small key cap: in running text, in a tooltip, or as a button's or tag's accessory.

## Element

```html
<kbd class="canon-kbd">⌘K</kbd>
```

- Always `<kbd>`.
- Text only: the keys as the platform writes them. Which platform's keys to show (⌘ or Ctrl) is the author's call.
- One `canon-kbd` per shortcut (`⌘K`, `Ctrl Shift P`). A sequence is several, with words between: `<kbd class="canon-kbd">G</kbd> then <kbd class="canon-kbd">I</kbd>`.
- Symbols (⌘ ⇧ ⌥ ↵) are read differently by each screen reader. Where it matters, write the word (`Ctrl`, `Enter`) or an `<abbr title="Command">⌘</abbr>`.

## Where it goes

| Place | Markup | Accessibility |
|---|---|---|
| Running text | `Press <kbd class="canon-kbd">⌘K</kbd> to search` | Read as part of the sentence |
| Tooltip | After the text: `<div class="canon-tooltip" …>Bold <kbd class="canon-kbd">⌘B</kbd></div>` | Read with the tooltip |
| Button accessory | Last child, `aria-hidden="true"`; the button gets `aria-keyshortcuts` | Announced once, from `aria-keyshortcuts`, and only where the shortcut works |
| [Tag](tag.md) accessory | Last child | Read with the tag |

```html
<button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" aria-keyshortcuts="Meta+K">
  <span class="canon-icon" data-icon="search" aria-hidden="true"></span>
  <span class="canon-button-label">Search</span>
  <kbd class="canon-kbd" aria-hidden="true">⌘K</kbd>
</button>
```

## Attributes

| Attribute | Values | Default | Inherited from containers |
|---|---|---|---|
| `data-size` | `sm` · `md` · `lg` | theme decides | yes |

- In a button, the key follows the button's size (so it is md in a default button). A `data-size` on the key still wins.
- In a tag, it follows the tag's size the same way.

## Core

- Resets the browser's monospace font to the surrounding text.
- Never wraps inside: lines break between keys.
- Always left to right (`direction: ltr; unicode-bidi: isolate`): shortcuts are written that way in every language, and in right-to-left text `⌘K` would otherwise render as `K⌘`.
- As a button, tooltip or tag accessory, centered on the line.

## Theme obligations

- Readable on every surface it can sit on: the page, tooltips, and the buttons it accessorizes in all 16 emphasis × intent variants.
- Never change case or symbols in a way that changes the key (uppercase is fine; `Esc` and `ESC` are the same key).

## Not in the contract

| Thing | Where it goes |
|---|---|
| Platform detection (⌘ vs Ctrl) | App |
| Key press animation | Out of scope |
| Clickable keys | Button |

## Look

**Sizes (sm / md / lg):** 16 / 20 / 24px tall, 2 / 4 / 6 radius, text 10px semibold uppercase at every size; sm by default, the button's size inside a button

Derived from the surrounding text color (text 55%, chip 4.4%; dark 80% and 23%), so it reads on any surface; a hairline along its bottom in the text color at 25% (the key's edge). On the page: zinc-100 with zinc-500 text (dark: zinc-700, zinc-300) within a few RGB units. Solid high-emphasis buttons and tags use the dark recipe.
