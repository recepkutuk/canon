# Popover

Tier: **T1** (a native popover: it opens, anchors and dismisses without JavaScript) · focus handling is **T2** (canon.js)

A panel a button opens over the page, for a short task beside it: editing a link, picking a color, a few words of help. Non-modal: the page stays usable around it.

## Elements

```html
<button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" popovertarget="link-editor" aria-expanded="false">
  <span class="canon-icon" data-icon="link" aria-hidden="true"></span>
  <span class="canon-button-label">Link</span>
</button>

<div class="canon-popover" id="link-editor" popover role="dialog" aria-labelledby="link-editor-title">
  <h3 class="canon-popover-title" id="link-editor-title">Edit link</h3>
  <form class="canon-form">
    <div class="canon-field">… Link (type="url") …</div>
    <div class="canon-form-actions">
      <button type="submit" class="canon-button" data-emphasis="high">…Apply…</button>
      <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral" popovertarget="link-editor" popovertargetaction="hide">…Cancel…</button>
    </div>
  </form>
</div>
```

| Element | Required | Notes |
|---|---|---|
| Trigger | yes | A [Button](button.md) with `popovertarget` (the popover's id). |
| `.canon-popover` | yes | `popover` (auto), `role="dialog"`, an `id`, named by its title (`aria-labelledby`) or `aria-label`. Anywhere in the page (it is laid over everything); right after its button keeps the reading and tab order natural. |
| `.canon-popover-title` | no | A heading at the page's level. |
| Content | yes | Anything: a [form](form-layout.md) with its actions, [Swatches](swatches.md) or other choices, a few words and a link. |

- **A button inside** with `popovertargetaction="hide"` closes it (Cancel); a form's submit is the app's (it closes the popover when done).
- **Not a tooltip:** a tooltip names or explains a control on hover and can't hold controls; a popover is opened on purpose and can.
- **Not a dialog:** a task that must be finished before going on is a modal [Dialog](dialog.md).
- **Not a menu:** a list of actions is a [Menu](menu.md).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-size` | the popover or a container | `sm` · `md` · `lg` | theme decides | yes |

## Behavior

**The browser (T1):** the button opens and closes it; it opens under the button, from its start, and flips to fit; clicking outside or Escape closes it; another auto popover opening closes it (unless it opened from inside).

**canon.js (T2):**

- **Focus moves in** when it opens: to its `[autofocus]` element, else its first field or control, else the panel itself. Closing returns focus to the button.
- **Focus moving out** (Tab past its end, or to anywhere else in the page but its button) closes it.
- The button gets `aria-expanded`.
- A `popover="manual"` popover (always shown, as in documentation) is left alone.

## Core

- Anchored to its button (`position-area: self-block-end span-self-inline-end`, flipping), at most as tall as its room, then it scrolls.
- A form inside is not a size container, so it widens the popover; its rows stay rows.

## Accessibility

- `role="dialog"` with a name: screen readers announce the panel and its title when focus moves in; the button's `aria-expanded` says it is open.
- Non-modal: the rest of the page stays reachable; leaving the popover closes it, so it never lingers behind focus.

## Theme obligations

- The panel set off from the page (frame, background), its content spaced like a form.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| An arrow pointing at the button | The theme, if it wants one |
| Opening on hover (hover cards) | Later (`interestfor`, as Tooltip) |
| Placement hints | If it comes up (Tooltip's `data-placement`) |

## Look

**Sizes (sm / md / lg):** Padding 12 / 16 / 20px, the same between what it holds; corners 8 / 12 / 16; as wide as its content, at most 24rem.

The Menu panel (white, dark zinc-900; no frame: a hairline edge (black at 12%, dark white at 12%) and the floating shadow), 4px under its button, Form Layout's spacing inside (a form's actions a field step under its fields), the title Form Layout's section title (14 / 16 / 18px semibold).

**Motion:** opening, it fades in from 97% (0.15s); closing, it fades out where it is (0.1s). With reduced motion it only fades.
