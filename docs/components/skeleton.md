# Skeleton

Tier: **T0**

Shapes that stand in for content while it loads, in its layout, so the page doesn't jump when it arrives.

## Elements

```html
<div aria-busy="true" aria-label="Profile, loading">
  <span class="canon-skeleton" data-shape="circle" aria-hidden="true"></span>
  <span class="canon-skeleton" aria-hidden="true" style="inline-size: 60%"></span>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-skeleton` | yes | Always `aria-hidden="true"`. Inside the region that is loading, which says so (`aria-busy="true"`, a name). |

- **Shaped like what comes:** a line per line of text, a circle for an avatar, a block for a control or a tag, a square for a checkbox. Vary the lines' lengths (`inline-size`) so they read as text.
- **Not for short waits** (under about half a second) or for an action's progress: that is a Button's loading state or a Spinner.
- A [Data Table](data-table.md) draws its own skeleton rows while it is `aria-busy`.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-shape` | the skeleton | `block` · `circle` · `square` | a line of text | no |
| `data-size` | the skeleton or a container | `sm` · `md` · `lg` | theme decides | yes |
| `data-motion` | the skeleton or a container | `sweep` | still | yes |

## Core

- A block, at most as wide as its container. The theme gives each shape its size.

## Accessibility

- Skeletons are decoration: hidden from screen readers. The loading region's `aria-busy="true"` (and its name) tells them the content is on its way; when it arrives, `aria-busy` goes, and canon.js marks the region `data-loaded` while the theme shows the content in.

## Theme obligations

- Reads as "loading", not as content; any motion stops with reduced motion.
- Shown only after a short wait, its room kept meanwhile, so a quick load never flashes it.

## Look

**Sizes (sm / md / lg):** A line 8px tall, as long as its container; a block the control's height × 0.625 (20 / 25 / 30) and 4rem wide at Button's corners; a circle the control's height × 0.8 (26 / 32 / 38); a square the icon's size (16 / 20 / 24), 4px corners.

Flat rounded zinc-100 shapes (dark zinc-800). `data-motion="sweep"` adds a lighter sweep (zinc-200, dark zinc-700) passing every 1.5s; still with reduced motion.

**Motion:** a skeleton shows 0.3s after it comes, fading in (0.15s). Loaded, what came fades in (0.2s) where the skeletons were (a Data Table's rows only); a fade, so also with reduced motion.
