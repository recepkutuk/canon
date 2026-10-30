# Split Pane

Tier: **T0** (two panes at a set size) · resizing is **T2** (canon.js)

Two panes side by side (a list and its record), or one over the other (a query and its results), and a handle that shares the room between them.

## Elements

```html
<div class="canon-split-pane">
  <div id="invoices">…the list…</div>
  <div class="canon-split-pane-handle" role="separator" tabindex="0"
       aria-label="Resize the list" aria-controls="invoices" aria-orientation="vertical"
       aria-valuenow="35" aria-valuemin="20" aria-valuemax="60"></div>
  <section>…the record…</section>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-split-pane` | yes | Exactly three children: a pane, the handle, a pane. As tall as its place gives it (the window under a Top Bar, a frame). |
| The first pane | yes | Any element, with an `id` the handle points at. Its size is the handle's value. |
| `.canon-split-pane-handle` | yes | An empty `<div>`: `role="separator"`, `tabindex="0"`, named by what it resizes ("Resize the list"), `aria-controls` the first pane. |
| The second pane | yes | Any element; it takes the rest. |

- **Side by side or stacked:** the handle's `aria-orientation` says how it lies. `vertical` (a line between two columns): side by side. `horizontal` (a line between two rows): stacked.
- **The size** is the first pane's share, in percent: `aria-valuenow`, between `aria-valuemin` and `aria-valuemax`. Set limits that keep both panes usable.
- **Nesting:** a pane can be a Split Pane itself (a list beside a record with its activity under it).
- **Not a [Sidebar](sidebar.md):** the app's navigation collapses to a rail; a Split Pane shares one page between two parts of it.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `aria-orientation` | the handle | `vertical` (side by side) · `horizontal` (stacked) | — (required) | — |
| `aria-valuenow` | the handle | the first pane's share, 0–100 | 50 | — |
| `aria-valuemin`, `aria-valuemax` | the handle | its limits, 0–100 | 0, 100 | — |
| `--canon-split-size` | the box (canon.js) | the first pane's share, a percentage | from `aria-valuenow` | — |
| `data-state` | the box (canon.js) | `resizing` while dragging | — | — |

## Core

- A grid: the first pane `--canon-split-size` of the box, the handle, the second pane the rest. Without canon.js, half each.
- Each pane scrolls on its own; neither grows past the box.
- While dragging, nothing in the panes is selected or catches the pointer.

## Behavior (T2, canon.js)

- **Dragging** the handle (mouse, touch, pen) resizes the first pane within its limits; in right-to-left the first pane is on the right.
- **Keyboard** on the handle: the arrows along its direction (Left and Right side by side, mirrored in right-to-left; Up and Down stacked) by 2%, with Shift by 10%; Home and End to the limits; Enter folds the first pane to its minimum, and again brings it back.
- **Double click** the handle: back to the size it started with.
- canon.js keeps `aria-valuenow` and `aria-valuetext` (the share as a percentage, in the page's language) and writes `--canon-split-size`.
- **`canon-resize`** fires on the box when a resize ends (`detail.size`): the app remembers it (and writes it back as `aria-valuenow` next time).

## Accessibility

- The handle is a focusable separator, heard with its name and value: "Resize the list, separator, 35%".
- Everything dragging does, the keyboard does too.
- The panes are in reading order; each pane's own landmarks and headings say what it is.

## Theme obligations

- The handle visible as a line between the panes with a grip on it, so it reads as something to drag; easy to grab (wider than it looks), and clearly marked on hover, focus and while dragging.
- In forced colors, the line and its focus still show.
- Use logical properties: in right-to-left the first pane is on the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| One pane at a time on narrow screens | The Master–Detail pattern |
| Limits in rem or px | If it comes up (a pane's own `min-inline-size` works meanwhile) |
| More than two panes in one box | Nest them |

## Look

**Sizes:** A 1px line, 8px to grab; a 4 × 24px grip on its middle (across it when stacked), 32px long while active.

The line zinc-200 (dark zinc-800), the grip zinc-300 (dark zinc-600); hover (after a short pause), focus and dragging color the line and the grip blue-500 (dark blue-400), the grip 32px long. Forced colors: the line and grip in the text's color, focus in Highlight.
