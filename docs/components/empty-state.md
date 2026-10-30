# Empty State

Tier: **T0**

What a view shows when it has no content: nothing yet, nothing matching a search or filters, or an error, and what to do next.

## Elements

```html
<div class="canon-empty-state">
  <span class="canon-empty-state-icon" aria-hidden="true"><span class="canon-icon" data-icon="table" aria-hidden="true"></span></span>
  <h3 class="canon-empty-state-title">No users yet</h3>
  <p class="canon-empty-state-description">People you invite will show up here.</p>
  <div class="canon-empty-state-actions">
    <button type="button" class="canon-button" data-emphasis="high">…Invite people…</button>
  </div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-empty-state` | yes | Where the content would be: a page's body, a panel, a [Data Table](data-table.md)'s message row. |
| `.canon-empty-state-icon` | no | `aria-hidden="true"`, holding one `canon-icon`: decoration; the title says it. |
| `.canon-empty-state-title` | yes | A heading at the page's level when it stands for a section's content, else a `<p>`. |
| `.canon-empty-state-description` | no | A sentence: why it's empty, what will appear, what to try. |
| `.canon-empty-state-actions` | no | [Buttons](button.md) or links: the way forward (create, clear filters, try again). One main action at most. |

- **Nothing yet:** say what will appear and how to start ("No users yet" · "People you invite will show up here." · Invite people).
- **No results:** say nothing matches and offer the way back ("No matching users" · "Try other words, or clear the filters to see everyone." · Clear filters).
- **Error:** `data-intent="danger"`; say what happened in plain words and offer to retry ("Couldn't load users" · "Something went wrong on our side. Try again in a moment." · Try again).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-intent` | the empty state | `danger`: an error | — | no |
| `data-size` | the empty state or a container | `sm` · `md` · `lg` | theme decides | yes |

## Core

- A centered column; title and description without margins; actions a centered, wrapping row.

## Accessibility

- The title is real text (a heading where the page needs one); the icon is hidden from screen readers.
- When it replaces content after an action (a search with no results), the app announces it or moves focus as it would for any new content.

## Theme obligations

- The title stands out; the description reads as secondary; an error is recognizable as one beyond its color (its icon, its words).

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Illustrations instead of an icon | The author's image in place of the icon, if it comes up |
| Full-page states (403, 404, 500, maintenance) | Status Pages |

## Look

**Sizes (sm / md / lg):** The icon in a hexagon 5 / 6 / 7rem, icons 2 / 2.5 / 3rem; Text Input's type (12 / 14 / 16px); the actions a field step (12 / 16 / 20) under the text.

The icon in a soft hexagon (zinc-100 fading to the surface; dark zinc-800), icon zinc-400 (dark zinc-500); the title medium zinc-900 (dark white), the description zinc-500 (dark zinc-400). The hexagon's sizes; an error tints the hexagon red-50 and the icon red-500 (dark red-400); the description at most 32rem wide.
