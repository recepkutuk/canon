# Toolbar

Tier: **T0** (the arrow keys between controls are T2, canon.js)

A row of controls that act on one thing, such as a text editor's formatting: Buttons, Button Groups, Selects, menu buttons and vertical Separators. One stop for Tab; the arrow keys move inside.

## Elements

```html
<div class="canon-toolbar" role="toolbar" aria-label="Formatting" data-size="sm">
  <div class="canon-button-group" role="group" aria-label="History" data-display="icon">
    <button type="button" class="canon-button">…Undo…</button>
    <button type="button" class="canon-button">…Redo…</button>
  </div>
  <div class="canon-select">
    <span class="canon-icon" data-icon="text-cursor" aria-hidden="true"></span>
    <select aria-label="Text style">…</select>
  </div>
  <div class="canon-button-group" role="group" aria-label="Alignment" data-display="icon" data-select="one">
    <button type="button" class="canon-button" aria-pressed="true">…Align left…</button>
    …
  </div>
  <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" data-display="icon">…Link…</button>
  <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" popovertarget="insert-menu" aria-haspopup="menu" aria-expanded="false">…Insert…</button>
  <div class="canon-menu" id="insert-menu" popover role="menu" aria-label="Insert">…</div>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-toolbar` | yes | `role="toolbar"`, named by `aria-label` or `aria-labelledby` ("Formatting"). |
| Controls | yes | [Buttons](button.md) (on their own: low and neutral, `data-emphasis="low" data-intent="neutral"`; icon only with `data-display="icon"`, toggles with `aria-pressed`), [Button Groups](button-group.md), [Selects](select.md), menu buttons ([Menu](menu.md)), vertical [Separators](separator.md). Menus and popovers they open can sit inside; they aren't part of the row. |

- **Order** is the DOM's: the arrow keys follow it, and so does wrapping.
- **Grouping:** related buttons go in a Button Group (named, joined); controls stand 8px apart otherwise. A vertical Separator marks a stronger break.
- A toolbar is for controls that act on something (the text, a selection). Navigation is a nav list or Menubar.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `aria-orientation` | the toolbar | `vertical`: a column; Up and Down move | horizontal | — |
| `data-size` | the toolbar or a container | `sm` · `md` · `lg` | theme decides | yes |
| `data-display` | a group, a button or a container | `icon` | theme decides | yes |

## Behavior

**T0:** a wrapping row of controls, each its own Tab stop.

**canon.js (T2), the toolbar pattern:**

- **One Tab stop:** the control last used (the first, to start). Tab leaves the toolbar; coming back lands on the same control.
- **Left and Right** (Up and Down when vertical; mirrored in right-to-left) move to the previous or next control, through groups too, wrapping at the ends; **Home** and **End** go to the ends.
- In a text field inside the toolbar, the arrows stay the field's. A Select keeps Up and Down; a menu button opens its menu with Down.
- A [Select](select.md) in a toolbar keeps the width of its longest choice (Select's own behavior), so the controls after it don't move.
- Disabled and hidden controls are skipped; controls added or removed later are followed.

## Core

- A wrapping flex row (a column when vertical), its controls their own size.

## Accessibility

- `role="toolbar"` with a name: screen readers announce it and its controls; one Tab stop keeps the page's tab order short.
- Every control keeps its own name (icon-only buttons through their label), and toggles their pressed state.

## Theme obligations

- Controls visibly grouped (groups joined, standalone controls apart); a single low neutral button looks like the toolbar's grouped buttons.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| An overflow menu for controls that don't fit | If it comes up (today the toolbar wraps) |
| Typing a letter to jump to a control | If it comes up |

## Look

**Sizes (sm / md / lg):** Controls the given size (a text editor's: sm, 32px); 8px apart and 8px between rows.

Selects as they are; Button Groups as they are (one zinc-200 frame, dark zinc-600, a 1px line between buttons; pressed zinc-100, pressed in, with the icon in the label's color); a single button a low neutral Button, held while its menu is open. The Select's arrow is Select's chevron; Insert is a menu button with Button's menu chevron.
