# Breadcrumb

Tier: **T0** (the collapsed pages' menu is [Menu](menu.md)'s: T1, its keyboard T2)

The trail of pages above the current one, each a link back up.

## Elements

```html
<nav class="canon-breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="/"><span class="canon-icon" data-icon="house" aria-hidden="true"></span><span class="canon-visually-hidden">Home</span></a></li>
    <li>
      <button type="button" class="canon-breadcrumb-more" popovertarget="trail-more" aria-haspopup="menu" aria-expanded="false">
        <span class="canon-icon" data-icon="more" aria-hidden="true"></span>
        <span class="canon-visually-hidden">More pages</span>
      </button>
      <div class="canon-menu" id="trail-more" popover role="menu" aria-label="More pages">
        <a class="canon-menu-item" role="menuitem" href="/docs"><span class="canon-menu-label">Docs</span></a>
      </div>
    </li>
    <li><a href="/docs/components">Components</a></li>
    <li><a href="/docs/components/breadcrumb" aria-current="page">Breadcrumb</a></li>
  </ol>
</nav>
```

| Element | Required | Notes |
|---|---|---|
| `nav.canon-breadcrumb` | yes | Named "Breadcrumb" (`aria-label`, in the page's language): a navigation landmark. |
| `<ol>` | yes | Its only child: the pages in order, top first. |
| `<li>` | yes | One per page: a link (`<a href>`), or the "more" button with its menu. |
| `aria-current="page"` | — | On the last item, the current page (a link to itself, or a `<span>`). A trail may also end at the parent page and leave the current one out. |
| An icon link | no | A `canon-icon` (`house` for home) with its name in a `canon-visually-hidden` span. |
| `.canon-breadcrumb-more` | no | A `<button type="button">` standing for the pages left out: `popovertarget` a [Menu](menu.md) of them (links, `<a class="canon-menu-item" role="menuitem">`), `aria-haspopup="menu"`, its name in a visually hidden span ("More pages"). |

- **Drawn by the theme, never written:** the separators between items (they point the reading direction, so they mirror in right-to-left).
- **Collapsing** is the author's (or the app's): which pages to leave out is a choice about the page, not the space. A long trail otherwise wraps onto more lines. The exception is a [Page Header](page-header.md#behavior-t2-canonjs) whose trail doesn't fit its row: there canon.js keeps the last page after a generated "more" button listing the rest (the author's own "more" menu's pages among them), until there is room again.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `aria-current` | the current page | `page` | — | — |
| `data-size` | the breadcrumb or a container | `sm` · `md` · `lg` | theme decides | yes |

## Core

- The `<nav>`: a flex row; the `<ol>`: a wrapping flex row, no list markers or indent; items: inline flex rows, the separator a `::before` on each item but the first. Links: inherited color, no underline. The "more" button: a button reset.

## Accessibility

- A `<nav>` named "Breadcrumb", an ordered list, `aria-current="page"` on the current page: screen readers hear the landmark, how many pages, and which is this one.
- Separators are drawn, not text, so they aren't read.
- An icon link and the "more" button keep a name in visually hidden text; the menu of left-out pages is a Menu (keys, focus, closing).

## Theme obligations

- Links distinguishable from the current page, and a visible focus ring.
- Separators pointing the reading direction.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Collapsing automatically when the trail doesn't fit, outside a Page Header | canon.js, if it comes up (as in a Page Header) |
| A dropdown on each item (siblings of that page) | If it comes up |

## Look

**Sizes (sm / md / lg):** A row the button's height (32 / 40 / 48), no padding at the sides (the trail starts where the page's text does); text 12 / 14 / 16px on 16 / 20 / 24px lines; icons and separators 16 / 20 / 24px, 6 / 8 / 8px from the words.

Links and the "more" button zinc-500 (dark zinc-400); the current page, the separators (Lucide chevron-right) and a home icon (house) quieter, zinc-400 (dark zinc-500). Hover zinc-900 (dark white), focus the button's ring (2px, then 1px blue-600; dark blue-400).
